from django.core.exceptions import ImproperlyConfigured
from django.db import models, transaction
from django.db.models import signals
from django.utils import timezone
from django.utils.translation import gettext as _

from core.db.models.fields import StatusField, MonitorField
from core.db.models.managers import QueryManager


def _field_exists(model_class, field_name):
    return field_name in [f.attname for f in model_class._meta.local_fields]


# Soft delete manager
class SoftDeleteManager(models.Manager):
    """Manager for soft deleting"""

    def get_queryset(self):
        """return a queryset that contains only not deleted objects"""
        return super().get_queryset().filter(is_deleted=False)


class OrderModelManager(SoftDeleteManager):
    def _filter_queryset(self, obj, qs):
        return qs.filter(**{f: getattr(obj, f) for f in getattr(self.model, 'ORDER_FIELD_FILTER', [])})

    def create(self, **kwargs):
        instance = self.model(**kwargs)
        with transaction.atomic():
            # Get our current max order number
            results = self._filter_queryset(obj=instance, qs=self).aggregate(
                models.Max('order')
            )
            # Increment and use it for our new object
            current_order = results['order__max']
            if current_order is None:
                current_order = 0
            value = current_order + 1
            instance.order = value
            instance.save()
            return instance

    def move(self, obj, new_order):
        """ Move an object to a new order position """
        qs = self.get_queryset()
        with transaction.atomic():
            if obj.order > int(new_order):
                self._filter_queryset(obj=obj, qs=qs).filter(
                    order__lt=obj.order,
                    order__gte=new_order
                ).exclude(
                    pk=obj.pk
                ).update(
                    order=models.F('order') + 1,
                )
            else:
                self._filter_queryset(obj=obj, qs=qs).filter(
                    order__lte=new_order,
                    order__gt=obj.order
                ).exclude(
                    pk=obj.pk,
                ).update(
                    order=models.F('order') - 1,
                )
            obj.order = new_order
            obj.save()


class ModelMixin(models.Model):
    """Mixin for base models"""
    created_by = models.BigIntegerField(null=True, blank=True)
    updated_by = models.BigIntegerField(null=True, blank=True)
    deleted_by = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True, default=None)
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)
    is_deleted = models.BooleanField(default=False)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        """Abstract meta class for ModelMixin"""
        abstract = True

    def delete(self, using=None, soft=True, *args, **kwargs):
        """
        Make a soft delete is default.
        If you want to delete forever, change soft to False.
        """
        if soft:
            signals.pre_delete.send(sender=self._meta.model, instance=self, using=using)
            self._meta.model.objects.filter(pk=self.pk).update(
                deleted_at=timezone.now(),
                is_deleted=True,
            )
            signals.post_delete.send(sender=self._meta.model, instance=self, using=using)
        else:
            return super().delete(using=using, *args, **kwargs)

    def restore(self):
        """Restore soft deleted object"""
        self._meta.model.all_objects.filter(pk=self.pk).update(
            deleted_at=None,
            is_deleted=False,
        )


class StatusModel(models.Model):
    """
    An abstract base class model with a ``status`` field that
    automatically uses a ``STATUS`` class attribute of choices, a
    ``status_changed`` date-time field that records when ``status``
    was last modified, and an automatically-added manager for each
    status that returns objects with that status only.

    """
    status = StatusField(_('status'))
    status_changed = MonitorField(_('status changed'), monitor='status')

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """
        Overriding the save method in order to make sure that
        status_changed field is updated even if it is not given as
        a parameter to the update field argument.
        """
        update_fields = kwargs.get('update_fields', None)
        if update_fields and 'status' in update_fields:
            kwargs['update_fields'] = set(update_fields).union({'status_changed'})

        super().save(*args, **kwargs)


class OrderModel(ModelMixin):
    ORDER_FIELD_FILTER = []

    order = models.IntegerField(verbose_name=_('Order'), default=0)
    objects = OrderModelManager()

    class Meta:
        """Abstract meta class for ModelMixin"""
        abstract = True

    def delete(self, using=None, soft=True, *args, **kwargs):
        self._meta.model.objects.filter(
            **{f: getattr(self, f) for f in getattr(self._meta.model, 'ORDER_FIELD_FILTER', [])}
        ).filter(
            order__gt=self.order
        ).update(
            order=models.F('order') - 1,
        )
        return super().delete(using=using, soft=soft, *args, **kwargs)


def add_status_query_managers(sender, **kwargs):
    """
    Add a Querymanager for each status item dynamically.

    """
    if not issubclass(sender, StatusModel):
        return

    default_manager = sender._meta.default_manager

    for value, display in getattr(sender, 'STATUS', ()):
        if _field_exists(sender, value):
            raise ImproperlyConfigured(
                "StatusModel: Model '%s' has a field named '%s' which "
                "conflicts with a status of the same name."
                % (sender.__name__, value)
            )
        sender.add_to_class(value, QueryManager(status=value))

    sender._meta.default_manager_name = default_manager.name


models.signals.class_prepared.connect(add_status_query_managers)
