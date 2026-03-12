"""
Shared abstract base models used across all apps.
"""
from django.db import models


class TimestampedModel(models.Model):
    """Abstract base that adds created_at / updated_at to every subclass."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
