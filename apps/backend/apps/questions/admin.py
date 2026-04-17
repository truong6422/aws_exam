from django.contrib import admin

from .models import Answer, AnswerReport, Certification, Domain, Question


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


@admin.register(AnswerReport)
class AnswerReportAdmin(admin.ModelAdmin):
    list_display = ["question_preview", "reporter", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["question__text", "reporter__email"]
    readonly_fields = ["question", "reporter", "reason", "created_at"]
    actions = ["mark_reviewed", "mark_dismissed"]

    @admin.display(description="Question")
    def question_preview(self, obj):
        return str(obj.question)[:80]

    @admin.action(description="Mark selected as Reviewed")
    def mark_reviewed(self, request, queryset):
        queryset.update(status=AnswerReport.STATUS_REVIEWED)

    @admin.action(description="Mark selected as Dismissed")
    def mark_dismissed(self, request, queryset):
        queryset.update(status=AnswerReport.STATUS_DISMISSED)
