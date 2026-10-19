from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time

from apps.core.mongo_client import get_db
from apps.core.permissions import IsAdvisorOrManager, role_required
from apps.clients.serializers import ClientProfileUpdateSerializer

db = get_db()

def calculate_completion(doc):
    pct = 0
    # Personal details (20%)
    pd = doc.get("personal_details", {})
    if pd.get("first_name") and pd.get("last_name") and pd.get("phone"):
        pct += 20
    elif pd.get("first_name") or pd.get("last_name"):
        pct += 10
        
    # KYC (30%)
    kyc = doc.get("kyc", {})
    if kyc.get("pan") and kyc.get("aadhar"):
        pct += 30
    elif kyc.get("pan") or kyc.get("aadhar"):
        pct += 15
        
    # Nominee (15%)
    nom = doc.get("nominee", {})
    if nom.get("name") and nom.get("relationship"):
        pct += 15
    elif nom.get("name"):
        pct += 10
        
    # Bank accounts (15%)
    bank = doc.get("bank_accounts", [])
    if len(bank) > 0:
        pct += 15
        
    # Income (10%)
    inc = doc.get("income", {})
    if inc.get("annual_range") or inc.get("monthly_salary", 0) > 0:
        pct += 10
        
    # Risk Profile (10%)
    if doc.get("risk_profile"):
        pct += 10
        
    return min(pct, 100)


class ClientProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target_user_id = request.query_params.get("client_id")
        
        # If user is a Client, they can only view their own profile
        if user.role == "Client":
            target_user_id = user.id
        elif not target_user_id:
            # Staff requesting without target sees their own user details, or Client profile if they have one
            target_user_id = user.id
            
        client_doc = db.clients.find_one({"_id": ObjectId(target_user_id)})
        
        # Check advisor authorization
        if user.role not in ["Super Admin", "Client"]:
            if client_doc and client_doc.get("assigned_advisor_id") != str(user.id):
                return Response({"error": "Unauthorized. You are not assigned to this client."}, status=status.HTTP_403_FORBIDDEN)

        if not client_doc:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
                
        client_doc["id"] = str(client_doc["_id"])
        del client_doc["_id"]
        
        # Attach detailed assigned advisor information
        advisor_id = client_doc.get("assigned_advisor_id")
        if advisor_id:
            try:
                adv_doc = db.advisors.find_one({"_id": ObjectId(advisor_id)})
                if adv_doc:
                    client_doc["assigned_advisor"] = {
                        "id": str(adv_doc["_id"]),
                        "name": adv_doc.get("name") or adv_doc.get("username"),
                        "email": adv_doc.get("email"),
                        "phone": adv_doc.get("phone") or "+91 99000 12345"
                    }
            except Exception:
                pass
            
        return Response(client_doc)

    def put(self, request):
        user = request.user
        target_user_id = request.data.get("client_id")
        
        # Determine target user
        if user.role == "Client":
            target_user_id = user.id
        elif not target_user_id:
            target_user_id = user.id
            
        client_doc = db.clients.find_one({"_id": ObjectId(target_user_id)})
        if not client_doc:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Check advisor authorization
        if user.role not in ["Super Admin", "Client"]:
            if client_doc.get("assigned_advisor_id") != str(user.id):
                return Response({"error": "Unauthorized. You cannot modify other advisor's client profiles."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ClientProfileUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            with open("request_logs.txt", "a") as f:
                f.write(f"\n[VALIDATION ERROR]: {serializer.errors}\n")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # Update logic
        update_fields = {}
        for field in data:
            update_fields[field] = data[field]
            
        # Re-calculate profile completion
        temp_doc = {**client_doc, **update_fields}
        update_fields["profile_completion_pct"] = calculate_completion(temp_doc)
        update_fields["updated_at"] = time.time()
        
        db.clients.update_one({"_id": ObjectId(target_user_id)}, {"$set": update_fields})
        
        return Response({
            "message": "Profile updated successfully",
            "profile_completion_pct": update_fields["profile_completion_pct"]
        })


class ClientListView(APIView):
    permission_classes = [IsAdvisorOrManager]

    def get(self, request):
        user = request.user
        search_query = request.query_params.get("search", "").strip()
        risk_filter = request.query_params.get("risk_profile", "")
        kyc_filter = request.query_params.get("kyc_status", "")
        
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        
        # Setup aggregation matches
        match_stage = {}
        if risk_filter:
            match_stage["risk_profile"] = risk_filter
        if kyc_filter:
            match_stage["kyc.status"] = kyc_filter
            
        # If user is not Super Admin, filter to only show clients assigned to this advisor
        if user.role not in ["Super Admin", "Client"]:
            match_stage["assigned_advisor_id"] = str(user.id)
            
        # If global search is active
        if search_query:
            match_stage["$or"] = [
                {"personal_details.first_name": {"$regex": search_query, "$options": "i"}},
                {"personal_details.last_name": {"$regex": search_query, "$options": "i"}},
                {"email": {"$regex": search_query, "$options": "i"}},
                {"username": {"$regex": search_query, "$options": "i"}}
            ]
            
        pipeline = [
            {"$match": match_stage},
            # Pagination
            {"$facet": {
                "metadata": [{"$count": "total"}],
                "data": [{"$skip": offset}, {"$limit": limit}]
            }}
        ]
        
        results = list(db.clients.aggregate(pipeline))
        
        total = 0
        data = []
        if results and results[0]["metadata"]:
            total = results[0]["metadata"][0]["total"]
            data = results[0]["data"]
            
        # Clean output
        for item in data:
            item["id"] = str(item["_id"])
            del item["_id"]
                
        return Response({
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": data
        })


class VerifyKYCView(APIView):
    permission_classes = [role_required("Super Admin", "Accountant", "Legal Team")]

    def post(self, request):
        client_user_id = request.data.get("client_id")
        kyc_status = request.data.get("status") # Verified or Rejected
        
        if not client_user_id or kyc_status not in ["Verified", "Rejected"]:
            return Response({"error": "client_id and status (Verified/Rejected) are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        client_doc = db.clients.find_one({"_id": ObjectId(client_user_id)})
        if not client_doc:
            return Response({"error": "Client profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
        db.clients.update_one(
            {"_id": ObjectId(client_user_id)},
            {
                "$set": {
                    "kyc.status": kyc_status,
                    "kyc.verified_at": time.time(),
                    "kyc.verifier_id": str(request.user.id),
                    "updated_at": time.time()
                }
            }
        )
        
        return Response({"message": f"Client KYC status updated to {kyc_status}"})
