import logging

from django.conf import settings
from django.db import connection
from django.urls import resolve

logger = logging.getLogger(__name__)


class QueryCountDebugMiddleware:
    """Debug query count - use for DEBUG only.
    This middleware will log the number of queries run
    and the total time taken for each request (with a
    status code of 200). It does not currently support
    multi-db setups.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        current_url = resolve(request.path_info).url_name
        current_url = current_url + "  -----  " if current_url else ""
        response = self.get_response(request)
        total_time = 0
        logger.warning("=========>  " + current_url + request.path_info)
        if settings.LOG_QUERY_COUNT:
            for query in connection.queries:
                query_time = query.get('time')
                logger.warning(str(query))
                if query_time is None:
                    query_time = query.get('duration', 0) / 1000
                total_time += float(query_time)
            logger.warning(f'{str(len(connection.queries))} queries run, total {str(total_time)} seconds')
        return response
