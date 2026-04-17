from django.urls import path

from .views import HistoryView, OverviewView

urlpatterns = [
    path('overview/', OverviewView.as_view(), name='overview'),
    path('history/', HistoryView.as_view(), name='history'),
]
