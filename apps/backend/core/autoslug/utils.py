import logging

from django.utils.text import slugify as django_slugify
from unidecode import unidecode

from core.googletrans import Translator

logger = logging.getLogger(__name__)


def slugify(value):
    try:
        translator = Translator()
        value = translator.translate(value).text
    except Exception as exc:
        logger.exception(exc)
    return django_slugify(unidecode(value))


def template_variable_slugify(value):
    value = slugify(value)
    return value.replace("-", "_")
