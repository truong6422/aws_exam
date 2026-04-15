from django.conf import settings
from django.core.management import ManagementUtility


def execute_from_command_line(argv=None):
    """Run a ManagementUtility."""
    settings.configure(INSTALLED_APPS=['core'])
    utility = ManagementUtility(argv)
    utility.execute()
