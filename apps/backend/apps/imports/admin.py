from django.contrib import admin

from .models import ImportJob


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    list_display = ["id", "file_name", "status", "uploaded_by", "created_at"]
    list_filter = ["status"]
    search_fields = ["file_name"]
    raw_id_fields = ["uploaded_by"]
