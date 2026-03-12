"""
Shared DRF views, mixins, and utility view helpers.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def ping(request):
    """Simple liveness check used in tests."""
    return Response({"status": "ok"})
