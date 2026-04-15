"""
Shared abstract base models used across all apps.
Uses ModelMixin from vendored django-core for soft delete + audit tracking.
"""
from core.db.models.mixins import ModelMixin

# Alias for backward compatibility — all existing models that import
# TimestampedModel continue to work without change.
TimestampedModel = ModelMixin

__all__ = ["ModelMixin", "TimestampedModel"]
