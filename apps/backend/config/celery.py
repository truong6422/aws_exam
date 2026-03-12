"""
Celery application instance.
Import this in tasks so the app is always initialised before use.
"""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("aws_exam_app")

# Read config from Django settings, namespace avoids clashes with other keys
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in every INSTALLED_APP
app.autodiscover_tasks()
