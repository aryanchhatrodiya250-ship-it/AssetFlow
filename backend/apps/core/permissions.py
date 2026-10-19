from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "Super Admin"

class IsAssetManager(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ["Super Admin", "Advisor"]

class IsAdvisorOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ["Super Admin", "Advisor"]

class IsClientOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "Client"

def role_required(*roles):
    class RoleRequiredPermission(BasePermission):
        def has_permission(self, request, view):
            # Allow Advisor dynamically if legacy roles are passed in decorator
            expanded_roles = list(roles)
            if any(r in ["Asset Manager", "Investment Advisor", "Relationship Manager"] for r in expanded_roles):
                expanded_roles.append("Advisor")
            return request.user and request.user.is_authenticated and request.user.role in expanded_roles
    return RoleRequiredPermission
