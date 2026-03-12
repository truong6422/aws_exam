from django.contrib import admin

from .models import UserProgress


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ["user", "total_questions_answered", "total_correct", "updated_at"]
    raw_id_fields = ["user"]
