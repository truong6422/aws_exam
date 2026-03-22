from django.contrib import admin

from .models import AttemptAnswer, ExamAttempt


class AttemptAnswerInline(admin.TabularInline):
    model = AttemptAnswer
    extra = 0
    readonly_fields = ['question', 'selected_answers_display', 'answered_at']
    fields = ['question', 'selected_answers_display', 'answered_at']

    def selected_answers_display(self, obj):
        return ', '.join(str(a) for a in obj.selected_answers.all())

    selected_answers_display.short_description = 'Selected Answers'

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'certification', 'status', 'score_percentage', 'started_at']
    list_filter = ['status', 'certification']
    readonly_fields = [
        'started_at', 'submitted_at', 'score_percentage',
        'correct_count', 'time_remaining_seconds',
    ]
    inlines = [AttemptAnswerInline]
    search_fields = ['user__email', 'certification__code']
