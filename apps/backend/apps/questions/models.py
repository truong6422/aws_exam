"""
Question bank models: Certification → Domain → Question → Answer.
Community models: Comment, AnswerReport, Bookmark.
"""
from django.conf import settings
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




class ExamSet(TimestampedModel):
    """A collection of questions (typically 65) for a specific certification."""

    certification = models.ForeignKey(
        Certification, on_delete=models.CASCADE, related_name="exam_sets"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_locked = models.BooleanField(default=True)
    price_credits = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["certification", "name"]
        unique_together = ("certification", "name")

    def __str__(self) -> str:
        return f"{self.certification.code} - {self.name}"


class Question(TimestampedModel):
    """Exam question belonging to a certification and optionally an exam set."""

    SINGLE = "single"
    MULTIPLE = "multiple"
    QUESTION_TYPE_CHOICES = [
        (SINGLE, "Single"),
        (MULTIPLE, "Multiple"),
    ]

    certification = models.ForeignKey(
        Certification,
        on_delete=models.CASCADE,
        related_name="questions",
        null=True,
        blank=True,
    )
    exam_set = models.ForeignKey(
        ExamSet,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="questions",
    )
    text = models.TextField()
    explanation = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    question_type = models.CharField(
        max_length=10, choices=QUESTION_TYPE_CHOICES, default=SINGLE
    )

    class Meta:
        ordering = ["certification", "id"]

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


class Comment(TimestampedModel):
    """Community comment on a question. Visible after answer reveal in Practice Mode."""

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    referenced_answers = models.ManyToManyField(
        Answer,
        blank=True,
        related_name="comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    body = models.TextField(max_length=2000)
    upvotes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="upvoted_comments"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Comment by {self.author_id} on Q#{self.question_id}"


class AnswerReport(TimestampedModel):
    """User report flagging a question's answer as incorrect. Reviewed in Admin."""

    STATUS_PENDING = "pending"
    STATUS_REVIEWED = "reviewed"
    STATUS_DISMISSED = "dismissed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="reports"
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports"
    )
    reason = models.TextField(max_length=1000)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )

    class Meta:
        unique_together = ("question", "reporter")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Report by {self.reporter_id} on Q#{self.question_id} [{self.status}]"


class Bookmark(models.Model):
    """User bookmark on a question for later review."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="bookmarks"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "question")

    def __str__(self) -> str:
        return f"Bookmark by {self.user_id} on Q#{self.question_id}"


class UserExamUnlock(models.Model):
    """Join table recording which users have paid to unlock which exam sets."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exam_unlocks",
    )
    exam_set = models.ForeignKey(
        ExamSet,
        on_delete=models.CASCADE,
        related_name="unlocks",
    )
    credits_spent = models.PositiveIntegerField()
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "questions_userexamunlock"
        unique_together = ("user", "exam_set")
        ordering = ["-unlocked_at"]

    def __str__(self) -> str:
        return f"Unlock: {self.user_id} -> ExamSet#{self.exam_set_id}"
