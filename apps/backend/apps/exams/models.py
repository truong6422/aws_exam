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
        ('paused', 'Paused'),
        ('submitted', 'Submitted'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_attempts',
        null=True,
        blank=True,
    )
    certification = models.ForeignKey(
        'questions.Certification',
        on_delete=models.CASCADE,
    )
    exam_set = models.ForeignKey(
        'questions.ExamSet',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='exam_attempts',
    )
    started_at = models.DateTimeField(auto_now_add=True)
    # The last time the exam was resumed or started
    last_resumed_at = models.DateTimeField(default=timezone.now)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_limit_minutes = models.PositiveIntegerField()
    # Seconds spent across previous sessions (excluding the current session since last_resumed_at)
    accumulated_seconds = models.PositiveIntegerField(default=0)
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
    def time_spent_total(self):
        """Total seconds spent on this exam including current session."""
        if self.status == 'in_progress':
            current_session = (timezone.now() - self.last_resumed_at).total_seconds()
            return int(self.accumulated_seconds + current_session)
        return self.accumulated_seconds

    @property
    def time_remaining_seconds(self):
        limit_seconds = self.time_limit_minutes * 60
        return max(0, limit_seconds - self.time_spent_total)

    @property
    def is_expired(self):
        return self.time_remaining_seconds == 0 and self.status == 'in_progress'

    def __str__(self):
        user_email = self.user.email if self.user else "Guest"
        return f"{user_email} — {self.certification.code} — {self.status}"


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(
        ExamAttempt, on_delete=models.CASCADE, related_name='attempt_answers'
    )
    question = models.ForeignKey('questions.Question', on_delete=models.CASCADE)
    selected_answers = models.ManyToManyField('questions.Answer', blank=True)
    is_flagged = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Q{self.question_id} in Attempt {self.attempt_id}"
