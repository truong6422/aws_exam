from django.urls import path

from .views import ExamListView

app_name = "exams"

urlpatterns = [
    path("", ExamListView.as_view(), name="exam-list"),
]
