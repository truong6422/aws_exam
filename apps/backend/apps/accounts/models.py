"""
Custom User model for the accounts app.
Extends AbstractUser so all built-in auth machinery is preserved.
Uses ModelMixin for soft delete + audit fields (created_by, updated_by, etc).

Note: AbstractUser already has date_joined / last_login.
ModelMixin adds: created_by, updated_by, deleted_by, created_at, updated_at,
                 deleted_at, is_deleted + SoftDeleteManager.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import ModelMixin


class User(AbstractUser, ModelMixin):
    """
    Project-wide user model.
    AUTH_USER_MODEL = 'accounts.User'
    Login via email. Username is auto-generated from email on registration.
    """

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True, default="")

    # Use email as the primary login identifier
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.email
