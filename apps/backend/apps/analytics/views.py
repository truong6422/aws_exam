"""Analytics views — overview, weak domains, exam history."""
from django.db.models import Avg, Max
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.exams.models import AttemptAnswer, ExamAttempt

from .serializers import HistoryItemSerializer, OverviewSerializer


class OverviewView(APIView):
    """GET /api/v1/analytics/overview/ — user's overall stats."""

    def get(self, request):
        submitted_attempts = ExamAttempt.objects.filter(
            user=request.user,
            status__in=['submitted', 'expired'],
        )
        total_attempts = ExamAttempt.objects.filter(user=request.user).count()
        total_submitted = submitted_attempts.count()

        aggregates = submitted_attempts.aggregate(
            avg_score=Avg('score_percentage'),
            best_score=Max('score_percentage'),
        )

        recent_raw = (
            submitted_attempts
            .order_by('-submitted_at')
            .select_related('certification')[:7]
            .values('submitted_at', 'score_percentage', 'certification__code')
        )
        recent_trend = [
            {
                'date': item['submitted_at'],
                'score': item['score_percentage'] or 0,
                'certification_code': item['certification__code'],
            }
            for item in recent_raw
        ]

        data = {
            'total_attempts': total_attempts,
            'total_submitted': total_submitted,
            'avg_score': aggregates['avg_score'] or 0,
            'best_score': aggregates['best_score'] or 0,
            'recent_trend': recent_trend,
        }
        serializer = OverviewSerializer(data)
        return Response(serializer.data)


class HistoryView(APIView):
    """GET /api/v1/analytics/history/ — paginated exam attempt history."""

    def get(self, request):
        attempts = (
            ExamAttempt.objects
            .filter(user=request.user)
            .select_related('certification')
            .order_by('-started_at')
        )

        paginator = PageNumberPagination()
        paginator.page_size = 10
        page = paginator.paginate_queryset(attempts, request)

        data = [
            {
                'id': a.id,
                'certification_code': a.certification.code,
                'certification_name': a.certification.name,
                'started_at': a.started_at,
                'submitted_at': a.submitted_at,
                'status': a.status,
                'score_percentage': a.score_percentage,
                'total_questions': a.total_questions,
                'correct_count': a.correct_count,
            }
            for a in page
        ]
        serializer = HistoryItemSerializer(data, many=True)
        return paginator.get_paginated_response(serializer.data)
