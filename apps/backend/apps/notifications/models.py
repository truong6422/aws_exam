from django.conf import settings
from django.db import models


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ("wallet", "Wallet"),
        ("chat", "Chat"),
        ("system", "System"),
        ("survey", "Survey"),
        ("announcement", "Announcement"),
    )

    ACTION_TYPES = (
        ("none", "No Action"),
        ("rate_app", "Rate App"),
    )

    TARGET_TYPES = (
        ("all", "All Users"),
        ("active", "Active Users (with exam attempts)"),
        ("inactive", "Inactive Users (no exam attempts)"),
        ("selected", "Selected Users"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPES, default="system"
    )
    link = models.CharField(max_length=255, blank=True, null=True)
    action_type = models.CharField(
        max_length=50, choices=ACTION_TYPES, default="none", blank=True
    )
    action_data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    broadcast_id = models.UUIDField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.title}"
