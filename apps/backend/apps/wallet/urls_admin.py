from django.urls import path

from .views import (
    AdminSystemConfigView,
    AdminTopUpApproveView,
    AdminTopUpRejectView,
    AdminTopUpRequestListView,
    AdminTopUpSummaryView,
)

app_name = "admin_wallet"

urlpatterns = [
    path("topup-requests/", AdminTopUpRequestListView.as_view(), name="topup-list"),
    path(
        "topup-requests/<int:pk>/approve/",
        AdminTopUpApproveView.as_view(),
        name="topup-approve",
    ),
    path(
        "topup-requests/<int:pk>/reject/",
        AdminTopUpRejectView.as_view(),
        name="topup-reject",
    ),
    path("topup-requests/summary/", AdminTopUpSummaryView.as_view(), name="topup-summary"),
    path("system-config/", AdminSystemConfigView.as_view(), name="system-config"),
]
