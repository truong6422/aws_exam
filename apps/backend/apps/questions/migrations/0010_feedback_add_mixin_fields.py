# Generated migration to add ModelMixin fields to existing Feedback table

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0009_feedback'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='feedback',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='created_by',
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='deleted_by',
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='feedback',
            name='updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='updated_by',
            field=models.BigIntegerField(blank=True, null=True),
        ),
    ]
