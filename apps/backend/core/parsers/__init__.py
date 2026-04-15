from django.http.multipartparser import MultiPartParserError
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from core import config
from core.parsers.nested_multipart_parser.drf import DrfNestedParser


class CoreJSONParser(JSONParser):
    def parse(self, stream, media_type=None, parser_context=None):
        auto_data_fields = config.REST_FRAMEWORK_AUTO_DATA_FIELDS
        try:
            parse_content = super().parse(stream=stream, media_type=media_type, parser_context=parser_context)
            if stream.method in ("POST", "PUT", "PATCH"):
                for field, field_kwargs in auto_data_fields.items():
                    if field_kwargs in parser_context.get('kwargs', {}):
                        parse_content.update({field: parser_context.get('kwargs', {}).get(field_kwargs)})
            return parse_content
        except ParseError as exc:
            raise ParseError(str(exc))


class CoreFormParser(FormParser):
    def parse(self, stream, media_type=None, parser_context=None):
        auto_data_fields = config.REST_FRAMEWORK_AUTO_DATA_FIELDS
        form_parser_content = super().parse(stream=stream, media_type=media_type, parser_context=parser_context)
        if stream.method in ("POST", "PUT", "PATCH"):
            for field, field_kwargs in auto_data_fields.items():
                if field_kwargs in parser_context.get('kwargs', {}):
                    form_parser_content._mutable = True
                    form_parser_content.update({field: parser_context.get('kwargs', {}).get(field_kwargs)})
                    form_parser_content._mutable = False
        return form_parser_content


class CoreMultiPartParser(MultiPartParser):
    def parse(self, stream, media_type=None, parser_context=None):
        auto_data_fields = config.REST_FRAMEWORK_AUTO_DATA_FIELDS
        try:
            multi_parser_content = super().parse(
                stream=stream, media_type=media_type, parser_context=parser_context
            )
            if stream.method in ("POST", "PUT", "PATCH"):
                for field, field_kwargs in auto_data_fields.items():
                    if field_kwargs in parser_context.get('kwargs', {}):
                        multi_parser_content.data._mutable = True
                        multi_parser_content.data.update(
                            {field: parser_context.get('kwargs', {}).get(field_kwargs)}
                        )
                        multi_parser_content.data._mutable = False
            return multi_parser_content
        except MultiPartParserError as exc:
            raise MultiPartParserError(exc)


class CoreDrfNestedParser(DrfNestedParser):
    def parse(self, stream, media_type=None, parser_context=None):
        auto_data_fields = config.REST_FRAMEWORK_AUTO_DATA_FIELDS
        try:
            drf_nested_parser = super().parse(stream=stream, media_type=media_type, parser_context=parser_context)
            if stream.method in ("POST", "PUT", "PATCH"):
                for field, field_kwargs in auto_data_fields.items():
                    if field_kwargs in parser_context.get('kwargs', {}):
                        for d in drf_nested_parser['data']:
                            d.update({field: parser_context.get('kwargs', {}).get(field_kwargs)})
            return drf_nested_parser.get('data')
        except ParseError as exc:
            raise ParseError(exc)
