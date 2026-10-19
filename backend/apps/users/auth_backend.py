import os
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from bson import ObjectId
from apps.core.mongo_client import get_db

db = get_db()

class MongoUser:
    def __init__(self, user_doc):
        self.id = str(user_doc.get("_id"))
        self.username = user_doc.get("username")
        self.email = user_doc.get("email")
        self.role = user_doc.get("role", "Client")
        self.is_active = user_doc.get("is_active", True)
        self.raw_doc = user_doc

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

class MongoDBJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("user_id")
            if not user_id:
                raise AuthenticationFailed("Invalid token payload")

            # Fetch from clients or advisors
            user_doc = db.clients.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                user_doc = db.advisors.find_one({"_id": ObjectId(user_id)})

            if not user_doc:
                raise AuthenticationFailed("User not found")

            if not user_doc.get("is_active", True):
                raise AuthenticationFailed("User account is disabled")

            return (MongoUser(user_doc), token)
        except AuthenticationFailed:
            raise
        except jwt.ExpiredSignatureError as e:
            with open(os.path.join(settings.BASE_DIR, "django_error.log"), "a", encoding="utf-8") as f:
                f.write(f"JWT Auth Failure (Expired): {str(e)}\n")
            raise AuthenticationFailed("Token has expired")
        except jwt.InvalidTokenError as e:
            with open(os.path.join(settings.BASE_DIR, "django_error.log"), "a", encoding="utf-8") as f:
                f.write(f"JWT Auth Failure (Invalid): {str(e)}\n")
            raise AuthenticationFailed("Invalid token")
        except Exception as e:
            with open(os.path.join(settings.BASE_DIR, "django_error.log"), "a", encoding="utf-8") as f:
                f.write(f"JWT Auth Failure (General): {str(e)}\n")
            raise AuthenticationFailed(str(e))

    def authenticate_header(self, request):
        return "Bearer realm=\"api\""

def generate_jwt_token(user_doc):
    payload = {
        "user_id": str(user_doc["_id"]),
        "username": user_doc["username"],
        "role": user_doc.get("role", "Client"),
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

