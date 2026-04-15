"""
JWT authentication combining:
  - Core ApiJWTAuthentication (auto audit: created_by / updated_by via signals)
  - Redis JTI blacklist (project-specific logout mechanism)
"""
from django.core.cache import cache
from rest_framework_simplejwt.exceptions import InvalidToken

from core.authentication import ApiJWTAuthentication


class RedisJWTAuthentication(ApiJWTAuthentication):
    """
    Extends Core ApiJWTAuthentication with Redis JTI blacklist.

    On every authenticated request:
    1. Core authenticate() validates JWT + wires pre_save signals for audit tracking.
    2. We additionally reject tokens blacklisted via logout.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result
        jti = token.get("jti")
        if jti and cache.get(f"token:blacklist:{jti}"):
            raise InvalidToken("Token has been revoked")

        return user, token
