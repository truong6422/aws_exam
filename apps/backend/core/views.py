from django.views.generic import (
    ListView, DetailView as DJDetailView, CreateView as DJCreateView,
    UpdateView as DJUpdateView, DeleteView as DJDeleteView
)

from core import config


class ExtendContextDataMixin:
    @staticmethod
    def get_extend_context(**kwargs):
        return {**kwargs}

    def get_context_data(self, **kwargs):
        context_data = super().get_context_data(**kwargs)
        context_data.update(self.get_extend_context())
        return context_data


class StandPaginatorListView(ExtendContextDataMixin, ListView):
    paginate_by = config.VIEW_PAGE_SIZE
    filterset_class = None
    filter_backends = ()
    serializer_class = None

    def filter_queryset(self, queryset):
        """
        Given a queryset, filter it with whichever filter backend is in use.

        You are unlikely to want to override this method, although you may need
        to call it either from a list view, or from a custom `get_object`
        method if you want to apply the configured filtering backend to the
        default queryset.
        """
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def paginate_queryset(self, queryset, page_size):
        paginator, page, queryset, is_paginated = super().paginate_queryset(
            queryset, page_size
        )
        page.adjusted_elided_pages = paginator.get_elided_page_range(page.number)
        return paginator, page, queryset, is_paginated

    def get_context_data(self, **kwargs):
        context_data = super().get_context_data(**kwargs)
        if self.serializer_class:
            object_list = context_data.get('object_list')
            context_data['serializer_object_list'] = self.serializer_class(object_list, many=True).data
        return context_data


class CreateView(ExtendContextDataMixin, DJCreateView):
    pass


class DetailView(ExtendContextDataMixin, DJDetailView):
    fields = None
    serializer_class = None

    def get_extend_context(self, **kwargs):
        return {
            'fields': self.fields
        }

    def get_context_data(self, **kwargs):
        context_data = super().get_context_data(**kwargs)
        if self.serializer_class:
            object = context_data.get('object')
            context_data['serializer_object'] = self.serializer_class(object).data
        return context_data


class UpdateView(ExtendContextDataMixin, DJUpdateView):
    pass


class DeleteView(ExtendContextDataMixin, DJDeleteView):
    pass
