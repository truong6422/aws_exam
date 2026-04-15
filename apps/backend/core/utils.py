import concurrent.futures
import logging
import re
from typing import Any, Callable

from core import config
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_ipv46_address
from django.template.base import Lexer

logger = logging.getLogger(__name__)


def detected_func_already_running(func, args=(), kwargs=None):
    try:
        from redis import Redis
        client_redis = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, password=settings.REDIS_PASSWORD)
        try:
            sentinel = client_redis.incr(func.__module__ + func.__name__ + str(args) + str(kwargs))
            if sentinel == 1:
                # Expire cached
                client_redis.expire(func.__module__ + func.__name__ + str(args) + str(kwargs), 1 * 24 * 60 * 60)
                return True
        except Exception as exc:
            logger.exception(exc)
    except ImportError as e:
        logger.exception("Error loading redis module: %s" % e)
    except Exception as exc:
        logger.exception(exc)
    return False


def is_valid_ip(ip_address):
    """ Check Validity of an IP address """
    if not ip_address:
        return False
    ip_address = ip_address.strip()
    try:
        validate_ipv46_address(ip_address)
        return True
    except ValidationError:
        return False


def get_ip_address_from_request(request):
    """ Makes the best attempt to get the client's real IP or return
        the loopback """
    remote_addr = request.META.get("REMOTE_ADDR", "")
    if remote_addr and is_valid_ip(remote_addr):
        return remote_addr.strip()
    return "127.0.0.1"


ipv4_with_port = re.compile(r"^(\d+\.\d+\.\d+\.\d+):\d+")
ipv6_with_port = re.compile(r"^\[([^\]]+)\]:\d+")


def strip_port_number(ip_address_string):
    """ strips port number from IPv4 or IPv6 address """
    ip_address = None

    if ipv4_with_port.match(ip_address_string):
        match = ipv4_with_port.match(ip_address_string)
        ip_address = match[1]
    elif ipv6_with_port.match(ip_address_string):
        match = ipv6_with_port.match(ip_address_string)
        ip_address = match[1]

    """
    If it's not a valid IP address, we prefer to return
    the string as-is instead of returning a potentially
    corrupted string:
    """
    if is_valid_ip(ip_address):
        return ip_address

    return ip_address_string


def get_ip(request):
    """ get the ip address from the request """
    if config.BEHIND_REVERSE_PROXY:
        ip_address = request.META.get(config.REVERSE_PROXY_HEADER, "")
        ip_address = ip_address.split(",", 1)[0].strip()

        if ip_address == "":
            ip_address = get_ip_address_from_request(request)
        else:
            """
            Some reverse proxies will include a port number with the
            IP address; as this port may change from request to request,
            and thus make it appear to be different IP addresses, we'll
            want to remove the port number, if present:
            """
            ip_address = strip_port_number(ip_address)
    else:
        ip_address = get_ip_address_from_request(request)

    return ip_address


def get_variable_in_template_content(content) -> list:
    """"""
    _variables = []
    lexer = Lexer(content)
    tokens = lexer.tokenize()
    tokens = list(tokens)
    for token in tokens:
        token_type = token.token_type.value
        if token_type == 1:  # TokenType.VAR
            _variables.append(token.contents)
    return _variables


def run_sync_in_thread(func: Callable, *args, **kwargs) -> Any:
    """
    Run a synchronous function in a dedicated thread.
    Use this to isolate Playwright or any sync code that might create an async context
    from the main Celery worker thread, ensuring Django ORM and result backend stay sync.
    """
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func, *args, **kwargs)
        return future.result()
