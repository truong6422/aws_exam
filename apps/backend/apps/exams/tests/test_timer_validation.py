"""
Timer validation tests for exam expiry.

Verifies server-side enforcement of time limits.
"""
import pytest
from django.utils import timezone
from datetime import timedelta

from apps.exams.models import ExamAttempt


@pytest.mark.django_db
class TestTimerValidation:
    """Verify server-side timer enforcement."""

    def test_expired_exam_gets_expired_status(self, auth_client, certification, questions):
        """Submit after time limit → status='expired'."""
        client, _ = auth_client
        start = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert start.status_code == 201
        attempt_id = start.data['id']

        # Force expiry by setting started_at to past
        past = timezone.now() - timedelta(minutes=certification.time_limit_minutes + 5)
        ExamAttempt.objects.filter(id=attempt_id).update(started_at=past)

        # Submit
        resp = client.post(f'/api/v1/exams/{attempt_id}/submit/', [], format='json')
        assert resp.status_code == 200
        assert resp.data['status'] == 'expired'

    def test_submit_within_time_is_submitted(self, auth_client, certification, questions):
        """Submit within time → status='submitted'."""
        client, _ = auth_client
        start = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert start.status_code == 201
        attempt_id = start.data['id']

        # Submit immediately (within time)
        resp = client.post(f'/api/v1/exams/{attempt_id}/submit/', [], format='json')
        assert resp.status_code == 200
        assert resp.data['status'] == 'submitted'

    def test_expired_exam_still_scores(self, auth_client, certification, questions):
        """Expired exam still returns a score_percentage."""
        client, _ = auth_client
        start = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert start.status_code == 201
        attempt_id = start.data['id']

        # Force expiry
        past = timezone.now() - timedelta(minutes=certification.time_limit_minutes + 5)
        ExamAttempt.objects.filter(id=attempt_id).update(started_at=past)

        # Submit
        resp = client.post(f'/api/v1/exams/{attempt_id}/submit/', [], format='json')
        assert resp.status_code == 200
        assert 'score_percentage' in resp.data
        assert resp.data['score_percentage'] is not None

    def test_autosave_blocked_after_expiry(self, auth_client, certification, questions):
        """Autosave returns 400 when exam has expired."""
        client, _ = auth_client
        start = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert start.status_code == 201
        attempt_id = start.data['id']

        # Force expiry
        past = timezone.now() - timedelta(minutes=certification.time_limit_minutes + 5)
        ExamAttempt.objects.filter(id=attempt_id).update(started_at=past)

        # Try to autosave
        resp = client.patch(f'/api/v1/exams/{attempt_id}/autosave/', [], format='json')
        assert resp.status_code == 400
