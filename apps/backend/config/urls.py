"""
Root URL configuration.

Endpoints:
  /health/            — django-health-check (liveness probe)
  /api/               — browsable API root
  /api/auth/          — auth endpoints (token, login, register, logout, me)
  /api/v1/auth/       — same auth endpoints under versioned prefix
  /api/questions/     — question list
  /api/exams/         — exam list
  /api/analytics/     — user progress
  /api/imports/       — import jobs
  /api/core/ping/     — internal liveness ping
  /admin/             — Django admin
"""
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
            "auth": request.build_absolute_uri("/api/auth/"),
            "accounts": request.build_absolute_uri("/api/accounts/"),
            "questions": request.build_absolute_uri("/api/questions/"),
            "exams": request.build_absolute_uri("/api/exams/"),
            "analytics": request.build_absolute_uri("/api/analytics/"),
            "imports": request.build_absolute_uri("/api/imports/"),
        }
    )


urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # Health check (used by Docker / k8s liveness probes)
    path("health/", include("health_check.urls")),

    # API root
    path("api/", api_root, name="api-root"),

    # Auth — unversioned (backward compatible)
    path("api/auth/", include(("apps.accounts.urls", "accounts"))),

    # Auth — versioned prefix (used by frontend and tests)
    path("api/v1/auth/", include(("apps.accounts.urls", "accounts_v1"))),

    # Questions — versioned (new) + unversioned (backward compat)
    path("api/v1/questions/", include(("apps.questions.urls", "questions_v1"))),
    path("api/questions/", include("apps.questions.urls")),
    # Exams — versioned (new) + unversioned (backward compat)
    path("api/v1/exams/", include(("apps.exams.urls", "exams_v1"))),
    path("api/exams/", include("apps.exams.urls")),
    # Analytics — versioned (new) + unversioned (backward compat)
    path("api/v1/analytics/", include(("apps.analytics.urls", "analytics_v1"))),
    path("api/analytics/", include(("apps.analytics.urls", "analytics"))),
    # Imports — versioned (new) + unversioned (backward compat)
    path("api/v1/imports/", include(("apps.imports.urls", "imports_v1"))),
    path("api/imports/", include("apps.imports.urls")),

    # Core utilities: /api/core/ping/
    path("api/core/", include("apps.core.urls")),
]
