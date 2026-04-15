import re


class SearchQuerySetWrapper(object):
    """
    Decorates a SearchQuerySet object using a generator for efficient iteration
    """

    def __init__(self, qs):
        self.qs = qs

    def count(self):
        return self.qs.count()

    def __iter__(self):
        for result in self.qs:
            if result:
                yield result.object

    def __getitem__(self, key):
        if isinstance(key, int) and (key >= 0 or key < self.count()):
            # return the object at the specified position
            return self.qs[key].object
        # Pass the slice/range on to the delegate
        return SearchQuerySetWrapper(self.qs[key])


class ElasticSearchModelSearchMixin(object):
    @staticmethod
    def clean(keyword):
        """
        Clean the input keyword to avoid some hassles with ElasticSearch filter
        For now, we just transform the keyword to lowercase
        """
        if keyword:
            keyword = keyword.lower().strip()
            return keyword

    @staticmethod
    def detect_use_wildcard(keyword):
        return len(re.findall(r"[\w']+", keyword)) <= 1


class ElasticSearchFilter(ElasticSearchModelSearchMixin):
    HIGHLIGHT_FIELD = None
    MAX_WEIGHT = 100
    MIN_WEIGHT_WORDS = [
        "a", "an", "and", "are", "as", "at", "be", "but", "by",
        "for", "if", "in", "into", "is", "it",
        "no", "not", "of", "on", "or", "such",
        "that", "the", "their", "then", "there", "these",
        "they", "this", "was", "will", "with"
    ]

    @staticmethod
    def build_fuzzy_filter(field, value) -> dict:
        return {
            "fuzzy": {
                field: {
                    "value": value,
                    "fuzziness": "AUTO",
                    "max_expansions": 50,
                    "prefix_length": 0,
                    "transpositions": True,
                    "rewrite": "constant_score"
                }
            }
        }

    @staticmethod
    def build_match_filter(field, value, operator='or') -> dict:
        return {
            "match": {
                field: {
                    "query": value,
                    "operator": operator,
                    "zero_terms_query": "all"
                }
            }
        }

    @staticmethod
    def build_should_term_filters(field, values, minimum_should_match=1) -> dict:
        should_filters = []
        for value in values:
            should_filters.append({"term": {field: value}})
        return {
            "should": should_filters,
            "minimum_should_match": minimum_should_match
        }

    @staticmethod
    def build_should_multi_match_filter(fields, value, search_type="best_fields"):
        return {
            "multi_match": {
                "type": search_type,
                "query": value,
                "fields": fields
            }
        }

    @staticmethod
    def build_wildcard_filter_field(field, value):
        return {
            "wildcard": {
                field: "*%s*" % value
            }
        }

    @classmethod
    def build_wildcard_filter_fields(cls, fields, value):
        should_wildcard = []
        for field in fields:
            should_wildcard.append(cls.build_wildcard_filter_field(field=field, value=value))
        return {
            "bool": {
                "should": should_wildcard,
                "minimum_should_match": 1
            }
        }

    @staticmethod
    def build_must_should_match_filters(field, values, minimum_should_match=1):
        if len(values):
            should_filters = []
            for value in values:
                should_filters.append({"match": {field: value}})
            return {
                "must": {
                    "bool": {
                        "should": should_filters,
                        "minimum_should_match": minimum_should_match
                    }
                }
            }
        return {}

    @classmethod
    def build_weight_function(cls, field, value) -> list:
        value_weight = [{
            "filter": {"match": {field: value}},
            "weight": cls.MAX_WEIGHT
        }]
        # split value
        split_value = value.split()
        for txt in split_value:
            if txt in cls.MIN_WEIGHT_WORDS or txt.isnumeric() or len(txt) == 1:
                value_weight.append({
                    "filter": {"match": {field: txt}},
                    "weight": cls.MAX_WEIGHT / len(split_value) * len(split_value) * len(split_value)
                })
            else:
                value_weight.append({
                    "filter": {"match": {field: txt}},
                    "weight": cls.MAX_WEIGHT / len(split_value) * len(split_value)
                })
        return value_weight

    @classmethod
    def get_highlights(cls, search=None, page_size=10, page_number=1) -> dict:
        if search is None:
            return {}
        if cls.HIGHLIGHT_FIELD is None:
            return {}
        highlights = {}
        start_index = int(page_size) * (int(page_number) - 1)
        end_index = int(page_size) * int(page_number)
        for r in search[start_index:end_index].highlight(cls.HIGHLIGHT_FIELD):
            try:
                search_field_highlight = list(r.meta.highlight[cls.HIGHLIGHT_FIELD])
                highlights[r.id] = search_field_highlight
            except AttributeError:
                pass
        return highlights
