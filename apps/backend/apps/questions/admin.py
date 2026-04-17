from django.contrib import admin

from .models import Answer, AnswerReport, Certification, ExamSet, Question


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text_preview", "certification", "exam_set", "get_set_locked", "question_type"]
    inlines = [AnswerInline]
    list_filter = ["certification", "exam_set", "exam_set__is_locked", "question_type"]
    search_fields = ["text"]

    @admin.display(description="Question")
    def text_preview(self, obj):
        return obj.text[:80]

    @admin.display(description="Set Locked", boolean=True)
    def get_set_locked(self, obj):
        return obj.exam_set.is_locked if obj.exam_set else None




@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "total_questions", "passing_score"]


@admin.register(ExamSet)
class ExamSetAdmin(admin.ModelAdmin):
    list_display = ["name", "certification", "is_locked", "question_count_display"]
    list_editable = ["is_locked"]
    list_filter = ["certification", "is_locked"]
    search_fields = ["name"]
    actions = ["unlock_sets", "lock_sets"]

    @admin.display(description="Questions")
    def question_count_display(self, obj):
        return obj.questions.count()

    @admin.action(description="Unlock selected sets")
    def unlock_sets(self, request, queryset):
        queryset.update(is_locked=False)

    @admin.action(description="Lock selected sets")
    def lock_sets(self, request, queryset):
        queryset.update(is_locked=True)


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
