"""
Shared pytest fixtures for accounts app tests.
"""
import pytest
from django.contrib.auth import get_user_model


User = get_user_model()


@pytest.fixture
def user(db):
    """Create a regular test user (student@example.com)."""
    return User.objects.create_user(
        username='student@example.com',
        email='student@example.com',
        password='testpass123',
    )
