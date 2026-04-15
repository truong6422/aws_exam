import math

from django.core.exceptions import ImproperlyConfigured

try:
    from rest_framework import pagination, response
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)


class CustomLimitOffsetPagination(pagination.LimitOffsetPagination):
    """
        A limit/offset based style. For example:

        http://api.example.org/accounts/?limit=100
        http://api.example.org/accounts/?offset=400&limit=100
    """
    default_limit = 10
    max_limit = 50

    def get_paginated_response(self, data):
        """
            Make paginated response.
        """
        total_page = math.ceil(self.count / self.limit)
        return response.Response({
            'links': {
                'prev': self.get_previous_link(),
                'next': self.get_next_link(),
                'count': int(self.count),
                'total_pages': total_page,
            },
            'data': data
        })
