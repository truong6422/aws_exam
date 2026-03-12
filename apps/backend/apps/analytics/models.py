"""
Analytics models — stubs only.
Full schema (UserProgress, DomainScore, PerformanceTrend) added in Phase 2.
"""
from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class UserProgress(TimestampedModel):
    """Placeholder — tracks per-user study progress over time."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="progress",
    )
    total_questions_answered = models.PositiveIntegerField(default=0)
    total_correct = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "user progress"
        verbose_name_plural = "user progress"

    def __str__(self) -> str:
        return f"Progress({self.user_id})"
