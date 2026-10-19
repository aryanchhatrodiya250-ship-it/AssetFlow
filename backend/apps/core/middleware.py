import time
from django.utils.deprecation import MiddlewareMixin
from apps.core.mongo_client import get_db

db = get_db()

class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()

    def process_response(self, request, response):
        if request.path.startswith("/api/"):
            user = getattr(request, 'user', None)
            username = "Anonymous"
            user_id = None
            role = "None"
            
            if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
                username = getattr(user, 'username', "Anonymous")
                user_id = getattr(user, 'id', None)
                role = getattr(user, 'role', "None")

            ip_address = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            method = request.method
            path = request.path
            status_code = response.status_code
            
            duration = 0
            if hasattr(request, 'start_time'):
                duration = time.time() - request.start_time

            # Log to MongoDB
            log_entry = {
                "user_id": str(user_id) if user_id else None,
                "username": username,
                "role": role,
                "action": f"{method} {path}",
                "method": method,
                "path": path,
                "status_code": status_code,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "duration_sec": round(duration, 4),
                "timestamp": time.time()
            }
            try:
                db.audit_logs.insert_one(log_entry)
            except Exception:
                pass
                
            try:
                import os
                from django.conf import settings
                log_file = os.path.join(settings.BASE_DIR, "request_logs.txt")
                with open(log_file, "a", encoding="utf-8") as f:
                    f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {method} {path} -> {status_code} (User: {username}, Role: {role})\n")
            except Exception:
                pass
                
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
