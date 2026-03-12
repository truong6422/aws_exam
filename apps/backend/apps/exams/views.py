"""Exams views — placeholder stubs expanded in Phase 2."""
from rest_framework import generics

from .models import Exam
from .serializers import ExamSerializer


class ExamListView(generics.ListAPIView):
    """GET /api/exams/ — placeholder list endpoint."""

    queryset = Exam.objects.select_related("created_by").all()
    serializer_class = ExamSerializer
