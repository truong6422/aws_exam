from django.core.exceptions import ImproperlyConfigured

try:
    import django_filters
except ImportError as e:
    raise ImproperlyConfigured("Error loading django_filters module: %s" % e)
from django import forms
from django.core.exceptions import ValidationError


class DjangoFilterPostBackend(django_filters.rest_framework.DjangoFilterBackend):
    def get_filterset_kwargs(self, request, queryset, view):
        return {
            "data": request.data,
            "queryset": queryset,
            "request": request,
        }


class CommaSeparatedStringsField(forms.CharField):
    def to_python(self, value):
        value = super().to_python(value)
        if value and isinstance(value, str):
            value = value.split(',')
        return value


class CommaSeparatedStringsFilter(django_filters.Filter):
    field_class = CommaSeparatedStringsField

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('distinct', True)
        kwargs.setdefault('lookup_expr', 'in')
        super().__init__(*args, **kwargs)


class ListFieldForm(forms.MultipleChoiceField):
    def valid_value(self, value):
        return True

    def to_python(self, value):
        if not value:
            return []
        elif not isinstance(value, (list, tuple)):
            raise ValidationError(self.error_messages['invalid_list'], code='invalid_list')
        return [str(val) for val in value if val]


class ListFieldFilters(django_filters.Filter):
    field_class = ListFieldForm

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('distinct', True)
        kwargs.setdefault('lookup_expr', 'in')
        super().__init__(*args, **kwargs)


class NotInListFieldFilters(django_filters.Filter):
    field_class = ListFieldForm

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('distinct', True)
        kwargs.setdefault('lookup_expr', 'in')
        kwargs.setdefault('exclude', True)
        super().__init__(*args, **kwargs)
