from django.shortcuts import render
from django.views.decorators.cache import cache_page
from rest_framework import status


def home(request):
    context = {}
    return render(request, 'index.html', context=context)


@cache_page(60 * 15)
def handler_403_view(request, exception):
    return render(request, 'handler_errors/403.html', status=status.HTTP_403_FORBIDDEN)


@cache_page(60 * 15)
def handler_404_view(request, exception):
    return render(request, 'handler_errors/404.html', status=status.HTTP_404_NOT_FOUND)


@cache_page(60 * 15)
def handler_500_view(request):
    return render(request, 'handler_errors/500.html', status=status.HTTP_500_INTERNAL_SERVER_ERROR)
