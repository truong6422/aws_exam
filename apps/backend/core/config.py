from django.conf import settings


def get_setting(variable, default=None):
    """ get the 'variable' from settings if not there use the
    provided default """
    return getattr(settings, variable, default)


BEHIND_REVERSE_PROXY = get_setting("BEHIND_REVERSE_PROXY", False)

# ip address using this HTTP header value
REVERSE_PROXY_HEADER = get_setting(
    "REVERSE_PROXY_HEADER", "HTTP_X_FORWARDED_FOR"
)

# Migrate data
MIGRATE_DATA_FOLDER = get_setting("MIGRATE_DATA_FOLDER", "fixtures")

MIGRATE_DATA_FILE_FORMAT = get_setting("MIGRATE_DATA_FILE_FORMAT", ["json"])

SENDER_MIGRATE_DATA = get_setting(
    "SENDER_MIGRATE_DATA", "core.migrations.data"
)

# API rest framework settings
REST_FRAMEWORK_AUTO_FILTER_FIELDS = get_setting("REST_FRAMEWORK_AUTO_FILTER_FIELDS")
REST_FRAMEWORK_AUTO_DATA_FIELDS = get_setting("REST_FRAMEWORK_AUTO_DATA_FIELDS", {})

# Pagination
PAGE_QUERY_PARAM = get_setting("PAGE_QUERY_PARAM", "page")
PAGE_SIZE_QUERY_PARAM = get_setting("PAGE_SIZE_QUERY_PARAM", "page_size")
MAX_PAGE_SIZE = get_setting("MAX_PAGE_SIZE", 100)

CURSOR_PAGINATION_ORDERING = get_setting("CURSOR_PAGINATION_ORDERING", '-created_at')

# Default view PAGE_SIZE
VIEW_PAGE_SIZE = get_setting("VIEW_PAGE_SIZE", 10)
SIZE_MAP_ITEMS = get_setting("SIZE_MAP_ITEMS", 10)
