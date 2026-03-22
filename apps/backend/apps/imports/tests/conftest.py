"""
Shared pytest fixtures for imports app tests.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.questions.models import Certification, Domain


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
    """Create SAA-C03 certification with a domain."""
    cert = Certification.objects.create(
        code='SAA-C03',
        name='AWS Solutions Architect Associate',
        description='Test certification',
        time_limit_minutes=130,
        total_questions=65,
        passing_score=72,
    )
    Domain.objects.create(
        name='Cloud Concepts',
        certification=cert,
        weight_percentage=20,
    )
    return cert


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
