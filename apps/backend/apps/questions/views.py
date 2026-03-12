"""Questions views — placeholder stubs expanded in Phase 2."""
from rest_framework import generics

from .models import Question
from .serializers import QuestionSerializer


class QuestionListView(generics.ListAPIView):
    """GET /api/questions/ — placeholder list endpoint."""

    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
