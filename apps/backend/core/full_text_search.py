from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.core.exceptions import ImproperlyConfigured
from django.db.models import IntegerField, Value

try:
    from rest_framework.filters import BaseFilterBackend
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)


class FullTextSearchFilterBackEnd(BaseFilterBackend):
    def get_keywords(self, request, view):
        full_text_search_param = getattr(view, 'full_text_search_param', 'keywords')
        return request.query_params.getlist(full_text_search_param, [])

    def filter_queryset(self, request, queryset, view):
        search_fields = getattr(view, 'full_text_search_fields', None)
        if not search_fields:
            return queryset.annotate(rank=Value(0, output_field=IntegerField()))
        keywords = self.get_keywords(request=request, view=view)

        search_vector = None
        for field_name, field_weight in search_fields.items():
            if search_vector is None:
                search_vector = SearchVector(field_name, weight=field_weight)
            else:
                search_vector += SearchVector(field_name, weight=field_weight)
        search_query = None
        for keyword in keywords:
            keyword = keyword.replace('\x00', '')  # strip null characters
            if keyword:
                if search_query is None:
                    search_query = SearchQuery(keyword.strip(), search_type='phrase')
                else:
                    search_query |= SearchQuery(keyword.strip(), search_type='phrase')
        if search_query:
            return queryset.annotate(
                search=search_vector, rank=SearchRank(search_vector, search_query)
            ).filter(search=search_query)
        return queryset.annotate(rank=Value(0, output_field=IntegerField()))


class FullTextSearchFilterWithPostBackEnd(FullTextSearchFilterBackEnd):
    def get_keywords(self, request, view):
        full_text_search_param = getattr(view, 'full_text_search_param', 'keywords')
        keywords = request.data.get(full_text_search_param, [])
        if isinstance(keywords, str):
            keywords = [keywords]
        return keywords
