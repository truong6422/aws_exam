from enum import Enum

from django.utils.translation import gettext as _

ERR_BAD_REQUEST = 'ERR_BAD_REQUEST'
ERR_NOT_AUTHENTICATED = 'not_authenticated'
ERR_PERMISSION_DENIED = 'permission_denied'
ERR_NOT_BLANK = 'blank'
ERR_INVALID_TYPE = 'ERR_INVALID_TYPE'
ERR_RESOURCE_MAX_SIZE = 'ERR_RESOURCE_MAX_SIZE'
ERR_RESOURCE_NOT_FOUND = 'not_found'
ERR_UNIQUE_FIELD = 'ERR_UNIQUE_FIELD'
ERR_METHOD_NOT_ALLOWED = 'method_not_allowed'

ERROR_MESSAGES = {
    ERR_BAD_REQUEST: _('Bad request.'),
    ERR_INVALID_TYPE: _('Invalid Type.'),
    ERR_NOT_BLANK: _('This field is not blank.'),
    ERR_NOT_AUTHENTICATED: _('Authenticated False.'),
    ERR_RESOURCE_MAX_SIZE: _('Resource max size.'),
    ERR_UNIQUE_FIELD: _('Item already exists.'),
    ERR_RESOURCE_NOT_FOUND: _('Resource not found.'),
    ERR_PERMISSION_DENIED: _('Permission denied.'),
    ERR_METHOD_NOT_ALLOWED: _('Method not allowed.'),
}

ERROR_CODES = {
    ERR_BAD_REQUEST: _(ERR_BAD_REQUEST),
    ERR_INVALID_TYPE: _(ERR_INVALID_TYPE),
    ERR_NOT_BLANK: _("ERR_NOT_BLANK"),
    ERR_NOT_AUTHENTICATED: _("ERR_NOT_AUTHENTICATED"),
    ERR_RESOURCE_MAX_SIZE: _(ERR_RESOURCE_MAX_SIZE),
    ERR_UNIQUE_FIELD: _(ERR_UNIQUE_FIELD),
    ERR_RESOURCE_NOT_FOUND: _("ERR_RESOURCE_NOT_FOUND"),
    ERR_PERMISSION_DENIED: _("ERR_PERMISSION_DENIED"),
    ERR_METHOD_NOT_ALLOWED: _("ERR_METHOD_NOT_ALLOWED"),
}

FIELDS = {}


class Error(Enum):
    """Error class"""
    INVALID_TOKEN = _('Token is invalid.')
    NO_MATCH_TOKEN = _('Token contained no match user identification')
