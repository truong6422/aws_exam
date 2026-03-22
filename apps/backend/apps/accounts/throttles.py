"""
Custom throttle classes for the accounts app.
"""
from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """Limit login attempts to 5 per minute per IP.

    Uses SimpleRateThrottle (not ScopedRateThrottle) so the rate applies
    unconditionally without requiring a throttle_scope on the view.
    Rate configured via DEFAULT_THROTTLE_RATES["login"] in settings.
    """

    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
