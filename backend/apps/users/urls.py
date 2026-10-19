from django.urls import path
from apps.users.views import (
    RegisterView,
    LoginView,
    ProfileView,
    Setup2FAView,
    Verify2FAView,
    LoginHistoryView
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("2fa/setup", Setup2FAView.as_view(), name="2fa_setup"),
    path("2fa/verify", Verify2FAView.as_view(), name="2fa_verify"),
    path("history", LoginHistoryView.as_view(), name="login_history"),
]
