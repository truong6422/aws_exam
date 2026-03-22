"""
Exam session models: ExamAttempt + AttemptAnswer.
Replaces stub Exam model from Phase 1.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimestampedModel


class ExamAttempt(TimestampedModel):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_attempts',
    )
    certification = models.ForeignKey(
        'questions.Certification',
        on_delete=models.CASCADE,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_limit_minutes = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='in_progress'
    )
    score_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    total_questions = models.PositiveIntegerField()
    correct_count = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    @property
    def time_remaining_seconds(self):
        elapsed = (timezone.now() - self.started_at).total_seconds()
        return max(0, int(self.time_limit_minutes * 60 - elapsed))

    @property
    def is_expired(self):
        return self.time_remaining_seconds == 0 and self.status == 'in_progress'

    def __str__(self):
        return f"{self.user.email} — {self.certification.code} — {self.status}"


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(
        ExamAttempt, on_delete=models.CASCADE, related_name='attempt_answers'
    )
    question = models.ForeignKey('questions.Question', on_delete=models.CASCADE)
    selected_answers = models.ManyToManyField('questions.Answer', blank=True)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Q{self.question_id} in Attempt {self.attempt_id}"
