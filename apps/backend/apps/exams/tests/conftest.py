"""
Shared pytest fixtures for exams app tests.

Provides:
- user, staff_user: User instances
- certification: SAA-C03 with domains
- questions: 10 questions with answers
- auth_client, staff_client: Authenticated API clients
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.questions.models import Answer, Certification, Question


User = get_user_model()


@pytest.fixture
def user(db):
    """Create a regular test user."""
    return User.objects.create_user(
        username='student@example.com',
        email='student@example.com',
        password='testpass123',
    )


@pytest.fixture
def staff_user(db):
    """Create a staff user for admin tests."""
    return User.objects.create_user(
        username='staff@example.com',
        email='staff@example.com',
        password='staffpass123',
        is_staff=True,
    )


@pytest.fixture
def certification(db):
    """Create SAA-C03 certification."""
    return Certification.objects.create(
        code='SAA-C03',
        name='AWS Solutions Architect Associate',
        description='Test certification',
        time_limit_minutes=130,
        total_questions=65,
        passing_score=72,
    )


@pytest.fixture
def questions(db, certification):
    """Create 10 questions with answers for testing."""
    qs = []
    for i in range(10):
        q = Question.objects.create(
            text=f'Which service provides object storage solution number {i+1} for AWS?',
            question_type='single',
            certification=certification,
            explanation=f'This is the explanation for question {i+1}.',
            source='AWS Exam Guide',
        )
        Answer.objects.create(
            question=q,
            text=f'Amazon S3 - Correct answer {i+1}',
            is_correct=True,
        )
        Answer.objects.create(
            question=q,
            text=f'Wrong answer EC2 {i+1}',
            is_correct=False,
        )
        Answer.objects.create(
            question=q,
            text=f'Wrong answer RDS {i+1}',
            is_correct=False,
        )
        qs.append(q)
    return qs


@pytest.fixture
def auth_client(user):
    """Return (APIClient, user) tuple with JWT auth headers."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client, user


@pytest.fixture
def staff_client(staff_user):
    """Return (APIClient, staff_user) tuple with JWT auth headers."""
    client = APIClient()
    refresh = RefreshToken.for_user(staff_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client, staff_user
