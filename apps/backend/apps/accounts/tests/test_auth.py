"""
Tests for the authentication endpoints.

Covers:
  - POST /api/v1/auth/login/    — LoginView (rate-limited alias)
  - POST /api/v1/auth/register/ — RegisterView
  - POST /api/v1/auth/logout/   — LogoutView
  - GET  /api/v1/auth/me/       — CurrentUserView

Email validation scope:
  - Valid RFC 5322 addresses (admin@example.com, test@example.com) must succeed
  - Obviously malformed addresses must be rejected at the serializer level
"""
import pytest


LOGIN_URL = "/api/v1/auth/login/"
REGISTER_URL = "/api/v1/auth/register/"
LOGOUT_URL = "/api/v1/auth/logout/"
ME_URL = "/api/v1/auth/me/"


# ---------------------------------------------------------------------------
# Login endpoint — POST /api/v1/auth/login/
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestLogin:
    """Login via LoginView returns JWT tokens for valid credentials."""

    def test_valid_email_returns_tokens(self, api_client, admin_user):
        """admin@example.com + correct password → 200 with access & refresh tokens."""
        resp = api_client.post(
            LOGIN_URL,
            {"email": "admin@example.com", "password": "admin123"},
            format="json",
        )
        assert resp.status_code == 200, resp.data
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_standard_email_format_accepted(self, api_client, user_factory):
        """Common RFC 5322 addresses (test@example.com) are accepted at login."""
        user_factory(email="test@example.com", password="testpass123")
        resp = api_client.post(
            LOGIN_URL,
            {"email": "test@example.com", "password": "testpass123"},
            format="json",
        )
        assert resp.status_code == 200, resp.data

    def test_wrong_password_returns_401(self, api_client, admin_user):
        """Correct email but wrong password → 401."""
        resp = api_client.post(
            LOGIN_URL,
            {"email": "admin@example.com", "password": "wrongpassword"},
            format="json",
        )
        assert resp.status_code == 401

    def test_nonexistent_user_returns_401(self, api_client):
        """No user in DB → 401 (not a validation error)."""
        resp = api_client.post(
            LOGIN_URL,
            {"email": "nobody@example.com", "password": "admin123"},
            format="json",
        )
        assert resp.status_code == 401

    def test_malformed_email_returns_401_not_400(self, api_client):
        """SimpleJWT does not validate email format; malformed address → 401."""
        resp = api_client.post(
            LOGIN_URL,
            {"email": "not-an-email", "password": "admin123"},
            format="json",
        )
        # SimpleJWT skips format validation and just fails authentication
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Register endpoint — POST /api/v1/auth/register/
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestRegister:
    """RegisterView validates email format via DRF EmailField."""

    def test_valid_email_creates_user_and_returns_tokens(self, api_client):
        """Standard email → 201 with access & refresh tokens."""
        resp = api_client.post(
            REGISTER_URL,
            {"email": "newuser@example.com", "password": "securepass1", "name": "New User"},
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_admin_email_registers_successfully(self, api_client):
        """admin@example.com is a valid address that must not be rejected."""
        resp = api_client.post(
            REGISTER_URL,
            {"email": "admin@example.com", "password": "admin123!", "name": "Admin"},
            format="json",
        )
        assert resp.status_code == 201, resp.data

    def test_invalid_email_format_rejected(self, api_client):
        """Plainly malformed addresses are rejected with 400."""
        for bad_email in ("notanemail", "missing@", "@nodomain", "two@@signs.com"):
            resp = api_client.post(
                REGISTER_URL,
                {"email": bad_email, "password": "securepass1", "name": "Bad"},
                format="json",
            )
            assert resp.status_code == 400, f"Expected 400 for {bad_email!r}, got {resp.status_code}"

    def test_duplicate_email_rejected(self, api_client, user_factory):
        """Registering with an already-taken email → 400."""
        user_factory(email="taken@example.com")
        resp = api_client.post(
            REGISTER_URL,
            {"email": "taken@example.com", "password": "newpass123", "name": "Dup"},
            format="json",
        )
        assert resp.status_code == 400

    def test_missing_password_rejected(self, api_client):
        """Password field is required."""
        resp = api_client.post(
            REGISTER_URL,
            {"email": "nopass@example.com", "name": "No Pass"},
            format="json",
        )
        assert resp.status_code == 400

    def test_short_password_rejected(self, api_client):
        """Password shorter than 8 chars is rejected."""
        resp = api_client.post(
            REGISTER_URL,
            {"email": "short@example.com", "password": "abc", "name": "Short"},
            format="json",
        )
        assert resp.status_code == 400

    def test_register_response_includes_user_profile(self, api_client):
        """Register response includes user object with email and name."""
        resp = api_client.post(
            REGISTER_URL,
            {"email": "profile@example.com", "password": "securepass1", "name": "Profile Test"},
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert resp.data["user"]["email"] == "profile@example.com"
        assert resp.data["user"]["name"] == "Profile Test"


# ---------------------------------------------------------------------------
# Logout endpoint — POST /api/v1/auth/logout/
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestLogout:
    """LogoutView blacklists the supplied refresh token."""

    def _get_tokens(self, api_client, email, password):
        resp = api_client.post(LOGIN_URL, {"email": email, "password": password}, format="json")
        assert resp.status_code == 200, resp.data
        return resp.data["access"], resp.data["refresh"]

    def test_logout_blacklists_refresh_token(self, api_client, admin_user):
        """Valid refresh token → 200; subsequent use of that token → 401."""
        access, refresh = self._get_tokens(api_client, "admin@example.com", "admin123")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        resp = api_client.post(LOGOUT_URL, {"refresh": refresh}, format="json")
        assert resp.status_code == 200

        # Using the blacklisted refresh token should now fail
        api_client.credentials()
        resp2 = api_client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format="json")
        assert resp2.status_code == 401

    def test_logout_without_auth_returns_401(self, api_client):
        """No Bearer token → 401 before processing the body."""
        resp = api_client.post(LOGOUT_URL, {"refresh": "sometoken"}, format="json")
        assert resp.status_code == 401

    def test_logout_with_invalid_refresh_returns_400(self, api_client, admin_user):
        """Authenticated but supplying a garbage refresh token → 400."""
        access, _ = self._get_tokens(api_client, "admin@example.com", "admin123")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        resp = api_client.post(LOGOUT_URL, {"refresh": "not-a-real-token"}, format="json")
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Current user endpoint — GET /api/v1/auth/me/
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCurrentUser:
    """CurrentUserView returns the authenticated user's profile."""

    def test_me_requires_auth(self, api_client):
        """No token → 401."""
        resp = api_client.get(ME_URL)
        assert resp.status_code == 401

    def test_me_returns_user_profile(self, api_client, admin_user):
        """Valid Bearer token → 200 with email and name fields."""
        token_resp = api_client.post(
            LOGIN_URL,
            {"email": "admin@example.com", "password": "admin123"},
            format="json",
        )
        access = token_resp.data["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        resp = api_client.get(ME_URL)
        assert resp.status_code == 200, resp.data
        assert resp.data["email"] == "admin@example.com"
        assert "name" in resp.data
        assert "id" in resp.data

