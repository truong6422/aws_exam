"""Imports views: legacy job list + staff-only bulk question import."""
from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import ImportJob
from .serializers import BulkQuestionImportSerializer, ImportJobSerializer


class ImportJobListView(generics.ListAPIView):
    """GET /api/imports/ — list import jobs owned by the current user."""

    serializer_class = ImportJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ImportJob.objects.filter(uploaded_by=self.request.user)


class BulkQuestionImportView(generics.CreateAPIView):
    """POST /api/v1/imports/questions/ — staff-only bulk question import.

    Accepts a JSON payload with certification_code, domain_name, and a list of
    questions. All questions are created atomically — partial imports are not
    allowed.

    Permissions:
        - Must be authenticated (401 otherwise)
        - Must be is_staff (403 otherwise)
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = BulkQuestionImportSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(result, status=status.HTTP_201_CREATED)
