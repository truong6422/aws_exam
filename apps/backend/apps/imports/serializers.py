"""Imports serializers — placeholder stubs expanded in Phase 2."""
from rest_framework import serializers

from .models import ImportJob


class ImportJobSerializer(serializers.ModelSerializer):
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
