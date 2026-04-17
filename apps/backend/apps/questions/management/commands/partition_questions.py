from django.core.management.base import BaseCommand
from apps.questions.models import Certification, Question, ExamSet


class Command(BaseCommand):
    """
    Divide existing questions into exam sets of 65 questions each.
    Usage: python manage.py partition_questions
    """

    help = "Divide existing questions into exam sets of 65 questions each."

    def handle(self, *args, **options):
        certs = Certification.objects.all()
        if not certs.exists():
            self.stdout.write(self.style.WARNING("No certifications found."))
            return

        for cert in certs:
            self.stdout.write(f"Processing certification: {cert.code}")

            # We filter by certification to get questions belonging to this cert
            questions = Question.objects.filter(
                certification=cert, exam_set__isnull=True
            ).order_by("id")

            total_unassigned = questions.count()
            self.stdout.write(f"Found {total_unassigned} unassigned questions.")

            if total_unassigned == 0:
                continue

            # Standard AWS exam has 65 questions
            set_size = cert.total_questions if cert.total_questions > 0 else 65

            # Find the starting index for naming new sets if some already exist
            existing_sets_count = ExamSet.objects.filter(certification=cert).count()

            for i in range(0, total_unassigned, set_size):
                set_index = existing_sets_count + (i // set_size) + 1
                set_name = f"Practice Exam {set_index}"

                # Create the exam set
                # New sets are locked by default according to user request,
                # but maybe for existing data we keep them unlocked so users can still study?
                # User said: "chế độ lock đề chỉ khi nào admin unlock người udngf mới co stheer nhìn thấy"
                # So I will set is_locked=True for new sets.
                exam_set, created = ExamSet.objects.get_or_create(
                    certification=cert,
                    name=set_name,
                    defaults={
                        "is_locked": True,
                        "description": f"Automated partition for {cert.code}",
                    },
                )

                # Get the IDs of the questions for this chunk
                chunk_ids = list(questions[i : i + set_size].values_list("id", flat=True))

                # Assign questions to the set
                updated_count = Question.objects.filter(id__in=chunk_ids).update(
                    exam_set=exam_set
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created {set_name} and assigned {updated_count} questions."
                    )
                )

        self.stdout.write(
            self.style.SUCCESS("Successfully partitioned questions into sets.")
        )
