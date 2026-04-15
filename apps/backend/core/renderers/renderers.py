from django.core.exceptions import ImproperlyConfigured

try:
    from rest_framework import status, renderers
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)


class EmberJSONRenderer(renderers.JSONRenderer):
    """
        Renderer which serializes to JSON.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data and 'error' in data and data['error']:
            data = {
                'status': data['status'],
                'data': data['body'],
                'errors': data['error']
            }
        elif data and 'links' in data and data['links']:
            data = {
                'status': status.HTTP_200_OK,
                'data': data['data'],
                'errors': None,
                'links': data['links']
            }
        else:
            data = {
                'status': status.HTTP_200_OK,
                'data': data,
                'errors': None
            }
        return super(EmberJSONRenderer, self).render(data, accepted_media_type, renderer_context)
