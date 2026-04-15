from django.db import models


class QueryManagerMixin:

    def __init__(self, *args, **kwargs):
        if args:
            self._q = args[0]
        else:
            self._q = models.Q(**kwargs)
        self._order_by = None
        super().__init__()

    def order_by(self, *args):
        self._order_by = args
        return self

    def get_queryset(self):
        qs = super().get_queryset().filter(self._q)
        if self._order_by is not None:
            return qs.order_by(*self._order_by)
        return qs


class QueryManager(QueryManagerMixin, models.Manager):
    pass
