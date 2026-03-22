"""
JWT token blacklist tests.

Verifies that logout properly invalidates access tokens.
"""
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestJwtBlacklist:
    """Verify logout token blacklisting."""

    def _login(self, client_plain, email='student@example.com', password='testpass123'):
        """Helper to login and return response."""
        return client_plain.post('/api/v1/auth/login/', {'email': email, 'password': password})

    def test_logout_invalidates_token(self, user):
        """Token is rejected after logout."""
        plain = APIClient()
        login_resp = self._login(plain, 'student@example.com', 'testpass123')
        assert login_resp.status_code == 200, login_resp.data
        access = login_resp.data['access']

        # Use token
        plain.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        me_resp1 = plain.get('/api/v1/auth/me/')
        assert me_resp1.status_code == 200

        # Logout
        logout_resp = plain.post('/api/v1/auth/logout/', {})
        assert logout_resp.status_code in (200, 204)

        # Token should now be rejected
        me_resp2 = plain.get('/api/v1/auth/me/')
        assert me_resp2.status_code == 401

    def test_token_works_before_logout(self, user):
        """Token works before logout."""
        plain = APIClient()
        login_resp = self._login(plain, 'student@example.com', 'testpass123')
        assert login_resp.status_code == 200
        access = login_resp.data['access']

        plain.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        resp = plain.get('/api/v1/auth/me/')
        assert resp.status_code == 200
        assert resp.data['email'] == 'student@example.com'

    def test_can_login_again_after_logout(self, user):
        """New token works after re-login."""
        plain = APIClient()

        # First login → logout
        login1 = self._login(plain, 'student@example.com', 'testpass123')
        plain.credentials(HTTP_AUTHORIZATION=f'Bearer {login1.data["access"]}')
        logout = plain.post('/api/v1/auth/logout/', {})
        assert logout.status_code in (200, 204)

        # Clear auth
        plain.credentials()

        # Re-login → new token
        login2 = self._login(plain, 'student@example.com', 'testpass123')
        plain.credentials(HTTP_AUTHORIZATION=f'Bearer {login2.data["access"]}')
        me = plain.get('/api/v1/auth/me/')
        assert me.status_code == 200

    def test_logout_requires_auth_header(self):
        """Logout without bearer token returns 401."""
        plain = APIClient()
        resp = plain.post('/api/v1/auth/logout/', {})
        assert resp.status_code == 401

    def test_different_users_tokens_independent(self, user, db):
        """One user's logout doesn't affect another user's token."""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Create second user
        user2 = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='pass123'
        )

        plain1 = APIClient()
        plain2 = APIClient()

        # Both login
        login1 = plain1.post('/api/v1/auth/login/', {'email': 'student@example.com', 'password': 'testpass123'})
        login2 = plain2.post('/api/v1/auth/login/', {'email': 'other@example.com', 'password': 'pass123'})

        access1 = login1.data['access']
        access2 = login2.data['access']

        # User1 logout
        plain1.credentials(HTTP_AUTHORIZATION=f'Bearer {access1}')
        plain1.post('/api/v1/auth/logout/', {})

        # User2's token should still work
        plain2.credentials(HTTP_AUTHORIZATION=f'Bearer {access2}')
        me2 = plain2.get('/api/v1/auth/me/')
        assert me2.status_code == 200
        assert me2.data['email'] == 'other@example.com'
