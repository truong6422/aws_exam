from datetime import datetime

from django.core.exceptions import ImproperlyConfigured
from django.http import Http404

try:
    from rest_framework import exceptions, views
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)

from core import constants


def custom_exception_handler(exc, context):
    """
        Override drf default validation error message response and sends as a list
        @param exc:
        @param context:
        @return: response obj
    """
    response = views.exception_handler(exc, context)
    if response is not None:
        if isinstance(exc, Http404):
            fields = None
            error_data = response.data['detail']
            code, message = error_data.code, response.status_text
            system_code, message = _get_error_details(code, message, None)
            error_code = system_code
            error_trace = exc.args[0]
        else:
            details = exc.get_full_details()
            error_trace = exc.detail
            if isinstance(exc, exceptions.ValidationError):
                fields = _get_fields_error(details)
                message = fields[0]['message']
                system_code = exc.status_code
                error_code = fields[0]['apiErrorCode']
            else:
                fields = None
                code = details['code']
                system_code, message = _get_error_details(code, None, None)
                error_code = system_code

        response.data = {
            'status': "ERROR",
            'body': None,
            'error': {
                'systemCode': system_code,
                'messageCode': error_code,
                'message': message,
                'trace': error_trace,
                'timestamp': datetime.now(),
                'fields': fields
            }
        }

    return response


def _get_error_details(code, message, field_name):
    try:
        err_code = constants.ERROR_CODES[code]
        err_msg = constants.ERROR_MESSAGES[code]

        if field_name in constants.FIELDS:
            code = constants.FIELDS[field_name]
            return code, constants.ERROR_MESSAGES[code]
        return err_code, err_msg
    except Exception as _:  # noqa
        return code, message


def _get_error(field_name, filed_code, message):
    e_code, e_msg = _get_error_details(filed_code, message, field_name)
    error = {
        'field': field_name,
        'rejectedValue': message,
        'apiErrorCode': e_code,
        'message': e_msg
    }
    return error


def _get_fields_error(full_details):
    fields = []
    for field, details in full_details.items():
        if isinstance(details, dict):
            field_name = field
            message = details['message']
            code = details['code']
            error = _get_error(field_name, code, message)
            fields.append(error)
        else:
            for detail in details:
                try:
                    field_name = field if field != 'non_field_errors' else 'name'
                    message = detail['message']
                    code = detail['code']
                    error = _get_error(field_name, code, message)
                    fields.append(error)
                except Exception as _: # noqa
                    error = _get_fields_error(detail)
                    fields.extend(error)
    return fields
