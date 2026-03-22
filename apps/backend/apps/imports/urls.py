"""URL routes for the imports app."""
from django.urls import path

from .views import BulkQuestionImportView, ImportJobListView

app_name = "imports"

urlpatterns = [
    # Legacy: GET /api/imports/ — list import jobs for current user
    path("", ImportJobListView.as_view(), name="import-job-list"),
    # POST /api/v1/imports/questions/ — staff-only bulk question import
    path("questions/", BulkQuestionImportView.as_view(), name="bulk-import"),
]
