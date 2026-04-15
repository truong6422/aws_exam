from django.core.exceptions import ImproperlyConfigured

from core import config as core_config

try:
    from rest_framework import pagination, response, settings
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)


class CustomPageNumberPagination(pagination.PageNumberPagination):
    """
        A simple page number based style that supports page numbers as
        query parameters. For example:

        http://api.example.org/accounts/?page=4
        http://api.example.org/accounts/?page=4&page_size=100
    """
    page_size = settings.api_settings.PAGE_SIZE
    page_size_query_param = core_config.PAGE_SIZE_QUERY_PARAM

    def get_paginated_response(self, data):
        """
            Make paginated response.
        """
        return response.Response({
            'links': {
                'prev': self.get_previous_link(),
                'next': self.get_next_link(),
                'current_page': int(self.page.number),
                'total_pages': int(self.page.paginator.num_pages),
                'count': int(self.page.paginator.count),
            },
            'data': data
        })
