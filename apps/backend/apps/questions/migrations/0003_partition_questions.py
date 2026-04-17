from django.db import migrations

def partition_all_questions(apps, schema_editor):
    from apps.questions.models import Certification, Question, ExamSet
    
    # We must use the models from the apps argument for safety in migrations
    # but for simplicity and since it's a new DB, we can use the main models
    # if we are sure. To be strictly correct:
    CertificationM = apps.get_model("questions", "Certification")
    QuestionM = apps.get_model("questions", "Question")
    ExamSetM = apps.get_model("questions", "ExamSet")
    
    certs = CertificationM.objects.all()
    
    for cert in certs:
        # Get unassigned questions
        unassigned_qs = QuestionM.objects.filter(
            certification=cert,
            exam_set__isnull=True,
            is_deleted=False
        ).order_by('id')
        
        count = unassigned_qs.count()
        if count == 0:
            continue
            
        num_sets = (count // cert.total_questions) + (1 if count % cert.total_questions > 0 else 0)
        
        for i in range(num_sets):
            set_name = f"Practice Exam {i + 1}"
            exam_set, created = ExamSetM.objects.get_or_create(
                certification=cert,
                name=set_name,
                defaults={
                    "description": f"Automated partition for {cert.code}",
                    "is_locked": True
                }
            )
            
            # Take next chunk of questions
            chunk_ids = unassigned_qs.values_list('id', flat=True)[:cert.total_questions]
            if not chunk_ids:
                break
                
            QuestionM.objects.filter(id__in=list(chunk_ids)).update(exam_set=exam_set)
            
    print("\n  ✓ Questions successfully partitioned into exam sets.")

def noop(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('questions', '0002_seed_all_exams'),
    ]

    operations = [
        migrations.RunPython(partition_all_questions, reverse_code=noop),
    ]
