"""
Custom User model for the accounts app.
Extends AbstractUser so all built-in auth machinery is preserved.
Real profile fields (avatar, subscription tier, etc.) added in Phase 2.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import TimestampedModel


class User(AbstractUser, TimestampedModel):
    """
    Project-wide user model.
    AUTH_USER_MODEL = 'accounts.User'
    """

    email = models.EmailField(unique=True)

    # Use email as the primary login identifier
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.email
