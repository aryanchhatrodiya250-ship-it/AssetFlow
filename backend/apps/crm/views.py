from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time

from apps.core.mongo_client import get_db
from apps.core.permissions import IsAdvisorOrManager

db = get_db()

class LeadListView(APIView):
    permission_classes = [IsAdvisorOrManager]

    def get(self, request):
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        status_filter = request.query_params.get("status", "")
        
        query = {}
        if request.user.role != "Super Admin":
            query["assigned_to"] = str(request.user.id)
            
        if status_filter:
            query["status"] = status_filter
            
        leads = list(db.crm_leads.find(query).skip(offset).limit(limit).sort("created_at", -1))
        total = db.crm_leads.count_documents(query)
        
        for lead in leads:
            lead["id"] = str(lead["_id"])
            del lead["_id"]
            
        return Response({
            "total": total,
            "results": leads
        })

    def post(self, request):
        data = request.data
        lead_doc = {
            "name": data.get("name"),
            "email": data.get("email"),
            "phone": data.get("phone", ""),
            "status": data.get("status", "Prospect"), # Prospect, Contacted, Proposal, Won, Lost
            "assigned_to": str(request.user.id),
            "notes": data.get("notes", ""),
            "follow_up_date": data.get("follow_up_date", time.time() + 86400 * 3),
            "created_at": time.time(),
            "updated_at": time.time()
        }
        
        result = db.crm_leads.insert_one(lead_doc)
        lead_doc["id"] = str(result.inserted_id)
        del lead_doc["_id"]
        return Response(lead_doc, status=status.HTTP_201_CREATED)


class LeadDetailView(APIView):
    permission_classes = [IsAdvisorOrManager]

    def get(self, request, pk):
        try:
            lead = db.crm_leads.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid lead ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not lead:
            return Response({"error": "Lead not found"}, status=status.HTTP_404_NOT_FOUND)
            
        lead["id"] = str(lead["_id"])
        del lead["_id"]
        return Response(lead)

    def put(self, request, pk):
        try:
            lead = db.crm_leads.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid lead ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not lead:
            return Response({"error": "Lead not found"}, status=status.HTTP_404_NOT_FOUND)
            
        data = request.data
        update_fields = {
            "name": data.get("name", lead.get("name")),
            "email": data.get("email", lead.get("email")),
            "phone": data.get("phone", lead.get("phone")),
            "status": data.get("status", lead.get("status")),
            "notes": data.get("notes", lead.get("notes")),
            "follow_up_date": data.get("follow_up_date", lead.get("follow_up_date")),
            "updated_at": time.time()
        }
        
        db.crm_leads.update_one({"_id": ObjectId(pk)}, {"$set": update_fields})
        update_fields["id"] = pk
        return Response(update_fields)

    def delete(self, request, pk):
        try:
            result = db.crm_leads.delete_one({"_id": ObjectId(pk)})
            if result.deleted_count == 0:
                return Response({"error": "Lead not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"message": "Lead deleted successfully"})
        except Exception:
            return Response({"error": "Invalid lead ID"}, status=status.HTTP_400_BAD_REQUEST)


class MeetingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        query = {}
        if user.role == "Client":
            query["client_id"] = str(user.id)
        elif request.query_params.get("client_id"):
            query["client_id"] = request.query_params.get("client_id")
        else:
            if user.role != "Super Admin":
                query["host_id"] = str(user.id)
                
        meetings = list(db.meetings.find(query).sort("date_time", 1))
        for m in meetings:
            m["id"] = str(m["_id"])
            del m["_id"]
            
        return Response(meetings)

    def post(self, request):
        data = request.data
        meeting = {
            "title": data.get("title"),
            "client_id": data.get("client_id"),
            "host_id": str(request.user.id),
            "date_time": data.get("date_time", time.time() + 3600),
            "duration": int(data.get("duration", 30)),
            "notes": data.get("notes", ""),
            "type": data.get("type", "Call"),
            "created_at": time.time()
        }
        
        result = db.meetings.insert_one(meeting)
        meeting["id"] = str(result.inserted_id)
        del meeting["_id"]
        
        db.tasks.insert_one({
            "title": f"Meeting: {meeting['title']}",
            "description": f"CRM meeting schedule: {meeting['notes']}",
            "category": "Client Meeting",
            "assigned_to": meeting["host_id"],
            "client_id": meeting["client_id"],
            "due_date": meeting["date_time"],
            "status": "Pending",
            "created_at": time.time()
        })
        
        return Response(meeting, status=status.HTTP_201_CREATED)


class MeetingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            meeting = db.meetings.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid meeting ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not meeting:
            return Response({"error": "Meeting not found"}, status=status.HTTP_404_NOT_FOUND)
            
        data = request.data
        new_date_time = data.get("date_time", meeting.get("date_time"))
        new_notes = data.get("notes", meeting.get("notes"))
        
        update_fields = {
            "date_time": float(new_date_time) if new_date_time else meeting.get("date_time"),
            "notes": new_notes,
            "updated_at": time.time()
        }
        
        db.meetings.update_one({"_id": ObjectId(pk)}, {"$set": update_fields})
        
        # Also update corresponding task due_date & description if they exist
        db.tasks.update_many(
            {"title": f"Meeting: {meeting['title']}", "client_id": meeting['client_id']},
            {"$set": {"due_date": update_fields["date_time"], "description": f"CRM meeting schedule: {new_notes}"}}
        )
        
        update_fields["id"] = pk
        return Response(update_fields)

    def delete(self, request, pk):
        try:
            result = db.meetings.delete_one({"_id": ObjectId(pk)})
            if result.deleted_count == 0:
                return Response({"error": "Meeting not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Also clean up corresponding meeting tasks
            db.tasks.delete_many({"client_id": str(request.user.id), "category": "Client Meeting"})
            
            return Response({"message": "Meeting cancelled successfully"})
        except Exception as e:
            return Response({"error": f"Invalid meeting ID or error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class TaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        query = {}
        
        # Clients view tasks assigned to them/concerning them
        if user.role == "Client":
            query["client_id"] = str(user.id)
        elif request.query_params.get("client_id"):
            query["client_id"] = request.query_params.get("client_id")
        else:
            if user.role != "Super Admin":
                query["assigned_to"] = str(user.id)
                
        tasks = list(db.tasks.find(query).sort("due_date", 1))
        for t in tasks:
            t["id"] = str(t["_id"])
            del t["_id"]
            
        return Response(tasks)

    def post(self, request):
        data = request.data
        task_doc = {
            "title": data.get("title"),
            "description": data.get("description", ""),
            "category": data.get("category", "KYC Verification"), # Property Visit, Maintenance, KYC Verification, Client Meeting, Renewal
            "assigned_to": data.get("assigned_to", str(request.user.id)),
            "client_id": data.get("client_id", ""),
            "due_date": float(data.get("due_date", time.time() + 86400)), # timestamp
            "status": data.get("status", "Pending"), # Pending, In Progress, Completed
            "created_at": time.time()
        }
        
        result = db.tasks.insert_one(task_doc)
        task_doc["id"] = str(result.inserted_id)
        del task_doc["_id"]
        
        return Response(task_doc, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            task = db.tasks.find_one({"_id": ObjectId(pk)})
            if not task:
                return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "Invalid task ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        data = request.data
        update_fields = {
            "title": data.get("title", task.get("title")),
            "description": data.get("description", task.get("description")),
            "category": data.get("category", task.get("category")),
            "status": data.get("status", task.get("status")),
            "due_date": float(data.get("due_date", task.get("due_date"))),
            "assigned_to": data.get("assigned_to", task.get("assigned_to"))
        }
        
        db.tasks.update_one({"_id": ObjectId(pk)}, {"$set": update_fields})
        update_fields["id"] = pk
        return Response(update_fields)

    def delete(self, request, pk):
        try:
            result = db.tasks.delete_one({"_id": ObjectId(pk)})
            if result.deleted_count == 0:
                return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"message": "Task deleted successfully"})
        except Exception:
            return Response({"error": "Invalid task ID"}, status=status.HTTP_400_BAD_REQUEST)
