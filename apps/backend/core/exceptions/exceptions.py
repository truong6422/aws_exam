from django.core.exceptions import ImproperlyConfigured

try:
    from rest_framework import status, exceptions
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)

from django.utils.translation import gettext as _

from core import constants


class ValidationError(exceptions.APIException):
    """Validation Error Exception"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = _('Bad Request')
    default_code = 'ERR_BAD_REQUEST'

    def __init__(self, detail=None, code=None):
        super().__init__(detail, code)
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        self.detail = exceptions._get_error_details(detail, code)


class CustomValidationError(exceptions.APIException):
    """Custom Validation Error Exception"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = _('Invalid input.')
    default_code = constants.ERR_RESOURCE_NOT_FOUND

    def __init__(self, detail=None, code=None):
        super().__init__(detail, code)
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        self.detail = exceptions._get_error_details(detail, code)


class NotAuthenticated(exceptions.APIException):
    """Not Authenticated Exception"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = _('Authentication credentials were not provided.')
    default_code = constants.ERR_NOT_AUTHENTICATED

    def __init__(self, detail=None, code=None):
        super().__init__(detail, code)
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        self.detail = exceptions._get_error_details(detail, code)
