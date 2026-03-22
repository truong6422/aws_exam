"""
Security tests for exam serializers.

Verifies that is_correct and explanation fields are NOT leaked during exam mode,
but ARE exposed in review mode.
"""
import pytest


@pytest.mark.django_db
class TestSerializerSecurity:
    """Verify anti-cheat serializer filtering."""

    def test_exam_questions_no_is_correct(self, auth_client, certification, questions):
        """is_correct must NOT be in exam questions response."""
        client, _ = auth_client
        resp = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert resp.status_code == 201, resp.data
        for q in resp.data['questions']:
            for a in q['answers']:
                assert 'is_correct' not in a, "is_correct leaked in exam response!"

    def test_exam_questions_no_explanation(self, auth_client, certification, questions):
        """explanation must NOT be in exam questions response."""
        client, _ = auth_client
        resp = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert resp.status_code == 201, resp.data
        for q in resp.data['questions']:
            assert 'explanation' not in q, "explanation leaked in exam response!"

    def test_review_has_is_correct_after_submit(self, auth_client, certification, questions):
        """is_correct IS present in review after submit."""
        client, _ = auth_client
        start = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert start.status_code == 201
        attempt_id = start.data['id']

        # Submit with empty answers
        submit = client.post(f'/api/v1/exams/{attempt_id}/submit/', [], format='json')
        assert submit.status_code == 200

        # Get review
        review = client.get(f'/api/v1/exams/{attempt_id}/review/')
        assert review.status_code == 200
        for q in review.data['questions']:
            for a in q['answers']:
                assert 'is_correct' in a, "is_correct missing in review!"

    def test_review_has_explanation_after_submit(self, auth_client, certification, questions):
        """explanation IS present in review after submit."""
        client, _ = auth_client
        start = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert start.status_code == 201
        attempt_id = start.data['id']

        # Submit with empty answers
        submit = client.post(f'/api/v1/exams/{attempt_id}/submit/', [], format='json')
        assert submit.status_code == 200

        # Get review
        review = client.get(f'/api/v1/exams/{attempt_id}/review/')
        assert review.status_code == 200
        for q in review.data['questions']:
            assert 'explanation' in q, "explanation missing in review!"

    def test_review_blocked_for_in_progress(self, auth_client, certification, questions):
        """review endpoint blocked while exam still in_progress."""
        client, _ = auth_client
        start = client.post('/api/v1/exams/start/', {'certification_id': certification.id})
        assert start.status_code == 201
        attempt_id = start.data['id']

        # Try to review before submit
        resp = client.get(f'/api/v1/exams/{attempt_id}/review/')
        assert resp.status_code == 403, "review should be forbidden for in_progress attempt"
