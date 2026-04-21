"""
Accounts admin views for managing users.
"""
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum

from apps.questions.models import Certification, Question, ExamSet
from apps.exams.models import ExamAttempt

from .serializers import AdminUserSerializer

User = get_user_model()


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin viewset to manage users.
    Allows listing, creating, retrieving, updating and deleting users.
    """

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [SearchFilter]
    search_fields = ['email', 'name', 'username']

    @action(detail=False, methods=["get"])
    def dashboard_stats(self, request):
        total_users = User.objects.count()
        total_certs = Certification.objects.count()
        total_questions = Question.objects.count()
        
        exam_sets = ExamSet.objects.all()
        unlocked_exam_sets = exam_sets.filter(is_locked=False).count()
        total_exam_sets = exam_sets.count()

        total_time_seconds = ExamAttempt.objects.aggregate(total=Sum("accumulated_seconds"))["total"] or 0

        return Response({
            "users": total_users,
            "certifications": total_certs,
            "questions": total_questions,
            "exam_sets": {
                "total": total_exam_sets,
                "unlocked": unlocked_exam_sets,
                "locked": total_exam_sets - unlocked_exam_sets
            },
            "total_time_seconds": total_time_seconds
        })
