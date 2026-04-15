from django.core import paginator as django_paginator
from django.core.exceptions import ImproperlyConfigured

try:
    from django_elasticsearch_dsl.search import Search
except ImportError as e:
    raise ImproperlyConfigured("Error loading django_elasticsearch_dsl module: %s" % e)
try:
    from rest_framework.pagination import PageNumberPagination
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)


class ElasticSearchPage(django_paginator.Page):
    def __init__(self, object_list, number, paginator):
        if isinstance(object_list, Search):
            object_list = object_list.to_queryset()
        super().__init__(object_list, number, paginator)


class ElasticSearchPaginator(django_paginator.Paginator):
    def _get_page(self, *args, **kwargs):
        """Get page.

        Returns an instance of a single page.

        This hook can be used by subclasses to use an alternative to the
        standard :cls:`Page` object.
        """
        return ElasticSearchPage(*args, **kwargs)


class ElasticSearchDefaultResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_query_param = 'page'
    max_page_size = 1000
    django_paginator_class = ElasticSearchPaginator
