from django.contrib import sitemaps
from django.urls import reverse
from core import config as core_config


class StaticViewSitemap(sitemaps.Sitemap):
    priority = 0.5
    changefreq = 'daily'

    def items(self):
        return core_config.SIZE_MAP_ITEMS

    def location(self, item):
        return reverse(item)
