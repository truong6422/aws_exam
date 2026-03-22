from django.contrib import admin

from .models import Answer, Certification, Domain, Question


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text_preview", "domain", "question_type"]
    inlines = [AnswerInline]
    list_filter = ["domain__certification", "question_type"]
    search_fields = ["text"]

    @admin.display(description="Question")
    def text_preview(self, obj):
        return obj.text[:80]


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ["name", "certification", "weight_percentage"]
    list_filter = ["certification"]


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "total_questions", "passing_score"]
