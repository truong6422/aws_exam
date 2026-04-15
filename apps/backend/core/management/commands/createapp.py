import os
import sys
from importlib import import_module

from django.core import exceptions
from django.core.management.base import CommandError
from django.core.management.templates import TemplateCommand
from django.utils.translation import gettext as _

import core


class NotRunningInTTYException(Exception):
    pass


class Command(TemplateCommand):
    help = (
        "Creates a Django app directory structure for the given app name in "
        "the current directory or optionally in the given directory."
    )
    stealth_options = ("stdin",)

    app_or_project = "app"

    def add_arguments(self, parser):
        return

    def handle(self, *args, **options):
        try:
            app_name = options.pop("app_name", None)
            while app_name is None:
                message = _('Please provide application name: ')
                app_name = input(message).strip()
                if app_name == "":
                    self.stderr.write(_("Application name cannot be blank."))
                    app_name = None
                    continue
                if not app_name.isidentifier():
                    self.stderr.write(
                        "'{name}' is not a valid application name. Please make sure the "
                        "application name is a valid identifier.".format(
                            name=app_name
                        )
                    )
                    app_name = None
                    continue
                try:
                    import_module(app_name)
                except ImportError:
                    pass
                else:
                    self.stderr.write(
                        "'{name}' conflicts with the name of an existing Python "
                        "module. Please try "
                        "another application name.".format(
                            name=app_name
                        )
                    )
                    app_name = None
                    continue

            model_name = options.pop("model_name", None)
            while model_name is None:
                message = 'Please provide model name: '
                model_name = input(message).strip()
                if model_name == "":
                    self.stderr.write(_("Model name cannot be blank."))
                    model_name = None
                    continue
                if not model_name.isidentifier():
                    self.stderr.write(
                        "'{name}' is not a valid model name. Please make sure the "
                        "model name is a valid identifier.".format(
                            name=model_name
                        )
                    )
                    model_name = None
                    continue
            target = options.pop("directory", None)
            options['extensions'] = ["py"]
            options['files'] = []
            options['template'] = os.path.join(core.__path__[0], 'conf', 'app_template')
            options['model_name'] = model_name.lower()
            options['camel_case_model_name'] = "".join(x for x in model_name.title() if x != "_")
            super().handle(self.app_or_project, app_name, target, **options)
            # Rename files
            app_dir = os.path.join(os.getcwd(), app_name)
            for root, dirs, files in os.walk(app_dir):
                for filename in files:
                    if filename.endswith((".pyo", ".pyc", ".py.class")):
                        # Ignore some files as they cause various breakages.
                        continue
                    file_rename = filename.format(**options)
                    if filename != file_rename:
                        os.rename(os.path.join(root, filename), os.path.join(root, file_rename))
        except KeyboardInterrupt:
            self.stderr.write("\nOperation cancelled.")
            sys.exit(1)
        except EOFError:
            self.stderr.write("\nNo data provided to input.")
            sys.exit(1)
        except exceptions.ValidationError as e:
            raise CommandError("; ".join(e.messages))
        except NotRunningInTTYException:
            self.stdout.write(_(
                "Creation app skipped due to not running in a TTY. "
                "You can run `manage.py createapp` in your project "
                "to create one manually."
            ))
