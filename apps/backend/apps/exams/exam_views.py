"""
Exam lifecycle views: start, autosave, submit, review, list.
"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.questions.models import Certification, Question

from .models import AttemptAnswer, ExamAttempt
from .serializers import (
    ExamAttemptDetailSerializer,
    ExamAttemptListSerializer,
    ExamReviewSerializer,
    ExamSubmitResponseSerializer,
    PartialAnswerSerializer,
    StartExamSerializer,
)


def _calculate_score(attempt):
    """Return count of questions where selected answers exactly match correct answers."""
    correct = 0
    for aa in attempt.attempt_answers.prefetch_related(
        'selected_answers', 'question__answers'
    ):
        correct_ids = set(
            aa.question.answers.filter(is_correct=True).values_list('id', flat=True)
        )
        selected_ids = set(aa.selected_answers.values_list('id', flat=True))
        if correct_ids == selected_ids:
            correct += 1
    return correct


def _save_answers(attempt, answers_data):
    """Persist a list of {question_id, answer_ids} to AttemptAnswer rows.

    Only accepts question_ids that belong to this attempt — rejects injected IDs.
    """
    serializer = PartialAnswerSerializer(data=answers_data, many=True)
    serializer.is_valid(raise_exception=True)

    # Build allowed set once — prevents question_id injection attacks
    allowed_question_ids = set(
        attempt.attempt_answers.values_list('question_id', flat=True)
    )

    for item in serializer.validated_data:
        qid = item['question_id']
        if qid not in allowed_question_ids:
            continue  # Silently skip foreign question IDs
        aa, _ = AttemptAnswer.objects.get_or_create(
            attempt=attempt, question_id=qid
        )
        aa.selected_answers.set(item['answer_ids'])


class ExamStartView(APIView):
    """POST /api/v1/exams/start/ — create a new exam attempt."""

    def post(self, request):
        serializer = StartExamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cert = Certification.objects.get(pk=serializer.validated_data['certification_id'])

        attempt = ExamAttempt.objects.create(
            user=request.user,
            certification=cert,
            time_limit_minutes=cert.time_limit_minutes,
            total_questions=cert.total_questions,
        )

        questions = list(
            Question.objects.filter(domain__certification=cert).order_by('?')[
                : cert.total_questions
            ]
        )
        AttemptAnswer.objects.bulk_create(
            [AttemptAnswer(attempt=attempt, question=q) for q in questions]
        )

        return Response(
            ExamAttemptDetailSerializer(attempt).data,
            status=status.HTTP_201_CREATED,
        )


class ExamAutosaveView(APIView):
    """PATCH /api/v1/exams/{pk}/autosave/ — save partial answers."""

    def patch(self, request, pk):
        attempt = get_object_or_404(ExamAttempt, pk=pk, user=request.user)

        if attempt.is_expired:
            return Response(
                {'detail': 'Exam time has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answers_data = request.data if isinstance(request.data, list) else []
        if answers_data:
            _save_answers(attempt, answers_data)

        return Response({
            'status': 'saved',
            'time_remaining_seconds': attempt.time_remaining_seconds,
        })


class ExamSubmitView(APIView):
    """POST /api/v1/exams/{pk}/submit/ — submit attempt and calculate score."""

    def post(self, request, pk):
        attempt = get_object_or_404(ExamAttempt, pk=pk, user=request.user)

        if attempt.status != 'in_progress':
            return Response(
                {'detail': 'Attempt already submitted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save any final answers included in the request body
        answers_data = request.data if isinstance(request.data, list) else []
        if answers_data:
            _save_answers(attempt, answers_data)

        attempt.status = 'expired' if attempt.is_expired else 'submitted'
        attempt.correct_count = _calculate_score(attempt)
        total = attempt.total_questions or 1  # Guard against ZeroDivisionError
        attempt.score_percentage = round(attempt.correct_count / total * 100, 2)
        attempt.submitted_at = timezone.now()
        attempt.save(update_fields=['status', 'correct_count', 'score_percentage', 'submitted_at'])

        return Response(ExamSubmitResponseSerializer(attempt).data)


class ExamReviewView(APIView):
    """GET /api/v1/exams/{pk}/review/ — full review with correct answers."""

    def get(self, request, pk):
        attempt = get_object_or_404(ExamAttempt, pk=pk, user=request.user)

        if attempt.status == 'in_progress':
            return Response(
                {'detail': 'Exam must be submitted before reviewing.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(ExamReviewSerializer(attempt).data)


class ExamListView(generics.ListAPIView):
    """GET /api/v1/exams/ — paginated list of the current user's attempts."""

    serializer_class = ExamAttemptListSerializer

    def get_queryset(self):
        return (
            ExamAttempt.objects.filter(user=self.request.user)
            .select_related('certification')
            .order_by('-started_at')
        )
