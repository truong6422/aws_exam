# Generated migration to add remaining ModelMixin fields to existing Feedback table
# Note: created_at, updated_at already exist from 0009_feedback

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0010_alter_feedback_comment_max_length'),
    ]

    operations = [
        migrations.AddField(
            model_name='feedback',
            name='created_by',
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='updated_by',
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='deleted_by',
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
    ]
