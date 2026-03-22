"""
Root pytest fixtures for the aws-exam-app backend test suite.
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def clear_cache_between_tests():
    """Clear Django cache before each test to prevent throttle state from leaking."""
    cache.clear()
    yield


@pytest.fixture
def api_client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def user_factory(db):
    """Factory that creates User instances for tests."""
    User = get_user_model()

    def _make(email="user@example.com", password="testpass123", **kwargs):
        return User.objects.create_user(
            username=email,
            email=email,
            password=password,
            **kwargs,
        )

    return _make


@pytest.fixture
def admin_user(user_factory):
    """Standard admin user — admin@example.com / admin123."""
    return user_factory(
        email="admin@example.com",
        password="admin123",
        is_superuser=True,
        is_staff=True,
    )
