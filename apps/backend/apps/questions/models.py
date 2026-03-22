"""
Question bank models: Certification → Domain → Question → Answer.
"""
from django.db import models

from apps.core.models import TimestampedModel


class Certification(TimestampedModel):
    """AWS certification (e.g. SAA-C03, CLF-C02)."""

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    time_limit_minutes = models.PositiveIntegerField(default=130)
    total_questions = models.PositiveIntegerField(default=65)
    passing_score = models.PositiveIntegerField(default=72)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class Domain(TimestampedModel):
    """Exam domain/category within a certification."""

    certification = models.ForeignKey(
        Certification, on_delete=models.CASCADE, related_name="domains"
    )
    name = models.CharField(max_length=255)
    weight_percentage = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("certification", "name")
        ordering = ["certification", "name"]

    def __str__(self) -> str:
        return f"{self.certification.code} / {self.name}"


class Question(TimestampedModel):
    """Exam question belonging to a domain."""

    SINGLE = "single"
    MULTIPLE = "multiple"
    QUESTION_TYPE_CHOICES = [
        (SINGLE, "Single"),
        (MULTIPLE, "Multiple"),
    ]

    domain = models.ForeignKey(
        Domain, on_delete=models.CASCADE, related_name="questions"
    )
    text = models.TextField()
    explanation = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    question_type = models.CharField(
        max_length=10, choices=QUESTION_TYPE_CHOICES, default=SINGLE
    )

    class Meta:
        ordering = ["domain", "id"]

    def __str__(self) -> str:
        return self.text[:80]


class Answer(models.Model):
    """Possible answer for a question."""

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="answers"
    )
    text = models.TextField()
    is_correct = models.BooleanField()

    class Meta:
        unique_together = ("question", "text")

    def __str__(self) -> str:
        mark = "✓" if self.is_correct else "✗"
        return f"{mark} {self.text[:50]}"
