from typing import Optional

from django.core.exceptions import ImproperlyConfigured

try:
    from drf_spectacular.openapi import AutoSchema, build_serializer_context
    from drf_spectacular.utils import _SerializerType
except ImportError as e:
    raise ImproperlyConfigured("Error loading django_filters module: %s" % e)
from core.mixins import CreateModelMixin, UpdateModelMixin


class CoreAutoSchema(AutoSchema):
    def get_response_serializers(self) -> Optional[_SerializerType]:
        view = self.view
        old_action = None
        if hasattr(view, 'action'):
            old_action = self.view.action
            if isinstance(view, CreateModelMixin) and view.action == 'create':
                self.view.action = 'response_create'
            if isinstance(view, UpdateModelMixin) and view.action == 'update':
                self.view.action = 'response_update'
        response_serializers = super().get_response_serializers()
        if old_action:
            self.view.action = old_action
        return response_serializers
