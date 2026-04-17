"""
Data migration: seed MLA-C01 questions from exam-data/MLA-C01/questions.json.
"""
import json
import os

from django.db import migrations


DATA_FILE = os.path.join(
    os.path.dirname(__file__),
    "../../../../..",
    "exam-data/MLA-C01/questions.json",
)

CERT_CODE = "MLA-C01"
CERT_NAME = "AWS Certified Machine Learning Engineer - Associate"
CERT_DESCRIPTION = (
    "Validates expertise in building, deploying, and maintaining ML solutions on AWS. "
    "Covers ML model training, evaluation, deployment, monitoring, and MLOps practices."
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
        raw_answer = item.get("correct_answer") or ""
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

    print(f"\n  ✓ Seeded {created_count} MLA-C01 questions into domain '{DEFAULT_DOMAIN}'.")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0007_seed_dea_c01_questions"),
    ]

    operations = [
        migrations.RunPython(load_questions, reverse_code=noop),
    ]
