from django.urls import path

from .views import CertificationListView, DomainListView

app_name = "questions"

urlpatterns = [
    path("certifications/", CertificationListView.as_view(), name="certification-list"),
    path(
        "certifications/<int:certification_id>/domains/",
        DomainListView.as_view(),
        name="domain-list",
    ),
]
