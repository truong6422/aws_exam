"""
Accounts auth views — register, login, logout (Redis JTI blacklist), token endpoints.
"""
from django.core.cache import cache
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer, UserProfileSerializer
from .throttles import LoginRateThrottle


class RegisterView(APIView):
    """POST /api/auth/register/ — create a new account and return tokens immediately."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — alias for token-obtain with rate limiting."""

    throttle_classes = [LoginRateThrottle]


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklist access + optional refresh JTI in Redis."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Blacklist the current access token JTI
        token = request.auth
        if token:
            jti = token.get("jti")
            exp = token.get("exp")
            # Guard against missing exp claim — fall back to 15-minute TTL
            if exp is not None:
                ttl = max(0, int(exp - timezone.now().timestamp()))
            else:
                ttl = 900
            cache.set(f"token:blacklist:{jti}", True, timeout=ttl or 900)

        # Optionally blacklist refresh token JTI if provided
        refresh_token_str = request.data.get("refresh")
        if refresh_token_str:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken as RT  # noqa: PLC0415
                refresh = RT(refresh_token_str)
                r_jti = refresh.get("jti")
                r_exp = refresh.get("exp")
                r_ttl = max(0, int(r_exp - timezone.now().timestamp()))
                cache.set(f"token:blacklist:{r_jti}", True, timeout=r_ttl or 604800)
            except Exception:
                pass  # Invalid refresh token — ignore silently

        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
