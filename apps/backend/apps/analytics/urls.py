from django.urls import path

from .views import UserProgressView

app_name = "analytics"

urlpatterns = [
    path("me/", UserProgressView.as_view(), name="user-progress"),
]
