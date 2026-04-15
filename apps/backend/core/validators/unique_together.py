from django.core.exceptions import ImproperlyConfigured

try:
    from rest_framework import exceptions, validators
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)

from core import constants


class CustomUniqueTogetherValidator(validators.UniqueTogetherValidator):
    """
        Validator that corresponds to `unique_together = (...)` on a model class.
        Should be applied to the serializer class, not to an individual field.
    """

    def __init__(self, queryset, fields):
        super().__init__(queryset, fields)
        self.queryset = queryset
        self.fields = fields
        self.serializer_field = None

    def __call__(self, attrs, serializer):
        self.enforce_required_fields(attrs, serializer)
        queryset = self.queryset
        queryset = self.filter_queryset(attrs, queryset, serializer)
        queryset = self.exclude_current_instance(attrs, queryset, serializer.instance)

        # Ignore validation if any field is None
        checked_values = [
            value for field, value in attrs.items() if field in self.fields
        ]
        if None not in checked_values and validators.qs_exists(queryset):
            field_names = ', '.join(self.fields)
            message = self.message.format(field_names=field_names)
            field = ''.join(self.fields[0].split('_'))
            raise exceptions.ValidationError({field: message}, code=constants.ERR_UNIQUE_FIELD)
