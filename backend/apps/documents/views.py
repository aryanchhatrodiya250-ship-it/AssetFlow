from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time

from apps.core.mongo_client import get_db

db = get_db()

class DocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        category_filter = request.query_params.get("category", "")
        search_query = request.query_params.get("search", "").strip()
        
        query = {}
        if user.role == "Client":
            query["client_id"] = user.id
        elif request.query_params.get("client_id"):
            query["client_id"] = request.query_params.get("client_id")
            
        if category_filter:
            query["category"] = category_filter
            
        if search_query:
            query["$or"] = [
                {"file_name": {"$regex": search_query, "$options": "i"}},
                {"ocr_text": {"$regex": search_query, "$options": "i"}},
                {"category": {"$regex": search_query, "$options": "i"}}
            ]
            
        docs = list(db.documents.find(query).sort("upload_date", -1))
        for doc in docs:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            
        return Response(docs)

    def post(self, request):
        user = request.user
        data = request.data
        
        file_name = data.get("file_name")
        file_url = data.get("file_url", "https://assetflow-docs.s3.amazonaws.com/mock-upload.pdf")
        category = data.get("category", "PAN") # PAN, Aadhar, Sale Deed, Property Papers, Lease Agreement, Insurance, Tax Receipt, Invoice, Report
        expiry_date = data.get("expiry_date") # timestamp or string
        
        if not file_name:
            return Response({"error": "file_name is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Simulate AI OCR OCR Text extraction based on category
        ocr_mock = f"MOCK OCR EXTRACTED TEXT: Document category {category}. File name: {file_name}. "
        if category == "PAN":
            ocr_mock += "Permanent Account Number: BCDPK9281A. Name: CLIENT ACCOUNT. DOB: 1989-10-14."
        elif category == "Aadhar":
            ocr_mock += "Aadhaar Card Number: 9812 8734 1029. Government of India. Address: Hitech City, Hyderabad."
        elif category == "Sale Deed":
            ocr_mock += "DEED OF SALE. Reg No: 8812/2025. Between Landlord and Buyer. Property Address: Plot 52, Phase 2, Gachibowli."
        else:
            ocr_mock += "General verified financial ledger entry."
            
        doc_record = {
            "client_id": user.id if user.role == "Client" else data.get("client_id", user.id),
            "file_name": file_name,
            "file_url": file_url,
            "category": category,
            "upload_date": time.time(),
            "expiry_date": float(expiry_date) if expiry_date else None,
            "status": "Verified",
            "ocr_text": ocr_mock,
            "uploaded_by": str(user.id)
        }
        
        result = db.documents.insert_one(doc_record)
        doc_record["id"] = str(result.inserted_id)
        del doc_record["_id"]
        
        # If there is an expiry date, create a task/reminder automatically!
        if doc_record["expiry_date"]:
            db.tasks.insert_one({
                "title": f"Document Expiry: {doc_record['file_name']}",
                "description": f"The uploaded document {doc_record['file_name']} in category {doc_record['category']} is expiring. Please renew.",
                "category": "Renewal",
                "assigned_to": str(user.id),
                "client_id": doc_record["client_id"],
                "due_date": doc_record["expiry_date"] - 86400 * 7, # Remind 7 days before expiry
                "status": "Pending",
                "created_at": time.time()
            })
            
        return Response(doc_record, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = db.documents.find_one({"_id": ObjectId(pk)})
            if not doc:
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "Invalid document ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if request.user.role == "Client" and doc["client_id"] != request.user.id:
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
            
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        return Response(doc)

    def delete(self, request, pk):
        try:
            doc = db.documents.find_one({"_id": ObjectId(pk)})
            if not doc:
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "Invalid document ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if request.user.role == "Client" and doc["client_id"] != request.user.id:
            return Response({"error": "Unauthorized delete access"}, status=status.HTTP_403_FORBIDDEN)
            
        db.documents.delete_one({"_id": ObjectId(pk)})
        return Response({"message": "Document deleted successfully"})
