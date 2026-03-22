"""
Accounts serializers — register, profile, profile update, and change password.
"""
import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only user representation (safe for public responses)."""

    class Meta:
        model = User
        fields = ["id", "email", "username", "name", "date_joined", "is_staff"]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    """Validate and create a new user account."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(max_length=150, required=False, default="", allow_blank=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data["password"]
        name = validated_data.get("name", "")

        base_username = email.split("@")[0][:30]
        username = base_username
        if User.objects.filter(username=username).exists():
            username = f"{base_username}_{uuid.uuid4().hex[:6]}"

        return User.objects.create_user(
            username=username,
            email=email,
            password=password,
            name=name,
        )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Writable serializer for updating user profile (name only)."""

    class Meta:
        model = User
        fields = ["name"]


class ChangePasswordSerializer(serializers.Serializer):
    """Validate old password and accept new password for change."""

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Current password is incorrect."})
        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs
