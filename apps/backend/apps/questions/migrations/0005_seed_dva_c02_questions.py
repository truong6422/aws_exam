"""
Data migration: seed DVA-C02 questions from exam-data/DVA-C02/questions.json.
"""
import json
import os

from django.db import migrations


DATA_FILE = os.path.join(
    os.path.dirname(__file__),
    "../../../../..",
    "exam-data/DVA-C02/questions.json",
)

CERT_CODE = "DVA-C02"
CERT_NAME = "AWS Certified Developer - Associate"
CERT_DESCRIPTION = (
    "Validates ability to develop, deploy, and debug cloud-based applications using AWS. "
    "Covers development with AWS services, security, deployment, and troubleshooting."
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

    print(f"\n  ✓ Seeded {created_count} DVA-C02 questions into domain '{DEFAULT_DOMAIN}'.")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0004_seed_clf_c02_questions"),
    ]

    operations = [
        migrations.RunPython(load_questions, reverse_code=noop),
    ]
