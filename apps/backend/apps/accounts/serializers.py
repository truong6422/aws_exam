"""
Accounts serializers — placeholder stubs expanded in Phase 2.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation (safe for public responses)."""

    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "date_joined"]
        read_only_fields = fields
