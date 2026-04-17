"""
Questions views: certification list (public), domain list (auth required),
and community views: comments, upvote, bookmark, answer report.
"""
from rest_framework import generics, status
from core.pagination.page_number import CustomPageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import AnswerReport, Bookmark, Certification, Comment, ExamSet, Question
from .serializers import (
    AnswerReportSerializer,
    CertificationSerializer,
    CommentSerializer,
    ExamSetSerializer,
    PracticeQuestionSerializer,
)
from django.db import models


class PracticeQuestionPagination(CustomPageNumberPagination):
    page_size = 5
    max_page_size = 5


class CertificationListView(generics.ListAPIView):
    """GET /api/v1/questions/certifications/ — public list of all certifications."""

    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    permission_classes = [AllowAny]




class ExamSetListView(generics.ListAPIView):
    """GET /api/v1/questions/certifications/<certification_id>/sets/ — list exam sets."""

    serializer_class = ExamSetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ExamSet.objects.filter(
            certification_id=self.kwargs["certification_id"]
        )
        # Standard users only see unlocked sets, staff see all
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_locked=False)
        
        # Natural sort in Python for "Exam 1", "Exam 2", "Exam 10"
        import re
        def natural_sort_key(s):
            return [int(text) if text.isdigit() else text.lower()
                    for text in re.split('([0-9]+)', s.name)]
        
        return sorted(queryset, key=natural_sort_key)


class ExamSetUpdateView(generics.UpdateAPIView):
    """PATCH /api/v1/questions/sets/<pk>/ — update exam set (Admin only)."""

    queryset = ExamSet.objects.all()
    serializer_class = ExamSetSerializer
    permission_classes = [IsAdminUser]

class PracticeQuestionListView(generics.ListAPIView):
    """GET /api/v1/questions/practice/ — paginated questions from unlocked sets."""

    serializer_class = PracticeQuestionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PracticeQuestionPagination

    def get_queryset(self):
        cert_id = self.request.query_params.get("certification_id")
        # Only show questions from UNLOCKED exam sets or questions with NO exam set
        qs = Question.objects.filter(
            models.Q(exam_set__is_locked=False) | models.Q(exam_set__isnull=True)
        )
        if cert_id:
            qs = qs.filter(certification_id=cert_id)
        return qs.order_by("id")

class CommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/questions/<question_id>/comments/"""

    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Return only top-level comments. Replies are nested within them via serializer.
        return (
            Comment.objects.filter(question_id=self.kwargs["question_id"], parent__isnull=True)
            .select_related("author")
            .prefetch_related("replies", "replies__author", "upvotes")
        )

    def perform_create(self, serializer):
        question = get_object_or_404(Question, pk=self.kwargs["question_id"])
        serializer.save(author=self.request.user, question=question)


class CommentUpvoteView(APIView):
    """POST /api/v1/questions/comments/<pk>/upvote/ — toggle upvote."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        user = request.user
        if comment.upvotes.filter(pk=user.pk).exists():
            comment.upvotes.remove(user)
            upvoted = False
        else:
            comment.upvotes.add(user)
            upvoted = True
        return Response({"upvoted": upvoted, "upvote_count": comment.upvotes.count()})


class BookmarkToggleView(APIView):
    """POST /api/v1/questions/<question_id>/bookmark/ — toggle bookmark."""

    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, pk=question_id)
        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user, question=question
        )
        if not created:
            bookmark.delete()
            return Response({"bookmarked": False})
        return Response({"bookmarked": True}, status=status.HTTP_201_CREATED)


class BookmarkListView(APIView):
    """GET /api/v1/questions/bookmarks/ — list bookmarked question IDs."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ids = list(
            Bookmark.objects.filter(user=request.user).values_list(
                "question_id", flat=True
            )
        )
        return Response({"question_ids": ids})


class AnswerReportCreateView(APIView):
    """POST /api/v1/questions/<question_id>/report/ — create report (one per user/question)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, pk=question_id)
        if AnswerReport.objects.filter(
            question=question, reporter=request.user
        ).exists():
            return Response(
                {"detail": "You have already reported this question."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = AnswerReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(question=question, reporter=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
