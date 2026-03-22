"""Analytics views — overview, weak domains, exam history."""
from django.db.models import Avg, Max
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.exams.models import AttemptAnswer, ExamAttempt

from .serializers import HistoryItemSerializer, OverviewSerializer, WeakDomainSerializer


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


class WeakDomainsView(APIView):
    """GET /api/v1/analytics/weak-domains/?certification_id=X — domains ranked by accuracy."""

    def get(self, request):
        certification_id = request.query_params.get('certification_id')

        qs = AttemptAnswer.objects.filter(
            attempt__user=request.user,
            attempt__status__in=['submitted', 'expired'],
        ).select_related(
            'question__domain__certification',
        ).prefetch_related('selected_answers', 'question__answers')

        if certification_id:
            qs = qs.filter(attempt__certification_id=certification_id)

        # Group by domain in Python to avoid complex M2M annotation
        domain_stats: dict[int, dict] = {}
        for aa in qs:
            domain = aa.question.domain
            if domain.id not in domain_stats:
                domain_stats[domain.id] = {
                    'domain_id': domain.id,
                    'domain_name': domain.name,
                    'certification_code': domain.certification.code,
                    'total_questions': 0,
                    'correct_count': 0,
                }
            domain_stats[domain.id]['total_questions'] += 1

            correct_ids = set(
                aa.question.answers.filter(is_correct=True).values_list('id', flat=True)
            )
            selected_ids = set(aa.selected_answers.values_list('id', flat=True))
            if correct_ids == selected_ids:
                domain_stats[domain.id]['correct_count'] += 1

        results = []
        for stat in domain_stats.values():
            total = stat['total_questions']
            correct = stat['correct_count']
            stat['accuracy_percentage'] = round((correct / total * 100) if total > 0 else 0, 2)
            results.append(stat)

        # Sort by accuracy ascending (weakest first)
        results.sort(key=lambda x: x['accuracy_percentage'])

        serializer = WeakDomainSerializer(results, many=True)
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
