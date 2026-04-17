"""Imports serializers: legacy ImportJob stub + bulk question import."""
from django.db import transaction
from rest_framework import serializers

from apps.questions.models import Answer, Certification, Question

from .models import ImportJob
from .validators import validate_import_data


class ImportJobSerializer(serializers.ModelSerializer):
    """Read-only serializer for the legacy ImportJob model."""

    class Meta:
        model = ImportJob
        fields = [
            "id",
            "file_name",
            "status",
            "error_message",
            "uploaded_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class BulkQuestionImportSerializer(serializers.Serializer):
    """Validate and persist a bulk question import payload."""

    data = serializers.JSONField()

    def validate_data(self, value):
        is_valid, errors = validate_import_data(value)
        if not is_valid:
            raise serializers.ValidationError(errors)
        return value

    def create(self, validated_data):
        import_data = validated_data["data"]
        cert = Certification.objects.get(code=import_data["certification_code"])

        created_count = 0
        with transaction.atomic():
            for q_data in import_data["questions"]:
                question = Question.objects.create(
                    certification=cert,
                    text=q_data["text"],
                    explanation=q_data.get("explanation", ""),
                    source=q_data.get("source", ""),
                    question_type=q_data.get("question_type", "single"),
                )
                for a_data in q_data["answers"]:
                    Answer.objects.create(
                        question=question,
                        text=a_data["text"],
                        is_correct=a_data["is_correct"],
                    )
                created_count += 1

        return {"imported": created_count, "errors": []}
