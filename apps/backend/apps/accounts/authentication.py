"""
Custom JWT authentication that checks Redis JTI blacklist on every request.
"""
from django.core.cache import cache
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class RedisJWTAuthentication(JWTAuthentication):
    """JWT authentication that checks Redis blacklist on every authenticated request."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        jti = token.get("jti")
        if cache.get(f"token:blacklist:{jti}"):
            raise InvalidToken("Token has been revoked")
        return (user, token)
