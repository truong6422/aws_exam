from django.urls import path

from .views import HistoryView, OverviewView, WeakDomainsView

urlpatterns = [
    path('overview/', OverviewView.as_view(), name='overview'),
    path('weak-domains/', WeakDomainsView.as_view(), name='weak-domains'),
    path('history/', HistoryView.as_view(), name='history'),
]
