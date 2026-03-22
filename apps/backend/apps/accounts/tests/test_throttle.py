"""
Tests for login rate limiting.

LoginRateThrottle allows 5 attempts per minute per IP.
The 6th request within the same minute window must return 429.

Cache is cleared before each test by the global conftest `clear_cache_between_tests` fixture.
"""
import pytest


LOGIN_URL = "/api/v1/auth/login/"


@pytest.mark.django_db
class TestLoginRateLimit:
    """LoginView enforces 5 requests/minute/IP via ScopedRateThrottle."""

    def test_five_attempts_are_allowed(self, api_client, admin_user):
        """5 consecutive requests (even with wrong password) must not be throttled."""
        for _ in range(5):
            resp = api_client.post(
                LOGIN_URL,
                {"email": "admin@example.com", "password": "wrongpass"},
                format="json",
            )
            assert resp.status_code != 429, "Should not be throttled within 5 attempts"

    def test_sixth_attempt_returns_429(self, api_client, admin_user):
        """The 6th request within the same minute window → 429 Too Many Requests."""
        for _ in range(5):
            api_client.post(
                LOGIN_URL,
                {"email": "admin@example.com", "password": "wrongpass"},
                format="json",
            )

        resp = api_client.post(
            LOGIN_URL,
            {"email": "admin@example.com", "password": "wrongpass"},
            format="json",
        )
        assert resp.status_code == 429

    def test_successful_login_also_counts_toward_limit(self, api_client, admin_user):
        """Successful logins count toward the rate limit too."""
        # Use up 4 with wrong password
        for _ in range(4):
            api_client.post(
                LOGIN_URL,
                {"email": "admin@example.com", "password": "wrongpass"},
                format="json",
            )
        # 5th: successful login (uses up the last slot)
        resp5 = api_client.post(
            LOGIN_URL,
            {"email": "admin@example.com", "password": "admin123"},
            format="json",
        )
        assert resp5.status_code == 200

        # 6th: throttled
        resp6 = api_client.post(
            LOGIN_URL,
            {"email": "admin@example.com", "password": "admin123"},
            format="json",
        )
        assert resp6.status_code == 429
