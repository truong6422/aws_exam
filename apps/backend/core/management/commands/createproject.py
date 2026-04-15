import os
import sys

import core
from django.core import exceptions
from django.core.checks.security.base import SECRET_KEY_INSECURE_PREFIX
from django.core.management.base import CommandError
from django.core.management.templates import TemplateCommand
from django.core.management.utils import get_random_secret_key


class NotRunningInTTYException(Exception):
    pass


class Command(TemplateCommand):
    help = (
        "Creates a Django project directory structure for the given project "
        "name in the current directory or optionally in the given directory."
    )
    stealth_options = ("stdin",)

    def add_arguments(self, parser):
        return

    def handle(self, **options):
        try:
            project_name = options.pop("project_name", None)
            while project_name is None:
                message = 'Please provide project name: '
                project_name = input(message).strip()
                if project_name == "":
                    self.stderr.write("Project name cannot be blank.")
                    project_name = None
                    continue
                if not project_name.isidentifier():
                    self.stderr.write(
                        "'{name}' is not a valid project name. Please make sure the "
                        "project name is a valid identifier.".format(
                            name=project_name
                        )
                    )
                    project_name = None
                    continue
            options['extensions'] = ["py"]
            options['files'] = [
                "Dockerfile",
                "pytest.ini",
                ".bumpversion.cfg",
                "start.sh"
            ]
            options['template'] = os.path.join(core.__path__[0], 'conf', 'project_template')
            # Create a random SECRET_KEY to put it in the main settings.
            options["secret_key"] = SECRET_KEY_INSECURE_PREFIX + get_random_secret_key()

            super().handle("project", project_name, os.getcwd(), **options)
            os.rename(os.path.join(os.getcwd(), '.gitignore-tpl'), os.path.join(os.getcwd(), '.gitignore'))
            os.rename(
                os.path.join(os.getcwd(), project_name, 'celery.py'),
                os.path.join(os.getcwd(), project_name, 'celery.py.tmp')
            )
        except KeyboardInterrupt:
            self.stderr.write("\nOperation cancelled.")
            sys.exit(1)
        except EOFError:
            self.stderr.write("\nNo data provided to input.")
            sys.exit(1)
        except exceptions.ValidationError as e:
            raise CommandError("; ".join(e.messages))
        except NotRunningInTTYException:
            self.stdout.write(
                "Creation project skipped due to not running in a TTY. "
                "You can run `manage.py createproject` in your project "
                "to create one manually."
            )
