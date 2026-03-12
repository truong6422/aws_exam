"""
Accounts URL configuration.
Provides JWT token endpoints plus a /me/ stub.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import CurrentUserView

app_name = "accounts"

urlpatterns = [
    # POST /api/auth/token/         — obtain access + refresh tokens
    path("token/", TokenObtainPairView.as_view(), name="token-obtain"),
    # POST /api/auth/token/refresh/ — exchange refresh for new access token
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # GET  /api/auth/me/            — current user profile
    path("me/", CurrentUserView.as_view(), name="current-user"),
]
