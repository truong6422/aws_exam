from django.contrib import admin

from .models import Exam


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "created_by", "created_at"]
    search_fields = ["title"]
    raw_id_fields = ["created_by"]
