from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time

from apps.core.mongo_client import get_db
from apps.assets.serializers import AssetSerializer

db = get_db()

class AssetListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        search_query = request.query_params.get("search", "").strip()
        category_filter = request.query_params.get("category", "")
        status_filter = request.query_params.get("status", "")
        favorite_only = request.query_params.get("favorites", "") == "true"
        
        sort_by = request.query_params.get("sort_by", "created_at")
        sort_order = int(request.query_params.get("order", -1)) # -1 for desc, 1 for asc
        
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        
        # Build query
        query = {}
        if user.role == "Client":
            query["owner_id"] = user.id
        elif request.query_params.get("client_id"):
            query["owner_id"] = request.query_params.get("client_id")
            
        if category_filter:
            query["category"] = category_filter
            
        if status_filter:
            query["status"] = status_filter
            
        if favorite_only:
            query["favorites"] = user.id
            
        if search_query:
            query["$or"] = [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"subcategory": {"$regex": search_query, "$options": "i"}},
                {"tags": {"$regex": search_query, "$options": "i"}}
            ]
            
        # Execute query
        cursor = db.assets.find(query).skip(offset).limit(limit)
        
        # Apply sorting
        if sort_by in ["current_value", "purchase_price", "purchase_date", "roi", "created_at"]:
            cursor = cursor.sort(sort_by, sort_order)
            
        total = db.assets.count_documents(query)
        assets = list(cursor)
        
        for item in assets:
            item["id"] = str(item["_id"])
            del item["_id"]
            
        return Response({
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": assets
        })

    def post(self, request):
        serializer = AssetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # Enforce client owner if current user is Client
        if request.user.role == "Client":
            data["owner_id"] = request.user.id
            
        # Calculation helpers
        purchase = data["purchase_price"]
        current = data["current_value"]
        
        if purchase > 0:
            data["roi"] = round(((current - purchase) / purchase) * 100, 2)
            data["growth_pct"] = data["roi"]
        else:
            data["roi"] = 0.0
            data["growth_pct"] = 0.0
            
        # Initial valuation log
        data["valuation_history"] = [{
            "timestamp": time.time(),
            "value": current
        }]
        
        data["created_at"] = time.time()
        data["updated_at"] = time.time()
        
        result = db.assets.insert_one(data)
        data["id"] = str(result.inserted_id)
        del data["_id"]
        
        # Update client AUM (Portfolio Value) and Transactions
        self.register_transaction(data["owner_id"], "Buy Asset", purchase, str(result.inserted_id), f"Acquired {data['name']}")
        
        return Response(data, status=status.HTTP_201_CREATED)

    def register_transaction(self, client_id, type_str, amount, asset_id, desc):
        transaction = {
            "client_id": client_id,
            "type": type_str,
            "amount": amount,
            "asset_id": asset_id,
            "description": desc,
            "timestamp": time.time(),
            "status": "Completed"
        }
        db.transactions.insert_one(transaction)


class AssetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            asset_doc = db.assets.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid asset ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not asset_doc:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Verify access
        if request.user.role == "Client" and asset_doc["owner_id"] != request.user.id:
            return Response({"error": "Unauthorized access to asset"}, status=status.HTTP_403_FORBIDDEN)
            
        asset_doc["id"] = str(asset_doc["_id"])
        del asset_doc["_id"]
        return Response(asset_doc)

    def put(self, request, pk):
        try:
            asset_doc = db.assets.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid asset ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not asset_doc:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Verify access
        if request.user.role == "Client" and asset_doc["owner_id"] != request.user.id:
            return Response({"error": "Unauthorized modify access"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = AssetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # Enforce owner lock
        data["owner_id"] = asset_doc["owner_id"]
        
        # Check current value updates
        new_val = data["current_value"]
        old_val = asset_doc.get("current_value", 0.0)
        
        val_history = asset_doc.get("valuation_history", [])
        
        if abs(new_val - old_val) > 0.01:
            val_history.append({
                "timestamp": time.time(),
                "value": new_val
            })
            
            purchase = data["purchase_price"]
            if purchase > 0:
                data["roi"] = round(((new_val - purchase) / purchase) * 100, 2)
                data["growth_pct"] = data["roi"]
                
            # Log value changes in transaction registry
            txn_type = "Revaluation (Gain)" if new_val > old_val else "Revaluation (Loss)"
            self.register_transaction(data["owner_id"], txn_type, abs(new_val - old_val), pk, f"Asset revalued: {asset_doc['name']}")
            
        data["valuation_history"] = val_history
        data["updated_at"] = time.time()
        
        db.assets.update_one({"_id": ObjectId(pk)}, {"$set": data})
        
        data["id"] = pk
        return Response(data)

    def delete(self, request, pk):
        try:
            asset_doc = db.assets.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid asset ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not asset_doc:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role == "Client" and asset_doc["owner_id"] != request.user.id:
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
            
        # Log a liquidation transaction
        self.register_transaction(asset_doc["owner_id"], "Sell Asset", asset_doc["current_value"], pk, f"Liquidated {asset_doc['name']}")
        
        db.assets.delete_one({"_id": ObjectId(pk)})
        return Response({"message": "Asset deleted successfully"}, status=status.HTTP_200_OK)

    def register_transaction(self, client_id, type_str, amount, asset_id, desc):
        transaction = {
            "client_id": client_id,
            "type": type_str,
            "amount": amount,
            "asset_id": asset_id,
            "description": desc,
            "timestamp": time.time(),
            "status": "Completed"
        }
        db.transactions.insert_one(transaction)


class AssetFavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            asset = db.assets.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid asset ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not asset:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)
            
        user_id = str(request.user.id)
        favorites = asset.get("favorites", [])
        
        if user_id in favorites:
            favorites.remove(user_id)
            action = "removed from favorites"
        else:
            favorites.append(user_id)
            action = "added to favorites"
            
        db.assets.update_one({"_id": ObjectId(pk)}, {"$set": {"favorites": favorites, "updated_at": time.time()}})
        return Response({"message": f"Asset {action}", "favorites": favorites})


class RealEstateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        query = {"category": "Real Estate"}
        if user.role == "Client":
            query["owner_id"] = user.id
            
        properties = list(db.assets.find(query))
        for item in properties:
            item["id"] = str(item["_id"])
            del item["_id"]
            
        return Response(properties)
