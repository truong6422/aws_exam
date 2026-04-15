from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

try:
    from playwright.sync_api import sync_playwright
except ImportError as e:
    raise ImproperlyConfigured("Error loading playwright module: %s" % e)


class ChromiumPlayWright:
    def __init__(self, **kwargs):
        """"""
        load_image_disabled = kwargs.get('load_image_disabled', False)
        proxy_options = {}
        if hasattr(settings, 'PLAYWRIGHT_PROXY_OPTIONS'):
            proxy_options = settings.PLAYWRIGHT_PROXY_OPTIONS
        chrome_args = kwargs.get('chrome_args', [
            '--enable-features=Vulkan,UseSkiaRenderer',
            '--use-vulkan=swiftshader',
            '--enable-unsafe-webgpu',
            '--disable-vulkan-fallback-to-gl-for-testing',
            '--dignore-gpu-blocklist',
            '--use-angle=vulkan'
        ])
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=kwargs.get('headless', True),
            args=chrome_args,
            **proxy_options
        )
        # Initial new page
        self.page = self.browser.new_page()
        # Blocking loading images
        if load_image_disabled:
            self.page.route(
                "**/*", lambda route: route.abort() if route.request.resource_type == "image" else route.continue_()
            )
        # Set default timeout
        self.page.set_default_timeout(3000)

    def get_page(self):
        return self.page

    def close_browser(self):
        self.browser.close()

    def quit(self):
        self.browser.close()
        self.playwright.stop()
