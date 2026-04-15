from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


class DjangoViewFilterBackend(DjangoFilterBackend):
    def get_filterset_kwargs(self, request, queryset, view):
        return {
            "data": request.GET,
            "queryset": queryset,
            "request": request,
        }


class DjangoViewSearchFilter(SearchFilter):
    search_param = 'search'

    def get_search_terms(self, request):
        """
        Search terms are set by a ?search=... query parameter,
        and may be comma and/or whitespace delimited.
        """
        params = request.GET.get(self.search_param, '')
        params = params.replace('\x00', '')  # strip null characters
        params = params.replace(',', ' ')
        return params.split()


class DjangoViewOrderingFilter(OrderingFilter):
    def get_ordering(self, request, queryset, view):
        """
        Ordering is set by a comma-delimited ?ordering=... query parameter.

        The `ordering` query parameter can be overridden by setting
        the `ordering_param` value on the OrderingFilter or by
        specifying an `ORDERING_PARAM` value in the API settings.
        """
        if params := request.GET.get(self.ordering_param):
            fields = [param.strip() for param in params.split(',')]
            if ordering := self.remove_invalid_fields(
                    queryset, fields, view, request
            ):
                return ordering

        # No ordering was included, or all the ordering fields were invalid
        return self.get_default_ordering(view)
