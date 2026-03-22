"""
Import validation tests.

Verifies JSON schema validation, business logic, and permissions for bulk question imports.
"""
import pytest


VALID_PAYLOAD = {
    'data': {
        'certification_code': 'SAA-C03',
        'domain_name': 'Cloud Concepts',
        'questions': [
            {
                'text': 'Which service provides object storage?',
                'question_type': 'single',
                'answers': [
                    {'text': 'Amazon S3', 'is_correct': True},
                    {'text': 'Amazon EC2', 'is_correct': False},
                ]
            }
        ]
    }
}


@pytest.mark.django_db
class TestImportValidation:
    """Verify bulk question import validation."""

    def test_valid_import_succeeds(self, staff_client, certification):
        """Valid import payload → 201."""
        client, _ = staff_client
        resp = client.post('/api/v1/imports/questions/', VALID_PAYLOAD, format='json')
        assert resp.status_code == 201, resp.data
        assert 'imported' in resp.data
        assert resp.data['imported'] > 0

    def test_missing_certification_code_returns_400(self, staff_client, certification):
        """Missing certification_code → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'domain_name': 'Cloud Concepts',
                'questions': VALID_PAYLOAD['data']['questions']
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_missing_domain_name_returns_400(self, staff_client, certification):
        """Missing domain_name → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'SAA-C03',
                'questions': VALID_PAYLOAD['data']['questions']
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_missing_questions_returns_400(self, staff_client, certification):
        """Missing questions array → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'SAA-C03',
                'domain_name': 'Cloud Concepts',
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_question_text_too_short_returns_400(self, staff_client, certification):
        """Question text < 10 chars → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'SAA-C03',
                'domain_name': 'Cloud Concepts',
                'questions': [
                    {
                        'text': 'Short',
                        'question_type': 'single',
                        'answers': [
                            {'text': 'A', 'is_correct': True},
                            {'text': 'B', 'is_correct': False},
                        ]
                    }
                ]
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_fewer_than_2_answers_returns_400(self, staff_client, certification):
        """Question with < 2 answers → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'SAA-C03',
                'domain_name': 'Cloud Concepts',
                'questions': [
                    {
                        'text': 'Which service provides storage?',
                        'question_type': 'single',
                        'answers': [
                            {'text': 'Amazon S3', 'is_correct': True},
                        ]
                    }
                ]
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_nonexistent_certification_returns_400(self, staff_client):
        """Certification does not exist → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'DOES-NOT-EXIST',
                'domain_name': 'Cloud Concepts',
                'questions': VALID_PAYLOAD['data']['questions']
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_nonexistent_domain_returns_400(self, staff_client, certification):
        """Domain does not exist → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'SAA-C03',
                'domain_name': 'Non-Existent Domain',
                'questions': VALID_PAYLOAD['data']['questions']
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_single_type_multiple_correct_returns_400(self, staff_client, certification):
        """Single-type question with 2+ correct answers → 400."""
        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'SAA-C03',
                'domain_name': 'Cloud Concepts',
                'questions': [
                    {
                        'text': 'Which service provides storage?',
                        'question_type': 'single',
                        'answers': [
                            {'text': 'Amazon S3', 'is_correct': True},
                            {'text': 'AWS Storage Gateway', 'is_correct': True},
                        ]
                    }
                ]
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

    def test_non_staff_returns_403(self, auth_client, certification):
        """Non-staff user → 403."""
        client, _ = auth_client
        resp = client.post('/api/v1/imports/questions/', VALID_PAYLOAD, format='json')
        assert resp.status_code == 403

    def test_unauthenticated_returns_401(self):
        """Unauthenticated → 401."""
        from rest_framework.test import APIClient
        resp = APIClient().post('/api/v1/imports/questions/', VALID_PAYLOAD, format='json')
        assert resp.status_code == 401

    def test_atomic_rollback_on_validation_error(self, staff_client, certification):
        """If any question invalid, entire batch should fail."""
        from apps.questions.models import Question
        initial_count = Question.objects.count()

        client, _ = staff_client
        payload = {
            'data': {
                'certification_code': 'SAA-C03',
                'domain_name': 'Cloud Concepts',
                'questions': [
                    {
                        'text': 'Valid question with minimum length?',
                        'question_type': 'single',
                        'answers': [
                            {'text': 'A', 'is_correct': True},
                            {'text': 'B', 'is_correct': False},
                        ]
                    },
                    {
                        'text': 'Invalid',  # Too short
                        'question_type': 'single',
                        'answers': [
                            {'text': 'A', 'is_correct': True},
                            {'text': 'B', 'is_correct': False},
                        ]
                    }
                ]
            }
        }
        resp = client.post('/api/v1/imports/questions/', payload, format='json')
        assert resp.status_code == 400

        # Verify no questions were created
        final_count = Question.objects.count()
        assert final_count == initial_count, "Questions were created despite validation error"
