"""
Root URL configuration.

Endpoints:
  /health/            — django-health-check (liveness probe)
  /api/               — browsable API root
  /api/auth/          — auth endpoints (token, login, register, logout, me)
  /api/v1/auth/       — same auth endpoints under versioned prefix
  /api/v1/questions/  — question bank
  /api/v1/exams/      — exam sessions
  /api/v1/analytics/  — user progress
  /api/v1/imports/    — import jobs
  /api/core/ping/     — internal liveness ping
  /admin/             — Django admin
  /__debug__/         — Django Debug Toolbar (dev only)
"""
from django.apps import apps
from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """Browsable API root — lists top-level resource groups."""
    return Response(
        {
            "auth": request.build_absolute_uri("/api/v1/auth/"),
            "questions": request.build_absolute_uri("/api/v1/questions/"),
            "exams": request.build_absolute_uri("/api/v1/exams/"),
            "analytics": request.build_absolute_uri("/api/v1/analytics/"),
            "imports": request.build_absolute_uri("/api/v1/imports/"),
            "wallet": request.build_absolute_uri("/api/v1/wallet/"),
        }
    )


urlpatterns = [
    # Django admin
    path("django-admin/", admin.site.urls),

    # Health check (used by Docker / k8s liveness probes)
    path("health/", include("health_check.urls")),

    # API root
    path("api/", api_root, name="api-root"),

    # Auth — unversioned (backward compatible) + versioned
    path("api/auth/", include(("apps.accounts.urls", "accounts"))),
    path("api/v1/auth/", include(("apps.accounts.urls", "accounts_v1"))),

    # Questions
    path("api/v1/questions/", include(("apps.questions.urls", "questions_v1"))),
    path("api/questions/", include(("apps.questions.urls", "questions"))),

    # Exams
    path("api/v1/exams/", include(("apps.exams.urls", "exams_v1"))),
    path("api/exams/", include(("apps.exams.urls", "exams"))),

    # Analytics
    path("api/v1/analytics/", include(("apps.analytics.urls", "analytics_v1"))),
    path("api/analytics/", include(("apps.analytics.urls", "analytics"))),

    # Imports
    path("api/v1/imports/", include(("apps.imports.urls", "imports_v1"))),
    path("api/imports/", include(("apps.imports.urls", "imports"))),

    # Wallet
    path("api/v1/wallet/", include(("apps.wallet.urls", "wallet_v1"))),
    path("api/v1/wallet/admin/", include(("apps.wallet.urls_admin", "admin_wallet_v1"))),

    # Notifications
    path("api/v1/notifications/", include(("apps.notifications.urls", "notifications_v1"))),

    # Chat
    path("api/v1/chat/", include(("apps.chat.urls", "chat_v1"))),

    # Core utilities
    path("api/core/", include("apps.core.urls")),
]

# Django Debug Toolbar — registered only when app is installed (dev only)
if apps.is_installed("debug_toolbar"):
    import debug_toolbar  # noqa: PLC0415
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
