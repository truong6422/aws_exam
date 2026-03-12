"""
Shared DRF serializer mixins and base classes.
"""
from rest_framework import serializers


class TimestampedSerializer(serializers.ModelSerializer):
    """Includes read-only timestamp fields for subclasses."""

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
