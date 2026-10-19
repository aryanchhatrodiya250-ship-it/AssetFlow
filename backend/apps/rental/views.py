from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time

from apps.core.mongo_client import get_db
from apps.rental.serializers import LeaseSerializer, RentPaymentRecordSerializer, MaintenanceRequestSerializer

db = get_db()

class LeaseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        
        # Determine accessible property IDs
        property_ids = []
        if user.role == "Client":
            client_properties = list(db.assets.find({"owner_id": user.id, "category": "Real Estate"}))
            property_ids = [str(p["_id"]) for p in client_properties]
        elif request.query_params.get("client_id"):
            client_properties = list(db.assets.find({"owner_id": request.query_params.get("client_id"), "category": "Real Estate"}))
            property_ids = [str(p["_id"]) for p in client_properties]
            
        query = {}
        # If filtering is constrained by client property ownership
        if user.role == "Client" or request.query_params.get("client_id"):
            query["property_id"] = {"$in": property_ids}
            
        cursor = db.rental.find(query).skip(offset).limit(limit)
        total = db.rental.count_documents(query)
        leases = list(cursor)
        
        for item in leases:
            item["id"] = str(item["_id"])
            del item["_id"]
            # Append property details
            try:
                prop = db.assets.find_one({"_id": ObjectId(item["property_id"])})
                if prop:
                    item["property_name"] = prop.get("name")
                    item["property_address"] = prop.get("address")
            except Exception:
                pass
                
        return Response({
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": leases
        })

    def post(self, request):
        serializer = LeaseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # Verify property ownership
        try:
            prop = db.assets.find_one({"_id": ObjectId(data["property_id"])})
            if not prop:
                return Response({"error": "Property asset not found"}, status=status.HTTP_404_NOT_FOUND)
                
            if request.user.role == "Client" and prop["owner_id"] != request.user.id:
                return Response({"error": "Unauthorized property access"}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"error": "Invalid property ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        data["payment_history"] = []
        data["maintenance_requests"] = []
        data["created_at"] = time.time()
        data["updated_at"] = time.time()
        
        result = db.rental.insert_one(data)
        data["id"] = str(result.inserted_id)
        del data["_id"]
        
        # Update occupancy status on property
        db.assets.update_one({"_id": ObjectId(data["property_id"])}, {"$set": {"status": "Active"}})
        
        return Response(data, status=status.HTTP_201_CREATED)


class LeaseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            lease = db.rental.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid lease ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not lease:
            return Response({"error": "Lease not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Verify owner access
        prop = db.assets.find_one({"_id": ObjectId(lease["property_id"])})
        if request.user.role == "Client" and (not prop or prop["owner_id"] != request.user.id):
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
            
        lease["id"] = str(lease["_id"])
        del lease["_id"]
        if prop:
            lease["property_name"] = prop.get("name")
            lease["property_address"] = prop.get("address")
            
        return Response(lease)

    def put(self, request, pk):
        try:
            lease = db.rental.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid lease ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not lease:
            return Response({"error": "Lease not found"}, status=status.HTTP_404_NOT_FOUND)
            
        prop = db.assets.find_one({"_id": ObjectId(lease["property_id"])})
        if request.user.role == "Client" and (not prop or prop["owner_id"] != request.user.id):
            return Response({"error": "Unauthorized modify access"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = LeaseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # Maintain history fields
        data["payment_history"] = lease.get("payment_history", [])
        data["maintenance_requests"] = lease.get("maintenance_requests", [])
        data["updated_at"] = time.time()
        
        db.rental.update_one({"_id": ObjectId(pk)}, {"$set": data})
        data["id"] = pk
        return Response(data)

    def delete(self, request, pk):
        try:
            lease = db.rental.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid lease ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not lease:
            return Response({"error": "Lease not found"}, status=status.HTTP_404_NOT_FOUND)
            
        prop = db.assets.find_one({"_id": ObjectId(lease["property_id"])})
        if request.user.role == "Client" and (not prop or prop["owner_id"] != request.user.id):
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
            
        db.rental.delete_one({"_id": ObjectId(pk)})
        return Response({"message": "Lease contract deleted successfully"})


class RecordRentPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lease_id = request.data.get("lease_id")
        amount = request.data.get("amount")
        month = request.data.get("month")
        
        if not lease_id or amount is None or not month:
            return Response({"error": "lease_id, amount, and month are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            lease = db.rental.find_one({"_id": ObjectId(lease_id)})
            if not lease:
                return Response({"error": "Lease not found"}, status=status.HTTP_404_NOT_FOUND)
                
            prop = db.assets.find_one({"_id": ObjectId(lease["property_id"])})
            if not prop:
                return Response({"error": "Associated property not found"}, status=status.HTTP_404_NOT_FOUND)
                
            if request.user.role == "Client" and prop["owner_id"] != request.user.id:
                return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"error": "Invalid lease or property ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        payment_record = {
            "payment_id": str(ObjectId()),
            "amount": float(amount),
            "month": month,
            "date_paid": time.time(),
            "status": "Paid"
        }
        
        # Append to lease payment history
        db.rental.update_one(
            {"_id": ObjectId(lease_id)},
            {
                "$push": {"payment_history": payment_record},
                "$set": {"updated_at": time.time()}
            }
        )
        
        # Record dynamic client Income
        income_doc = {
            "client_id": prop["owner_id"],
            "category": "Rental Income",
            "amount": float(amount),
            "received_date": time.time(),
            "tax_classification": "House Property Income",
            "description": f"Rent payment from {lease['tenant_name']} for {prop['name']} ({month})"
        }
        db.income.insert_one(income_doc)
        
        # Record global Transaction
        transaction = {
            "client_id": prop["owner_id"],
            "type": "Rent Collected",
            "amount": float(amount),
            "asset_id": lease["property_id"],
            "description": f"Rent collected: {prop['name']} - {month}",
            "timestamp": time.time(),
            "status": "Completed"
        }
        db.transactions.insert_one(transaction)
        
        # Aggregate property statistics: increase asset accumulated income
        current_inc = prop.get("income_generated", 0.0) + float(amount)
        db.assets.update_one(
            {"_id": ObjectId(lease["property_id"])},
            {"$set": {"income_generated": current_inc, "updated_at": time.time()}}
        )
        
        return Response({"message": "Rent payment recorded successfully", "payment": payment_record})


class RecordMaintenanceRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lease_id = request.data.get("lease_id")
        issue = request.data.get("issue")
        cost = request.data.get("cost", 0.0)
        status_req = request.data.get("status", "Pending")
        
        if not lease_id or not issue:
            return Response({"error": "lease_id and issue description are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            lease = db.rental.find_one({"_id": ObjectId(lease_id)})
            if not lease:
                return Response({"error": "Lease not found"}, status=status.HTTP_404_NOT_FOUND)
                
            prop = db.assets.find_one({"_id": ObjectId(lease["property_id"])})
            if not prop:
                return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)
                
            if request.user.role == "Client" and prop["owner_id"] != request.user.id:
                return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"error": "Invalid lease ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        req_record = {
            "request_id": str(ObjectId()),
            "issue": issue,
            "cost": float(cost),
            "status": status_req,
            "date_created": time.time()
        }
        
        # Push to lease maintenance requests
        db.rental.update_one(
            {"_id": ObjectId(lease_id)},
            {
                "$push": {"maintenance_requests": req_record},
                "$set": {"updated_at": time.time()}
            }
        )
        
        # If cost > 0, record in dynamic client expenses
        if float(cost) > 0.0:
            expense_doc = {
                "client_id": prop["owner_id"],
                "asset_id": lease["property_id"],
                "category": "Maintenance & Repairs",
                "amount": float(cost),
                "spent_date": time.time(),
                "description": f"Maintenance expense for {prop['name']}: {issue}"
            }
            db.expenses.insert_one(expense_doc)
            
            # Record global Transaction
            transaction = {
                "client_id": prop["owner_id"],
                "type": "Maintenance Paid",
                "amount": float(cost),
                "asset_id": lease["property_id"],
                "description": f"Paid maintenance for {prop['name']}: {issue}",
                "timestamp": time.time(),
                "status": "Completed"
            }
            db.transactions.insert_one(transaction)
            
            # Accumulate on property costs
            curr_maint = prop.get("maintenance_cost", 0.0) + float(cost)
            db.assets.update_one(
                {"_id": ObjectId(lease["property_id"])},
                {"$set": {"maintenance_cost": curr_maint, "updated_at": time.time()}}
            )
            
        return Response({"message": "Maintenance request recorded successfully", "request": req_record})


class RentalAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        client_id = request.query_params.get("client_id")
        
        if user.role == "Client":
            client_id = user.id
            
        query = {}
        # Fetch matching real estate properties
        re_query = {"category": "Real Estate"}
        if client_id:
            re_query["owner_id"] = client_id
            
        properties = list(db.assets.find(re_query))
        prop_ids = [str(p["_id"]) for p in properties]
        
        # Fetch Leases
        leases_query = {"property_id": {"$in": prop_ids}}
        leases = list(db.rental.find(leases_query))
        
        # Calculate stats
        total_properties = len(properties)
        total_active_leases = sum(1 for l in leases if l.get("status") == "Active")
        occupancy_rate = round((total_active_leases / total_properties) * 100, 2) if total_properties > 0 else 0.0
        
        total_rent_collected = 0.0
        total_maintenance_spent = 0.0
        
        for l in leases:
            for p in l.get("payment_history", []):
                if p.get("status") == "Paid":
                    total_rent_collected += p.get("amount", 0.0)
            for m in l.get("maintenance_requests", []):
                total_maintenance_spent += m.get("cost", 0.0)
                
        return Response({
            "total_properties": total_properties,
            "active_leases": total_active_leases,
            "occupancy_rate": occupancy_rate,
            "total_rent_collected": total_rent_collected,
            "total_maintenance_spent": total_maintenance_spent,
            "net_cash_flow": total_rent_collected - total_maintenance_spent
        })
