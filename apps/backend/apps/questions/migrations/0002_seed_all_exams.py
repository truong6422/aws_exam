import json
import os
from django.db import migrations

def seed_all_exams(apps, schema_editor):
    Certification = apps.get_model("questions", "Certification")
    Question = apps.get_model("questions", "Question")
    Answer = apps.get_model("questions", "Answer")
    
    # Path to exam-data from repo root
    # apps/backend/apps/questions/migrations/0002_seed_all_exams.py
    base_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "../../../../../", "exam-data"))
    
    if not os.path.exists(base_path):
        print(f"\n  ! Warning: exam-data directory not found at {base_path}. Skipping seeding.")
        return

    cert_folders = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]
    
    total_q = 0
    for cert_code in cert_folders:
        json_path = os.path.join(base_path, cert_code, "questions.json")
        if not os.path.exists(json_path):
            continue
            
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        cert, _ = Certification.objects.get_or_create(
            code=cert_code,
            defaults={
                "name": data.get("certification_name", cert_code),
                "description": data.get("description", ""),
                "time_limit_minutes": 130,
                "total_questions": 65,
                "passing_score": 72,
            }
        )
        
        questions_data = data.get("questions", [])
        for item in questions_data:
            raw_answer = item.get("correct_answer") or ""
            correct_labels = {lbl.strip().upper() for lbl in str(raw_answer).split(",") if lbl.strip()}
            question_type = "multiple" if len(correct_labels) > 1 else "single"
            
            q = Question.objects.create(
                certification=cert,
                text=item["question"],
                explanation=item.get("explanation", ""),
                source=data.get("source", ""),
                question_type=question_type,
            )
            
            answers = []
            for opt in item.get("options", []):
                label = opt.get("label", "").strip().upper()
                answers.append(
                    Answer(
                        question=q,
                        text=opt['text'],
                        is_correct=(label in correct_labels),
                    )
                )
            Answer.objects.bulk_create(answers, ignore_conflicts=True)
            total_q += 1
            
    print(f"\n  ✓ Seeded {total_q} questions into the new database structure.")

def noop(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('questions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_all_exams, reverse_code=noop),
    ]
