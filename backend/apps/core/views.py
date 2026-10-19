from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time

from apps.core.mongo_client import get_db

db = get_db()

class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        user = request.user
        
        if not q:
            return Response({
                "clients": [],
                "assets": [],
                "documents": [],
                "rental": [],
                "income": [],
                "transactions": []
            })
            
        regex_query = {"$regex": q, "$options": "i"}
        
        # Determine client scoping
        client_id = None
        if user.role == "Client":
            client_id = user.id
            
        results = {}
        
        # 1. Search Assets
        asset_query = {
            "$or": [
                {"name": regex_query},
                {"category": regex_query},
                {"subcategory": regex_query},
                {"remarks": regex_query}
            ]
        }
        if client_id:
            asset_query["owner_id"] = client_id
        assets_res = list(db.assets.find(asset_query).limit(10))
        for a in assets_res:
            a["id"] = str(a["_id"])
            del a["_id"]
        results["assets"] = assets_res
        
        # 2. Search Documents
        doc_query = {
            "$or": [
                {"file_name": regex_query},
                {"category": regex_query},
                {"ocr_text": regex_query}
            ]
        }
        if client_id:
            doc_query["client_id"] = client_id
        docs_res = list(db.documents.find(doc_query).limit(10))
        for d in docs_res:
            d["id"] = str(d["_id"])
            del d["_id"]
        results["documents"] = docs_res
        
        # 3. Search Income
        inc_query = {
            "$or": [
                {"category": regex_query},
                {"description": regex_query},
                {"tax_classification": regex_query}
            ]
        }
        if client_id:
            inc_query["client_id"] = client_id
        inc_res = list(db.income.find(inc_query).limit(10))
        for i in inc_res:
            i["id"] = str(i["_id"])
            del i["_id"]
        results["income"] = inc_res
        
        # 4. Search Transactions
        txn_query = {
            "$or": [
                {"type": regex_query},
                {"description": regex_query}
            ]
        }
        if client_id:
            txn_query["client_id"] = client_id
        txn_res = list(db.transactions.find(txn_query).limit(10))
        for t in txn_res:
            t["id"] = str(t["_id"])
            del t["_id"]
        results["transactions"] = txn_res
        
        # 5. Search Leases / Rental (Staff or specific owner property)
        rental_query = {
            "$or": [
                {"tenant_name": regex_query},
                {"tenant_email": regex_query}
            ]
        }
        if client_id:
            # First filter properties owned by client
            client_props = [str(p["id"]) for p in assets_res if p.get("category") == "Real Estate"]
            # Or fetch all properties if not in search results
            if not client_props:
                c_props = list(db.assets.find({"owner_id": client_id, "category": "Real Estate"}))
                client_props = [str(p["_id"]) for p in c_props]
            rental_query["property_id"] = {"$in": client_props}
            
        rental_res = list(db.rental.find(rental_query).limit(10))
        for r in rental_res:
            r["id"] = str(r["_id"])
            del r["_id"]
        results["rental"] = rental_res
        
        # 6. Search Clients (Staff Only)
        if user.role != "Client":
            client_query = {
                "$or": [
                    {"personal_details.first_name": regex_query},
                    {"personal_details.last_name": regex_query},
                    {"occupation": regex_query},
                    {"risk_profile": regex_query}
                ]
            }
            client_res = list(db.clients.find(client_query).limit(10))
            for c in client_res:
                c["id"] = str(c["_id"])
                del c["_id"]
            results["clients"] = client_res
        else:
            results["clients"] = []
            
        return Response(results)
