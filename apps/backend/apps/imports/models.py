"""
Import job models — stubs only.
Full schema (ImportJob, ImportRow, status machine) added in Phase 2.
"""
from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class ImportJob(TimestampedModel):
    """
    Tracks an async bulk-import of questions from CSV / JSON.
    Processing delegated to Celery tasks (Phase 2).
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="import_jobs",
    )
    file_name = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    error_message = models.TextField(blank=True)

    class Meta:
        verbose_name = "import job"
        verbose_name_plural = "import jobs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"ImportJob({self.file_name}, {self.status})"
