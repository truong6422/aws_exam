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

from .models import AnswerReport, Bookmark, Certification, Comment, ExamSet, PracticeQuestionView, Question, UserExamUnlock
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
    permission_classes = [AllowAny]
    filter_backends = []  # Sort is handled in Python code (natural sort)

    def get_queryset(self):
        from django.db.models import Count
        queryset = ExamSet.objects.filter(
            certification_id=self.kwargs["certification_id"]
        ).annotate(q_count=Count('questions'))

        # Standard users only see unlocked sets AND complete sets (>= 65 questions)
        user = self.request.user
        if not user.is_authenticated or not user.is_staff:
            from django.db.models import Q
            queryset = queryset.filter(is_locked=False, q_count__gte=65)
        
        # Natural sort in Python for "Exam 1", "Exam 2", "Exam 10"
        import re
        def natural_sort_key(s):
            return [int(text) if text.isdigit() else text.lower()
                    for text in re.split('([0-9]+)', s.name)]
        
        return sorted(queryset, key=natural_sort_key)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            context["unlocked_ids"] = set(
                UserExamUnlock.objects.filter(user=self.request.user).values_list(
                    "exam_set_id", flat=True
                )
            )
        return context


class ExamSetUpdateView(generics.UpdateAPIView):
    """PATCH /api/v1/questions/sets/<pk>/ — update exam set (Admin only)."""

    queryset = ExamSet.objects.all()
    serializer_class = ExamSetSerializer
    permission_classes = [IsAdminUser]

class PracticeQuestionListView(generics.ListAPIView):
    """GET /api/v1/questions/practice/ — paginated questions from unlocked sets."""

    serializer_class = PracticeQuestionSerializer
    permission_classes = [AllowAny]
    pagination_class = PracticeQuestionPagination

    def get_queryset(self):
        cert_id = self.request.query_params.get("certification_id")
        user = self.request.user

        from django.db.models import Count, Q
        
        # Base filters: must not be locked
        base_qs = ExamSet.objects.filter(is_locked=False).annotate(q_count=Count('questions'))
        
        # Logic: A set is accessible for practice if:
        # 1. User is staff
        # 2. Set is incomplete (q_count < 65) -> treat as free for practice
        # 3. Set is free (price_credits = 0)
        # 4. User has purchased it
        
        practice_free_query = Q(q_count__lt=65) | Q(price_credits=0)

        if user.is_authenticated and user.is_staff:
            accessible_sets = base_qs.values_list("id", flat=True)
        elif user.is_authenticated:
            purchased_set_ids = UserExamUnlock.objects.filter(user=user).values_list(
                "exam_set_id", flat=True
            )
            accessible_sets = base_qs.filter(
                practice_free_query | Q(id__in=purchased_set_ids)
            ).values_list("id", flat=True)
        else:
            # Guests get incomplete sets and free sets
            accessible_sets = base_qs.filter(practice_free_query).values_list("id", flat=True)

        qs = Question.objects.filter(
            models.Q(exam_set_id__in=accessible_sets) | models.Q(exam_set__isnull=True)
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


class ExamSetBulkUpdateView(APIView):
    """POST /api/v1/questions/sets/bulk-update/ — update multiple exam sets (Admin only)."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"detail": "No IDs provided."}, status=status.HTTP_400_BAD_REQUEST)

        price_credits = request.data.get("price_credits")
        is_locked = request.data.get("is_locked")

        update_fields = {}
        if price_credits is not None:
            update_fields["price_credits"] = price_credits
        if is_locked is not None:
            update_fields["is_locked"] = is_locked

        if not update_fields:
            return Response({"detail": "No fields to update."}, status=status.HTTP_400_BAD_REQUEST)

        ExamSet.objects.filter(id__in=ids).update(**update_fields)
        return Response({"detail": f"Successfully updated {len(ids)} exam sets."})


class ExamSetFreeIncompleteView(APIView):
    """POST /api/v1/questions/sets/free-incomplete/ — make sets with <65 questions free."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        from django.db.models import Count

        # We use annotation to find sets where the relationship 'questions' has < 65 items
        incomplete_sets = ExamSet.objects.annotate(
            q_count=Count('questions')
        ).filter(q_count__lt=65, price_credits__gt=0)

        count = incomplete_sets.count()
        incomplete_sets.update(price_credits=0)

        return Response({
            "detail": f"Successfully set {count} incomplete sets to free.",
            "count": count
        })


class PracticeViewedView(APIView):
    """POST /api/v1/questions/practice/viewed/ — record that authenticated user viewed an answer."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        question_id = request.data.get("question_id")
        try:
            question_id = int(question_id)
        except (TypeError, ValueError):
            return Response({"detail": "question_id required."}, status=status.HTTP_400_BAD_REQUEST)

        question = get_object_or_404(Question, pk=question_id)
        PracticeQuestionView.objects.get_or_create(user=request.user, question=question)
        return Response({"ok": True})

