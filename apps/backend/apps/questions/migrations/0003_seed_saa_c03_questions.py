"""
Data migration: seed SAA-C03 questions from exam-data/SAA-C03/questions.json.

Runs forward only — reverse is a no-op (data deletions are irreversible and
dangerous; use the admin or a management command to roll back if needed).
"""
import json
import os

from django.db import migrations


DATA_FILE = os.path.join(
    os.path.dirname(__file__),
    "../../../../..",  # repo root
    "exam-data/SAA-C03/questions.json",
)

CERT_CODE = "SAA-C03"
CERT_NAME = "AWS Certified Solutions Architect - Associate"
CERT_DESCRIPTION = (
    "Validates the ability to design and implement distributed systems on AWS. "
    "Covers resilient architectures, high-performing architectures, secure applications, "
    "and cost-optimized architectures."
)
DEFAULT_DOMAIN = "General"


def load_questions(apps, schema_editor):
    Certification = apps.get_model("questions", "Certification")
    Domain = apps.get_model("questions", "Domain")
    Question = apps.get_model("questions", "Question")
    Answer = apps.get_model("questions", "Answer")

    data_path = os.path.normpath(DATA_FILE)
    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)

    cert, _ = Certification.objects.get_or_create(
        code=CERT_CODE,
        defaults={
            "name": CERT_NAME,
            "description": CERT_DESCRIPTION,
            "time_limit_minutes": 130,
            "total_questions": 65,
            "passing_score": 72,
        },
    )

    domain, _ = Domain.objects.get_or_create(
        certification=cert,
        name=DEFAULT_DOMAIN,
        defaults={"weight_percentage": 100},
    )

    questions = data.get("questions", [])
    created_count = 0

    for item in questions:
        raw_answer = item.get("correct_answer", "")
        # correct_answer may be "A", "B,C", "A,C" — normalise to list of labels
        correct_labels = {lbl.strip().upper() for lbl in raw_answer.split(",") if lbl.strip()}
        question_type = "multiple" if len(correct_labels) > 1 else "single"

        question = Question.objects.create(
            domain=domain,
            text=item["question"],
            explanation="",
            source=data.get("source", ""),
            question_type=question_type,
        )

        answers = []
        for opt in item.get("options", []):
            label = opt.get("label", "").strip().upper()
            answers.append(
                Answer(
                    question=question,
                    text=opt['text'],
                    is_correct=(label in correct_labels),
                )
            )
        Answer.objects.bulk_create(answers, ignore_conflicts=True)
        created_count += 1

    print(f"\n  ✓ Seeded {created_count} SAA-C03 questions into domain '{DEFAULT_DOMAIN}'.")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0002_certification_created_by_certification_deleted_at_and_more"),
    ]

    operations = [
        migrations.RunPython(load_questions, reverse_code=noop),
    ]
