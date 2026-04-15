import inspect
import uuid
from collections import OrderedDict
from enum import Enum, EnumMeta

from django.core.exceptions import ImproperlyConfigured
from django.db import transaction

try:
    from rest_framework import serializers
    from rest_framework.fields import empty
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)


def get_enum_serializer(enum):
    class EnumSerializer(serializers.Serializer):
        def get_fields(self):
            enum_items = {}
            if isinstance(enum, dict):
                enum_items = enum.items()
            elif isinstance(enum, (Enum, EnumMeta)) and inspect.ismethod(enum.choices):
                enum_items = dict(enum.choices()).items()
            enum_fields = []
            for field, value in enum_items:
                if isinstance(value, int):
                    enum_fields.append((str(field), serializers.IntegerField(read_only=True, default=value)))
                elif isinstance(value, float):
                    enum_fields.append((str(field), serializers.FloatField(read_only=True, default=value)))
                elif isinstance(value, dict):
                    enum_fields.append((str(field), get_enum_serializer(enum=value)(read_only=True)))
                elif isinstance(value, list):
                    enum_fields.append((str(field), get_enum_serializer(enum=value[0])(read_only=True, many=True)))
                else:
                    enum_fields.append((str(field), serializers.CharField(read_only=True, default=value)))
            return OrderedDict(enum_fields)

    return type(str("%sEnumSerializer" % uuid.uuid4()), (EnumSerializer,), {})


class FilterListSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        if hasattr(self.child.Meta, 'filter_data') and self.child.Meta.filter_data:
            data = data.filter(**self.child.Meta.filter_data)
        if hasattr(self.child.Meta, 'filter_backends'):
            for backend in list(self.child.Meta.filter_backends):
                data = backend().filter_queryset(self.context.get('request'), data, self.child.Meta)
        return super().to_representation(data)


class UpdateListSerializer(serializers.ListSerializer):
    def update(self, instances, validated_data):
        validated_data_hash = {attrs.get('id').id: attrs for attrs in validated_data}
        result = []
        with transaction.atomic():
            for instance in instances:
                attrs = validated_data_hash.get(instance.id)
                attrs.pop('id', None)
                for attr, value in attrs.items():
                    if getattr(instance, attr) != value:
                        result.append(self.child.update(instance, attrs))
                        break
        return result
