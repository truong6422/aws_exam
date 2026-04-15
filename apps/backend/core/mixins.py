import io

from deepdiff import DeepDiff
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.http import FileResponse, QueryDict

try:
    from rest_framework import viewsets, status, mixins
    from rest_framework.response import Response
except ImportError as exc:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % exc)


class APIMixin(viewsets.GenericViewSet):
    obj_permission_classes = []
    plus_permission_classes = []
    serializer_context = {}

    _instance = None

    def _list(self, queryset, pagination_class=None):
        if pagination_class:
            self.__setattr__('pagination_class', pagination_class)
        queryset = self.filter_queryset(queryset)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_serializer_context(self, **kwargs):
        """ Extra context provided to the serializer class. """
        serializer_context = super().get_serializer_context()
        serializer_context['current_user'] = self.request.user
        for context_key, context_value in kwargs.items():
            serializer_context[context_key] = context_value
        return serializer_context

    def get_serializer(self, *args, **kwargs):
        """
        Return the serializer instance that should be used for validating and
        deserializing input, and for serializing output.
        """
        serializer_class = self.get_serializer_class()
        kwargs['context'] = self.get_serializer_context(**self.serializer_context)
        return serializer_class(*args, **kwargs)

    def get_permissions(self):
        """
        Allows plus permission_classes
        """
        if hasattr(self, 'plus_permission_classes') and self.plus_permission_classes:
            return [permission() for permission in self.permission_classes + self.plus_permission_classes]
        return super().get_permissions()

    def get_object_permissions(self):
        return [permission() for permission in self.obj_permission_classes]

    def check_object_permissions(self, request, obj):
        """
        Check if the request should be permitted for a given object.
        Raises an appropriate exception if the request is not permitted.
        """
        for permission in self.get_object_permissions():
            if not permission.has_object_permission(request, self, obj):
                self.permission_denied(
                    request,
                    message=getattr(permission, 'message', None),
                    code=getattr(permission, 'code', None)
                )

    def get_object(self, cached=False):
        if cached:
            if self._instance is None:
                self._instance = super().get_object()
            return self._instance
        return super().get_object()


class UpdateRequestDataMixin:

    @staticmethod
    def _update_data(request, data):
        if isinstance(request.data, QueryDict):
            request.data._mutable = True
            request.data.update(data)
            request.data._mutable = False
        else:
            request.data.update(data)


class CreateModelMixin(UpdateRequestDataMixin, mixins.CreateModelMixin):
    """
    Create a model instance.
    """

    def _response_create(self, instance, headers):
        self.__setattr__('action', 'response_create')
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def create(self, request, *_, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            instance = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return self._response_create(instance=instance, headers=headers)

    def perform_create(self, serializer):
        return serializer.save()


class BulkCreateModelMixin(CreateModelMixin):
    """
    Bulk Create a model instance.
    """

    def _response_bulk_create(self, instance):
        self.__setattr__('action', 'response_create')
        serializer = self.get_serializer(instance, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def create(self, request, *_, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            instance = self.perform_create(serializer)
        return self._response_bulk_create(instance=instance)


class UpdateModelMixin(UpdateRequestDataMixin, mixins.UpdateModelMixin):
    """
    Update a model instance.
    """

    def _response_update(self, instance):
        self.__setattr__('action', 'response_update')
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *_, **kwargs):
        diff = kwargs.pop('diff', False)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        if diff is False:
            old_serializer = self.get_serializer(instance)
            new_serializer = self.get_serializer(serializer.validated_data)
            diff = DeepDiff(old_serializer.data, new_serializer.data)
        if diff:
            with transaction.atomic():
                instance = self.perform_update(serializer)
            if getattr(instance, '_prefetched_objects_cache', None):
                # If 'prefetch_related' has been applied to a queryset, we need to
                # forcibly invalidate the prefetch cache on the instance.
                instance._prefetched_objects_cache = {}
        return self._response_update(instance=instance)

    def perform_update(self, serializer):
        return serializer.save()


class ExportCSVMixin:
    def _export_csv(self, _, *__, **kwargs):
        """
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        try:
            import pandas as pd
        except ImportError as exc:
            raise ImproperlyConfigured("Error loading pandas module: %s" % exc)
        file_name = kwargs.get('file_name', 'export_csv.csv')
        columns_mapping = kwargs.get('columns_mapping')
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        df = pd.DataFrame(serializer.data, columns=list(dict(serializer.child.fields).keys()))
        if columns_mapping:
            df.rename(columns=columns_mapping, inplace=True)
        response = FileResponse(
            df.to_csv(encoding="shift_jis", index=False),
            as_attachment=True
        )
        response['Content-Disposition'] = 'attachment; filename={}'.format(file_name)
        response['Content-Type'] = 'text/csv'
        response['x-filename'] = file_name
        return response


class ExportExcelMixin:
    def _export_excel(self, _, *__, **kwargs):
        """
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        try:
            import pandas as pd
        except ImportError as exc:
            raise ImproperlyConfigured("Error loading pandas module: %s" % exc)
        file_name = kwargs.get('file_name', 'export_excel.xlsx')
        columns_mapping = kwargs.get('columns_mapping')
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        df = pd.DataFrame(serializer.data, columns=list(dict(serializer.child.fields).keys()))
        if columns_mapping:
            df.rename(columns=columns_mapping, inplace=True)
        output = io.BytesIO()
        writer = pd.ExcelWriter(output, engine='xlsxwriter')
        df.to_excel(writer, index=False)
        writer.save()
        output.seek(0)
        return FileResponse(
            output,
            as_attachment=True,
            filename=file_name,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
