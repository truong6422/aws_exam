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
        
        # Save flag status if provided
        if 'is_flagged' in item:
            aa.is_flagged = item['is_flagged']
            aa.save(update_fields=['is_flagged'])


class ExamStartView(APIView):
    """POST /api/v1/exams/start/ — create a new exam attempt."""

    def post(self, request):
        serializer = StartExamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cert_id = serializer.validated_data.get("certification_id")
        exam_set_id = serializer.validated_data.get("exam_set_id")

        exam_set = None
        if exam_set_id:
            from apps.questions.models import ExamSet
            exam_set = ExamSet.objects.select_related("certification").get(pk=exam_set_id)
            if exam_set.is_locked:
                return Response({"detail": "Exam set is locked."}, status=status.HTTP_403_FORBIDDEN)
            
            # Paywall check: STAFF users skip this
            if exam_set.price_credits > 0 and not request.user.is_staff:
                from apps.questions.models import UserExamUnlock
                if not UserExamUnlock.objects.filter(user=request.user, exam_set=exam_set).exists():
                    return Response(
                        {"detail": "Purchase required to access this exam set."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            cert = exam_set.certification
        else:
            cert = Certification.objects.get(pk=cert_id)

        # Smart Resume logic: find existing unfinished attempt
        existing_attempt = ExamAttempt.objects.filter(
            user=request.user,
            certification=cert,
            exam_set=exam_set,
            status__in=['in_progress', 'paused']
        ).first()

        if existing_attempt:
            if existing_attempt.is_expired:
                # If expired, we can't resume it, but let's let the status change naturally later or here
                pass
            else:
                # Resume it automatically
                if existing_attempt.status == 'paused':
                    existing_attempt.status = 'in_progress'
                    existing_attempt.last_resumed_at = timezone.now()
                    existing_attempt.save()
                return Response(ExamAttemptDetailSerializer(existing_attempt).data)

        attempt = ExamAttempt.objects.create(
            user=request.user,
            certification=cert,
            exam_set=exam_set,
            time_limit_minutes=cert.time_limit_minutes,
            total_questions=cert.total_questions,
        )

        if exam_set:
            # Use fixed set questions
            questions = list(exam_set.questions.all())
        else:
            # Practice mode: random questions ONLY from accessible sets
            # Access rules: is_locked=False AND (price_credits=0 OR UserExamUnlock exists)
            # Staff can access all unlocked sets
            from apps.questions.models import ExamSet, UserExamUnlock
            from django.db import models
            
            if request.user.is_staff:
                accessible_set_ids = ExamSet.objects.filter(
                    certification=cert, is_locked=False
                ).values_list("id", flat=True)
            else:
                purchased_set_ids = UserExamUnlock.objects.filter(
                    user=request.user
                ).values_list("exam_set_id", flat=True)
                
                accessible_set_ids = ExamSet.objects.filter(
                    certification=cert, is_locked=False
                ).filter(
                    models.Q(price_credits=0) | models.Q(id__in=purchased_set_ids)
                ).values_list("id", flat=True)

            questions = list(
                Question.objects.filter(
                    certification=cert, 
                    exam_set_id__in=accessible_set_ids
                ).order_by("?")[
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


class ExamPauseView(APIView):
    """POST /api/v1/exams/{pk}/pause/ — pause active attempt."""

    def post(self, request, pk):
        attempt = get_object_or_404(ExamAttempt, pk=pk, user=request.user)
        
        if attempt.status not in ['in_progress', 'paused']:
            return Response(
                {'detail': 'Can only pause in-progress exams.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Final autosave if data provided
        answers_data = request.data if isinstance(request.data, list) else []
        if answers_data:
            _save_answers(attempt, answers_data)

        # Lock in time spent only if it was in progress
        if attempt.status == 'in_progress':
            attempt.accumulated_seconds = attempt.time_spent_total
            attempt.status = 'paused'
            attempt.save()
            
        return Response({'status': 'paused'})


class ExamResumeView(APIView):
    """POST /api/v1/exams/{pk}/resume/ — resume paused attempt."""

    def post(self, request, pk):
        attempt = get_object_or_404(ExamAttempt, pk=pk, user=request.user)

        if attempt.status == 'in_progress':
            return Response(ExamAttemptDetailSerializer(attempt).data)

        if attempt.status != 'paused' or attempt.is_expired:
            return Response(
                {'detail': 'Cannot resume this exam.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt.status = 'in_progress'
        attempt.last_resumed_at = timezone.now()
        attempt.save()

        return Response(ExamAttemptDetailSerializer(attempt).data)


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
    """GET /api/v1/exams/ — paginated list of the current user's attempts.
    
    Supports optional ?exam_set_id=X filter to get history for a specific exam set.
    """

    serializer_class = ExamAttemptListSerializer

    def get_queryset(self):
        qs = (
            ExamAttempt.objects.filter(user=self.request.user)
            .select_related('certification')
            .order_by('-started_at')
        )
        exam_set_id = self.request.query_params.get('exam_set_id')
        if exam_set_id:
            qs = qs.filter(exam_set_id=exam_set_id)
        return qs
