from rest_framework.filters import BaseFilterBackend

from core import config


class AutoFilterBackend(BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        auto_filter_fields = config.REST_FRAMEWORK_AUTO_FILTER_FIELDS
        if auto_filter_fields:
            if isinstance(auto_filter_fields, str):
                auto_filter_fields = auto_filter_fields.split(',')
            for field_filter in auto_filter_fields:
                if field_filter in view.kwargs.keys() and view.kwargs[field_filter]:
                    queryset = queryset.filter(**{field_filter: view.kwargs[field_filter]})
        return queryset
