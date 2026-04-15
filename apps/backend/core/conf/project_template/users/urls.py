from django.urls import path

from users import views as home_views

app_name = 'public'

urlpatterns = [
    path('', home_views.home, name='home'),
]
