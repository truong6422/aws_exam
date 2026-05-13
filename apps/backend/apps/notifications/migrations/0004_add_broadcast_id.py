# Generated migration
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0003_update_action_types'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='broadcast_id',
            field=models.UUIDField(null=True, blank=True, db_index=True),
        ),
    ]
