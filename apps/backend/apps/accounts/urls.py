"""
Accounts URL configuration.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import ChangePasswordView, CurrentUserView, LoginView, LogoutView, RegisterView

urlpatterns = [
    # POST  — obtain tokens (original path, kept for compatibility)
    path("token/", TokenObtainPairView.as_view(), name="token-obtain"),
    # POST  — exchange refresh for new access token
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # POST  — login alias with rate limiting
    path("login/", LoginView.as_view(), name="login"),
    # POST  — register new user and receive tokens
    path("register/", RegisterView.as_view(), name="register"),
    # POST  — blacklist access + refresh JTI in Redis
    path("logout/", LogoutView.as_view(), name="logout"),
    # GET/PATCH — current authenticated user profile
    path("me/", CurrentUserView.as_view(), name="current-user"),
    # POST  — validate old password and set new one
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
]
