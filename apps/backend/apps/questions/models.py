"""
Question bank models — stubs only.
Full schema (Question, Choice, Domain, Tag, Explanation) added in Phase 2.
"""
from django.db import models

from apps.core.models import TimestampedModel


class Question(TimestampedModel):
    """Placeholder — real fields defined in Phase 2."""

    title = models.CharField(max_length=512)

    class Meta:
        verbose_name = "question"
        verbose_name_plural = "questions"

    def __str__(self) -> str:
        return self.title[:80]
