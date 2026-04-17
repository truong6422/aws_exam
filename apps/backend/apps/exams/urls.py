from django.urls import path

from .views import (
    ExamAutosaveView,
    ExamListView,
    ExamPauseView,
    ExamResumeView,
    ExamReviewView,
    ExamStartView,
    ExamSubmitView,
)

app_name = 'exams'

urlpatterns = [
    path('', ExamListView.as_view(), name='exam-list'),
    path('start/', ExamStartView.as_view(), name='exam-start'),
    path('<int:pk>/autosave/', ExamAutosaveView.as_view(), name='exam-autosave'),
    path('<int:pk>/submit/', ExamSubmitView.as_view(), name='exam-submit'),
    path('<int:pk>/pause/', ExamPauseView.as_view(), name='exam-pause'),
    path('<int:pk>/resume/', ExamResumeView.as_view(), name='exam-resume'),
    path('<int:pk>/review/', ExamReviewView.as_view(), name='exam-review'),
]
