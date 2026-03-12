"""
ASGI entry-point — handles HTTP via Django and WebSockets via Channels.
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

# Initialise Django before importing app-level routing
django_asgi_app = get_asgi_application()

# Import after Django setup to avoid AppRegistryNotReady
from apps.core import routing as core_routing  # noqa: E402

application = ProtocolTypeRouter(
    {
        # Standard HTTP — handled by Django
        "http": django_asgi_app,
        # WebSocket — wrapped with auth + allowed-hosts validation
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(core_routing.websocket_urlpatterns))
        ),
    }
)
