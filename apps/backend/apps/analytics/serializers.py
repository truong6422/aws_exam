"""Analytics serializers — placeholder stubs expanded in Phase 2."""
from rest_framework import serializers

from .models import UserProgress


class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = [
            "id",
            "user",
            "total_questions_answered",
            "total_correct",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
