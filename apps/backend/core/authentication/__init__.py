from django.core.exceptions import ImproperlyConfigured
from django.db.models import signals
from functools import partial
from requests.auth import AuthBase

try:
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from rest_framework_simplejwt.exceptions import InvalidToken
    from rest_framework_simplejwt.settings import api_settings
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework_simplejwt module: %s" % e)

from core.constants import Error
from django.utils import timezone


class BearerAuth(AuthBase):
    """Bearer authentication in header"""

    def __init__(self, authorization):
        self.authorization = authorization

    def __call__(self, request):
        request.headers['authorization'] = self.authorization
        return request


class ApiJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        user, validated_token = super().authenticate(request=request)
        if user and user.id:
            self.enforce_who_did(request, user)
        return user, validated_token

    def enforce_who_did(self, request, user):
        """Checking the user against the current request"""
        if request.method in ('POST',):
            mark_who_did = partial(self.mark_who_did_created, user)
            signals.pre_save.connect(
                mark_who_did,
                dispatch_uid=(self.__class__, request, 'pre',),
                weak=False
            )
        if request.method in ('PUT', 'PATCH'):
            mark_who_did = partial(self.mark_who_did_updated, user)
            signals.pre_save.connect(
                mark_who_did,
                dispatch_uid=(self.__class__, request, 'pre',),
                weak=False
            )
        if request.method in ('DELETE',):
            mark_who_deleted = partial(self.mark_who_deleted, user)
            signals.pre_delete.connect(
                mark_who_deleted,
                dispatch_uid=(self.__class__, request, 'pre',),
                weak=False
            )

    @staticmethod
    def mark_who_did_created(user, sender, instance, **kwargs):
        """Add created_by by given user"""
        if user and user.id and instance and not instance.pk and hasattr(instance, 'created_by'):
            instance.created_by = user.id

    @staticmethod
    def mark_who_did_updated(user, sender, instance, **kwargs):
        """Update updated_by by given user"""
        if instance and instance.pk:
            if user and user.id and hasattr(instance, 'updated_by'):
                instance.updated_by = user.id
            if hasattr(instance, 'updated_at'):
                instance.updated_at = timezone.now()

    @staticmethod
    def mark_who_deleted(user, sender, instance, **kwargs):
        """Update deleted_by by given user"""
        if user and user.id and instance and instance.pk and hasattr(instance, 'deleted_by'):
            instance.deleted_by = user.id


class ApiJWTStatelessUserAuthentication(ApiJWTAuthentication):
    """Middleware for authenticating users and tracking the method of user requests"""

    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken(Error.NO_MATCH_TOKEN.value)
        return api_settings.TOKEN_USER_CLASS(validated_token)
