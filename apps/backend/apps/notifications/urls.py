from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
    AdminBroadcastNotificationView,
    AdminNotificationHistoryView,
)

app_name = "notifications"

urlpatterns = [
    # User endpoints
    path("", NotificationListView.as_view(), name="list"),
    path("unread-count/", NotificationUnreadCountView.as_view(), name="unread-count"),
    path("mark-read/", NotificationMarkReadView.as_view(), name="mark-read-all"),
    path("<int:pk>/mark-read/", NotificationMarkReadView.as_view(), name="mark-read"),
    # Admin endpoints
    path("admin/broadcast/", AdminBroadcastNotificationView.as_view(), name="admin-broadcast"),
    path("admin/history/", AdminNotificationHistoryView.as_view(), name="admin-history"),
]
