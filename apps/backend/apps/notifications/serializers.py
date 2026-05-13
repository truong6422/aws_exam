from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "notification_type", "link", "action_type", "action_data", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]


class BroadcastNotificationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(
        choices=["system", "survey", "announcement"], default="announcement"
    )
    action_type = serializers.ChoiceField(
        choices=["none", "rate_app"],
        default="none"
    )
    link = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    target_type = serializers.ChoiceField(
        choices=["all", "active", "inactive", "selected"],
        default="all"
    )
    target_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    exclude_admin = serializers.BooleanField(default=True)
