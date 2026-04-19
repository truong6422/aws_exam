from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    SENDER_TYPES = (
        ("user", "User"),
        ("admin", "Admin"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_messages"
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Useful for webhook tracking if needed
    telegram_message_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender_type} to {self.user.email}: {self.message[:20]}"
