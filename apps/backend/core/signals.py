from deepdiff import DeepDiff
from django.apps import AppConfig
from django.dispatch import receiver
from django.utils.timezone import now

from core import config as core_config
from core.db.models.signals import emit_post_migrate_data
from core.models import MigrationData


@receiver(emit_post_migrate_data, sender=core_config.SENDER_MIGRATE_DATA)
def handle_post_migrate_data(sender, app: AppConfig, name: str, data, **kwargs):
    migration_data, _ = MigrationData.objects.get_or_create(
        app=app.name, name=name
    )
    diff = DeepDiff(migration_data.data, data)
    if diff:
        migration_data.applied = now()
        migration_data.data = data
        migration_data.save(update_fields=['applied', 'data'])
