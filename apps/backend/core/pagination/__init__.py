from core import config as core_config
from core.pagination.page_number import CustomPageNumberPagination


class SmallPageNumberPagination(CustomPageNumberPagination):
    page_size = 5
    page_query_param = core_config.PAGE_QUERY_PARAM
    max_page_size = core_config.MAX_PAGE_SIZE


class StandardPageNumberPagination(CustomPageNumberPagination):
    page_size = 10
    page_query_param = core_config.PAGE_QUERY_PARAM
    max_page_size = core_config.MAX_PAGE_SIZE


class LargePageNumberPagination(CustomPageNumberPagination):
    page_size = 15
    page_query_param = core_config.PAGE_QUERY_PARAM
    max_page_size = core_config.MAX_PAGE_SIZE
