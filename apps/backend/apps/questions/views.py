"""
Questions views: certification list (public), domain list (auth required),
and community views: comments, upvote, bookmark, answer report.
"""
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import AnswerReport, Bookmark, Certification, Comment, Domain, Question
from .serializers import (
    AnswerReportSerializer,
    CertificationSerializer,
    CommentSerializer,
    DomainSerializer,
)


class CertificationListView(generics.ListAPIView):
    """GET /api/v1/questions/certifications/ — public list of all certifications."""

    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    permission_classes = [AllowAny]


class DomainListView(generics.ListAPIView):
    """GET /api/v1/questions/certifications/<certification_id>/domains/ — auth required."""

    serializer_class = DomainSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Domain.objects.filter(
            certification_id=self.kwargs["certification_id"]
        ).select_related("certification")


class CommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/questions/<question_id>/comments/"""

    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Comment.objects.filter(
            question_id=self.kwargs["question_id"]
        ).select_related("author")

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
