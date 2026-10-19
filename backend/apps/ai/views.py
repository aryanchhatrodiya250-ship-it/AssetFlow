from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time
import re

from apps.core.mongo_client import get_db

db = get_db()

class AILiveSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query_text = request.data.get("query", "").strip()
        user = request.user
        
        if not query_text:
            return Response({"error": "Query string is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Parse logic
        query = {}
        if user.role == "Client":
            query["owner_id"] = user.id
            
        # 1. Detect category
        if any(w in query_text.lower() for w in ["rental", "properties", "real estate", "house", "building", "land"]):
            query["category"] = "Real Estate"
        elif any(w in query_text.lower() for w in ["stock", "shares", "equity"]):
            query["category"] = "Stocks"
        elif "crypto" in query_text.lower():
            query["category"] = "Crypto"
        elif "gold" in query_text.lower():
            query["category"] = "Gold & Precious Metals"
            
        # 2. Parse numbers and comparison
        numbers = [int(s) for s in re.findall(r'\b\d+\b', query_text)]
        number = numbers[0] if numbers else None
        
        field = "current_value"
        if "generating" in query_text.lower() or "income" in query_text.lower() or "rent" in query_text.lower():
            field = "income_generated"
        elif "purchase" in query_text.lower() or "price" in query_text.lower() or "cost" in query_text.lower():
            field = "purchase_price"
            
        if number is not None:
            if any(w in query_text.lower() for w in ["above", "greater", "more", "over", ">"]):
                query[field] = {"$gt": float(number)}
            elif any(w in query_text.lower() for w in ["below", "less", "under", "<"]):
                query[field] = {"$lt": float(number)}
            else:
                query[field] = float(number)
                
        # Run dynamic query
        assets = list(db.assets.find(query))
        for a in assets:
            a["id"] = str(a["_id"])
            del a["_id"]
            
        return Response({
            "parsed_query": str(query),
            "original_query": query_text,
            "results_count": len(assets),
            "results": assets
        })


class AIPredictionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        client_id = request.query_params.get("client_id")
        
        if user.role == "Client":
            client_id = user.id
        elif not client_id:
            return Response({"error": "client_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Fetch client data
        assets = list(db.assets.find({"owner_id": client_id, "status": "Active"}))
        total_value = sum(a.get("current_value", 0.0) for a in assets)
        
        # Real Estate specific predictions
        re_assets = [a for a in assets if a.get("category") == "Real Estate"]
        re_predictions = []
        for prop in re_assets:
            val = prop.get("current_value", 0.0)
            appreciation_rate = 0.06 # mock 6% appreciation
            predicted_value_3_yr = round(val * ((1 + appreciation_rate) ** 3), 2)
            predicted_value_5_yr = round(val * ((1 + appreciation_rate) ** 5), 2)
            purchase_price = prop.get("purchase_price", 0.0) or 1.0
            predicted_yield = round((prop.get("income_generated", 0.0) / purchase_price) * 100, 2)
            
            re_predictions.append({
                "property_id": str(prop["_id"]),
                "name": prop.get("name"),
                "current_value": val,
                "predicted_yield_pct": predicted_yield if predicted_yield > 0 else 5.4, # fallback to standard
                "predicted_value_3_years": predicted_value_3_yr,
                "predicted_value_5_years": predicted_value_5_yr
            })
            
        # Income vs Expense trend prediction (Linear projection)
        incomes = list(db.income.find({"client_id": client_id}))
        expenses = list(db.expenses.find({"client_id": client_id}))
        
        monthly_income_avg = sum(i.get("amount", 0.0) for i in incomes) / 12 if incomes else 100000.0 # fallback mock
        monthly_expense_avg = sum(e.get("amount", 0.0) for e in expenses) / 12 if expenses else 40000.0
        
        # Project 6 months future
        predicted_income_6m = round(monthly_income_avg * 1.04, 2) # mock 4% growth
        predicted_expense_6m = round(monthly_expense_avg * 1.02, 2) # mock 2% inflation growth
        
        # Portfolio Health Score calculation
        # Factors: profile completion, diversification rating, returns, risk mismatch
        client_profile = db.clients.find_one({"user_id": client_id})
        profile_completion = client_profile.get("profile_completion_pct", 50) if client_profile else 50
        kyc_verified = client_profile.get("kyc", {}).get("status") == "Verified" if client_profile else False
        
        score = 60 # base
        if profile_completion > 80: score += 10
        if kyc_verified: score += 10
        if len(assets) >= 5: score += 15
        elif len(assets) >= 3: score += 10
        
        returns_pct = 0.0
        total_invested = sum(a.get("purchase_price", 0.0) for a in assets)
        if total_invested > 0:
            returns_pct = ((total_value - total_invested) / total_invested) * 100
            
        if returns_pct > 15: score += 10
        elif returns_pct > 5: score += 5
        elif returns_pct < 0: score -= 10
        
        score = min(max(score, 20), 100) # clip between 20 and 100
        
        health_status = "Good"
        if score > 85: health_status = "Excellent"
        elif score < 50: health_status = "Needs Rebalancing"
        
        return Response({
            "portfolio_health_score": score,
            "portfolio_health_status": health_status,
            "property_predictions": re_predictions,
            "predicted_monthly_income_6_months": predicted_income_6m,
            "predicted_monthly_expense_6_months": predicted_expense_6m,
            "predicted_net_savings_6_months": round(predicted_income_6m - predicted_expense_6m, 2),
            "market_trend_summary": "Global markets are showing moderate recovery with strong momentum in technology sector equities. Real Estate continues to offer robust rental yield growth as urban demand stabilizes.",
            "recommendation_engine": {
                "risk_profile": client_profile.get("risk_profile", "Moderate") if client_profile else "Moderate",
                "recommended_assets": [
                    {"name": "Nifty 50 Index Mutual Fund", "category": "Mutual Funds", "reason": "Consistent compound growth with lower expense ratios."},
                    {"name": "Sovereign Gold Bonds (SGB)", "category": "Bonds", "reason": "Sovereign backing, tax-free capital gains, and 2.5% yield hedge."},
                    {"name": "Premium Warehousing Property", "category": "Real Estate", "reason": "Subcategory warehouse yields are climbing at 8-9% annually."}
                ]
            }
        })
