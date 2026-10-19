from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time
from datetime import datetime

from apps.core.mongo_client import get_db
from apps.accounting.serializers import IncomeSerializer, ExpenseSerializer, InvoiceRequestSerializer

db = get_db()

class IncomeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        client_id = request.query_params.get("client_id")
        
        if user.role == "Client":
            client_id = user.id
        elif not client_id:
            return Response({"error": "client_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        incomes = list(db.income.find({"client_id": client_id}).sort("received_date", -1))
        for item in incomes:
            item["id"] = str(item["_id"])
            del item["_id"]
            
        return Response(incomes)

    def post(self, request):
        serializer = IncomeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        if request.user.role == "Client":
            data["client_id"] = request.user.id
            
        result = db.income.insert_one(data)
        data["id"] = str(result.inserted_id)
        del data["_id"]
        
        # Log to Transactions
        self.register_transaction(data["client_id"], "Income Received", data["amount"], f"Recorded {data['category']}: {data['description']}")
        
        return Response(data, status=status.HTTP_201_CREATED)

    def register_transaction(self, client_id, type_str, amount, desc):
        transaction = {
            "client_id": client_id,
            "type": type_str,
            "amount": amount,
            "description": desc,
            "timestamp": time.time(),
            "status": "Completed"
        }
        db.transactions.insert_one(transaction)


class ExpenseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        client_id = request.query_params.get("client_id")
        
        if user.role == "Client":
            client_id = user.id
        elif not client_id:
            return Response({"error": "client_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        expenses = list(db.expenses.find({"client_id": client_id}).sort("spent_date", -1))
        for item in expenses:
            item["id"] = str(item["_id"])
            del item["_id"]
            
        return Response(expenses)

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        if request.user.role == "Client":
            data["client_id"] = request.user.id
            
        result = db.expenses.insert_one(data)
        data["id"] = str(result.inserted_id)
        del data["_id"]
        
        # Log to Transactions
        self.register_transaction(data["client_id"], "Expense Spent", data["amount"], f"Recorded {data['category']}: {data['description']}")
        
        return Response(data, status=status.HTTP_201_CREATED)

    def register_transaction(self, client_id, type_str, amount, desc):
        transaction = {
            "client_id": client_id,
            "type": type_str,
            "amount": amount,
            "description": desc,
            "timestamp": time.time(),
            "status": "Completed"
        }
        db.transactions.insert_one(transaction)


class FinancialStatementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        client_id = request.query_params.get("client_id")
        
        if user.role == "Client":
            client_id = user.id
        elif not client_id:
            return Response({"error": "client_id query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Fetch incomes & expenses
        incomes = list(db.income.find({"client_id": client_id}))
        expenses = list(db.expenses.find({"client_id": client_id}))
        
        # 1. Ledger (Combined chronological journal)
        ledger = []
        for inc in incomes:
            ledger.append({
                "id": str(inc["_id"]),
                "date": inc.get("received_date", time.time()),
                "type": "Credit (Inflow)",
                "category": inc.get("category"),
                "amount": inc.get("amount", 0.0),
                "description": inc.get("description", "")
            })
        for exp in expenses:
            ledger.append({
                "id": str(exp["_id"]),
                "date": exp.get("spent_date", time.time()),
                "type": "Debit (Outflow)",
                "category": exp.get("category"),
                "amount": -exp.get("amount", 0.0),
                "description": exp.get("description", "")
            })
        # Sort chronologically, latest first
        ledger.sort(key=lambda x: x["date"], reverse=True)
        
        # 2. Profit & Loss (P&L) Statement
        total_income = sum(i.get("amount", 0.0) for i in incomes)
        total_expenses = sum(e.get("amount", 0.0) for e in expenses)
        net_profit = total_income - total_expenses
        
        incomes_by_category = {}
        for inc in incomes:
            cat = inc.get("category")
            incomes_by_category[cat] = incomes_by_category.get(cat, 0.0) + inc.get("amount", 0.0)
            
        expenses_by_category = {}
        for exp in expenses:
            cat = exp.get("category")
            expenses_by_category[cat] = expenses_by_category.get(cat, 0.0) + exp.get("amount", 0.0)
            
        p_and_l = {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "incomes_by_category": incomes_by_category,
            "expenses_by_category": expenses_by_category
        }
        
        # 3. Cash Flow Timeline (Past 12 Months)
        # We will create bucket dates
        current_year = datetime.now().year
        months_list = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        cash_flow_months = []
        for i in range(11, -1, -1):
            # Calculate past month offsets
            dt = datetime.now()
            # Simplistic mock months calculation
            m_idx = (dt.month - 1 - i) % 12
            y_offset = (dt.month - 1 - i) // 12
            m_name = months_list[m_idx]
            year = dt.year + y_offset
            
            # Sum for that month/year
            # Let's mock a distribution or map timestamps in Python.
            # In a real app we'd query Mongo using year/month bounds.
            cash_flow_months.append({
                "label": f"{m_name} {year}",
                "inflow": 0.0,
                "outflow": 0.0,
                "net": 0.0
            })
            
        # Map actual values to timeline buckets based on dates
        for item in ledger:
            dt = datetime.fromtimestamp(item["date"])
            label = f"{months_list[dt.month - 1]} {dt.year}"
            for m in cash_flow_months:
                if m["label"] == label:
                    if item["amount"] > 0:
                        m["inflow"] += item["amount"]
                    else:
                        m["outflow"] += abs(item["amount"])
                    m["net"] = m["inflow"] - m["outflow"]
                    break
                    
        # 4. Balance Sheet
        # Assets: Current Value of all Owned Active Assets + Bank Balances
        assets = list(db.assets.find({"owner_id": client_id, "status": "Active"}))
        total_assets_value = sum(a.get("current_value", 0.0) for a in assets)
        
        client_profile = None
        try:
            client_profile = db.clients.find_one({"_id": ObjectId(client_id)})
        except Exception:
            client_profile = None

        if not client_profile:
            client_profile = db.clients.find_one({"user_id": client_id})
        if not client_profile:
            client_profile = db.clients.find_one({"email": client_id})
        bank_balances = 0.0
        liabilities_loans = 0.0
        
        if client_profile:
            # Bank accounts balances
            for bank in client_profile.get("bank_accounts", []):
                bank_balances += bank.get("balance", 0.0)
            # Liabilities EMI/Debt estimations
            # If they have a loan expense, assume a mock liability principal of 15x EMI
            for exp in expenses:
                if exp.get("category") == "Loan EMI":
                    liabilities_loans += exp.get("amount", 0.0) * 12 # 1 year principal assumption
                    
        total_portfolio_value_calc = total_assets_value + bank_balances
        balance_sheet = {
            "assets": {
                "fixed_assets_portfolio": total_assets_value,
                "liquid_cash_bank": bank_balances,
                "total_assets": total_portfolio_value_calc
            },
            "liabilities": {
                "estimated_loans_outstanding": liabilities_loans,
                "total_liabilities": liabilities_loans
            },
            "equity": {
                "net_worth": total_portfolio_value_calc - liabilities_loans
            }
        }
        
        return Response({
            "p_and_l": p_and_l,
            "cash_flow": cash_flow_months,
            "balance_sheet": balance_sheet,
            "ledger": ledger[:50] # return latest 50 for page logs
        })


class GenerateInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InvoiceRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        inv_num = f"AF-{int(time.time())}"
        amount = data["amount"]
        gst_rate = data["gst_rate_pct"]
        
        # Calculate GST split
        cgst_rate = gst_rate / 2
        sgst_rate = gst_rate / 2
        
        cgst_amount = round(amount * (cgst_rate / 100), 2)
        sgst_amount = round(amount * (sgst_rate / 100), 2)
        total_gst = cgst_amount + sgst_amount
        grand_total = amount + total_gst
        
        invoice_doc = {
            "invoice_number": inv_num,
            "issuer_name": "AssetFlow Wealth Ltd.",
            "issuer_address": "Financial District, Hyderabad, India",
            "issuer_gstin": "36AAFCA8282B1Z1",
            "billed_to": {
                "name": data["billed_to_name"],
                "address": data["billed_to_address"],
                "gstin": data["billed_to_gstin"]
            },
            "item": {
                "description": data["item_description"],
                "subtotal": amount,
                "cgst_rate": cgst_rate,
                "cgst_amount": cgst_amount,
                "sgst_rate": sgst_rate,
                "sgst_amount": sgst_amount,
                "total_gst": total_gst,
                "grand_total": grand_total
            },
            "date": time.time(),
            "status": "Paid",
            "download_url_mock": f"/api/accounting/invoice/download/{inv_num}"
        }
        
        # Save to DB settings/reports or collections
        db.reports.insert_one({
            "client_id": str(request.user.id),
            "type": "Invoice",
            "reference_number": inv_num,
            "created_at": time.time(),
            "details": invoice_doc
        })
        
        return Response(invoice_doc, status=status.HTTP_201_CREATED)


class GenerateReceiptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")
        received_from = request.data.get("received_from")
        purpose = request.data.get("purpose")
        
        if amount is None or not received_from or not purpose:
            return Response({"error": "amount, received_from, and purpose are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        receipt_num = f"REC-{int(time.time())}"
        receipt = {
            "receipt_number": receipt_num,
            "received_from": received_from,
            "amount": float(amount),
            "purpose": purpose,
            "date": time.time(),
            "payment_mode": request.data.get("payment_mode", "Bank Transfer"),
            "status": "Settled",
            "download_url_mock": f"/api/accounting/receipt/download/{receipt_num}"
        }
        
        # Save report log
        db.reports.insert_one({
            "client_id": str(request.user.id),
            "type": "Receipt",
            "reference_number": receipt_num,
            "created_at": time.time(),
            "details": receipt
        })
        
        return Response(receipt, status=status.HTTP_201_CREATED)
