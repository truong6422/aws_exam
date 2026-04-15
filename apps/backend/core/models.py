from django.db import models
from django.db.models.indexes import Index
from django.utils.timezone import now
from django.utils.translation import gettext as _


class MigrationData(models.Model):
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    data = models.JSONField(verbose_name=_("Data Migration"), default=dict)
    applied = models.DateTimeField(default=now)

    class Meta:
        ordering = ("-id",)
        verbose_name = _('Data Migration')
        verbose_name_plural = _('Data Migrations')
        indexes = [Index(fields=['-id', ])]
        permissions = ()
        default_permissions = ()
        db_table = "django_data_migrations"

    def __str__(self):
        return "Migration data %s for %s" % (self.name, self.app)
