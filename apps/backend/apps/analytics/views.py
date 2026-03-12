"""Analytics views — placeholder stubs expanded in Phase 2."""
from rest_framework import generics, permissions

from .models import UserProgress
from .serializers import UserProgressSerializer


class UserProgressView(generics.RetrieveAPIView):
    """GET /api/analytics/me/ — current user's progress summary."""

    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, _ = UserProgress.objects.get_or_create(user=self.request.user)
        return obj
