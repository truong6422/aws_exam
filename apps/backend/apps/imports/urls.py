from django.urls import path

from .views import ImportJobListView

app_name = "imports"

urlpatterns = [
    path("", ImportJobListView.as_view(), name="import-job-list"),
]
