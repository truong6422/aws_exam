#!/usr/bin/env bash
set -euo pipefail

# Dev-only reseed script for question bank + exam sets.
# Usage:
#   scripts/dev-reseed-question-data.sh [service_name]
# Example:
#   scripts/dev-reseed-question-data.sh django
#   scripts/dev-reseed-question-data.sh be

SERVICE_NAME="${1:-django}"

echo "[reseed] using docker compose service: ${SERVICE_NAME}"

docker compose exec "${SERVICE_NAME}" python manage.py shell <<'PY'
from apps.questions.models import Answer, Question, ExamSet, Certification
from apps.exams.models import AttemptAnswer
import importlib
from django.apps import apps as django_apps

print("[reseed] clearing old question-related data...")
AttemptAnswer.objects.all().delete()
Answer.objects.all().delete()
Question.objects.all().delete()
ExamSet.objects.all().delete()
Certification.objects.all().delete()

print("[reseed] seeding from migration scripts...")
importlib.import_module("apps.questions.migrations.0002_seed_all_exams").seed_all_exams(django_apps, None)
importlib.import_module("apps.questions.migrations.0003_partition_questions").partition_all_questions(django_apps, None)

print("[reseed] done")
print("cert=", Certification.objects.count(), "q=", Question.objects.count(), "a=", Answer.objects.count())
PY
