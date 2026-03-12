"""
Accounts views — placeholder stubs expanded in Phase 2.
JWT token views are wired directly from simplejwt in urls.py.
"""
from rest_framework import generics, permissions

from .serializers import UserSerializer


class CurrentUserView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — return the authenticated user's profile."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
