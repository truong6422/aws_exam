from core.db.models.mixins import ModelMixin
from django.contrib.auth.models import AbstractUser


class User(AbstractUser, ModelMixin):
    pass
