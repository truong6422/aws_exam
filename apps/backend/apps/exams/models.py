"""
Exam session models — stubs only.
Full schema (Exam, ExamAttempt, AttemptAnswer, Timer) added in Phase 2.
"""
from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Exam(TimestampedModel):
    """Placeholder — real fields defined in Phase 2."""

    title = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="exams",
    )

    class Meta:
        verbose_name = "exam"
        verbose_name_plural = "exams"

    def __str__(self) -> str:
        return self.title
