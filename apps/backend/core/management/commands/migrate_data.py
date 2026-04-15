import glob
import json
import logging
import os
from pathlib import Path

from deepdiff import DeepDiff
from django.apps import apps
from django.core.management import BaseCommand

from core import config as core_config
from core.db.models import signals
from core.models import MigrationData

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Migrate data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--app",
            "-a",
            dest="app_label",
            help="Only look for migrate data in the specified app.",
        )
        parser.add_argument(
            "--dir",
            "-d",
            dest="dir",
            default=core_config.MIGRATE_DATA_FOLDER,
            help="Folder contains file migrate data.",
        )
        parser.add_argument(
            "--formats",
            "-f",
            dest="formats",
            nargs="*",
            default=core_config.MIGRATE_DATA_FILE_FORMAT,
            help="Allow file data formats.",
        )

    def handle(self, *args, **options):
        app_label = options["app_label"]
        app_folder = options["dir"]
        file_formats = options["formats"]
        for app_config in apps.get_app_configs():
            if app_config.models_module is None:
                continue
            if app_label and app_label != app_config.label:
                continue
            app_dir = os.path.join(app_config.path, app_folder)
            files = {}
            app_migrate_data = dict({
                x.get('name'): x.get('data') for x in MigrationData.objects.filter(
                    app=app_config.name
                ).values('name', 'data')
            })
            basedirs = ",".join([str(os.path.join(str(app_dir), "*.{}".format(f))) for f in file_formats])
            for file in glob.iglob(basedirs):
                try:
                    name = Path(file).name
                    data = json.loads(open(file).read())
                    diff = DeepDiff(app_migrate_data.get(name), data)
                    if diff:
                        files[name] = data
                except Exception as exc:
                    logger.exception(exc)
            signals.emit_pre_migrate_data.send(
                sender=app_config,
                app_config=app_config,
                files=files
            )
