"""
Accounts profile views — current user profile (GET/PATCH) and change password.
"""
from django.core.cache import cache
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response

from .serializers import ChangePasswordSerializer, ProfileUpdateSerializer, UserProfileSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — return or update the authenticated user's profile."""

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ProfileUpdateSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        # Return full profile after update
        response.data = UserProfileSerializer(request.user).data
        return response


class ChangePasswordView(generics.GenericAPIView):
    """POST /api/auth/change-password/ — validate old password and set new one."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        # Blacklist current access token to force re-login
        token = request.auth
        if token:
            jti = token.get("jti")
            exp = token.get("exp")
            ttl = max(0, int(exp - timezone.now().timestamp()))
            cache.set(f"token:blacklist:{jti}", True, timeout=ttl or 900)

        return Response({"detail": "Password changed successfully."})
