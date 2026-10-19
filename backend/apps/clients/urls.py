from django.urls import path
from apps.clients.views import ClientProfileView, ClientListView, VerifyKYCView

urlpatterns = [
    path("profile", ClientProfileView.as_view(), name="client_profile"),
    path("list", ClientListView.as_view(), name="client_list"),
    path("verify-kyc", VerifyKYCView.as_view(), name="verify_kyc"),
]
