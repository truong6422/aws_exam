"""Questions serializers — placeholder stubs expanded in Phase 2."""
from rest_framework import serializers

from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "title", "created_at", "updated_at"]
        read_only_fields = fields
