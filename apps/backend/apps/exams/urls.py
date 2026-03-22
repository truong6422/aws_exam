from django.urls import path

from .views import (
    ExamAutosaveView,
    ExamListView,
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
    path('<int:pk>/review/', ExamReviewView.as_view(), name='exam-review'),
]
