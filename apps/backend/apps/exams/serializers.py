"""Exams serializers — placeholder stubs expanded in Phase 2."""
from rest_framework import serializers

from .models import Exam


class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ["id", "title", "created_by", "created_at", "updated_at"]
        read_only_fields = fields
