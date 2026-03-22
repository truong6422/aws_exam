"""
Test settings — extends development but replaces Redis with in-memory cache
so tests run without a Redis server.
"""
from decouple import config
from .development import *  # noqa: F401, F403

# Configure test database — use db_test service in docker-compose.test.yml
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="awsexam_test"),
        "USER": config("DB_USER", default="awsexam_test"),
        "PASSWORD": config("DB_PASSWORD", default="testpassword"),
        "HOST": config("DB_HOST", default="db_test"),
        "PORT": config("DB_PORT", default="5432"),
        "CONN_MAX_AGE": 0,  # Don't persist connections in tests
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}

# Use in-memory cache for tests — no Redis required
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Disable debug toolbar in tests (not needed)
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]  # noqa: F405
MIDDLEWARE = [m for m in MIDDLEWARE if "debug_toolbar" not in m]  # noqa: F405
