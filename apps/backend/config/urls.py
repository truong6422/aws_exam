"""
Root URL configuration.

Endpoints wired here (Phase 1 skeleton):
  /health/            — django-health-check (liveness probe)
  /api/               — browsable API root
  /api/auth/          — JWT token + /me/
  /api/questions/     — question list placeholder
  /api/exams/         — exam list placeholder
  /api/analytics/     — user progress placeholder
  /api/imports/       — import job list placeholder
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

    # API root (Phase 1 placeholder)
    path("api/", api_root, name="api-root"),

    # Auth: /api/auth/token/, /api/auth/token/refresh/, /api/auth/me/
    path("api/auth/", include("apps.accounts.urls")),

    # Domain apps (placeholder endpoints — expanded in Phase 2)
    path("api/questions/", include("apps.questions.urls")),
    path("api/exams/", include("apps.exams.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/imports/", include("apps.imports.urls")),

    # Core utilities: /api/core/ping/
    path("api/core/", include("apps.core.urls")),
]
