from django.urls import path

from .views import ping

app_name = "core"

urlpatterns = [
    path("ping/", ping, name="ping"),
]
