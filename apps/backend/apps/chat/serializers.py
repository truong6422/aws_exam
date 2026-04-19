from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "sender_type", "message", "is_read", "created_at"]
        read_only_fields = ["id", "created_at", "sender_type"]
