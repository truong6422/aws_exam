"""Imports views — placeholder stubs expanded in Phase 2."""
from rest_framework import generics, permissions

from .models import ImportJob
from .serializers import ImportJobSerializer


class ImportJobListView(generics.ListAPIView):
    """GET /api/imports/ — list import jobs owned by the current user."""

    serializer_class = ImportJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ImportJob.objects.filter(uploaded_by=self.request.user)
