from django.conf import settings

from django.core.exceptions import ImproperlyConfigured

try:
    from selenium.webdriver.chrome.service import Service
except ImportError as e:
    raise ImproperlyConfigured("Error loading selenium module: %s" % e)
try:
    from seleniumwire import webdriver
except ImportError as e:
    raise ImproperlyConfigured("Error loading selenium-wire module: %s" % e)


class ChromeBaseCrawler:
    def __init__(self, chrome_options=None, disabled_javascript=False, blocked_urls=None):
        if chrome_options is None:
            chrome_options = webdriver.ChromeOptions()
            chrome_options.add_argument("start-maximized")
            chrome_options.add_argument("disable-infobars")
            # chrome_options.add_argument("enable-automation")
            if hasattr(settings, 'IS_ENABLE_HEADLESS') and settings.IS_ENABLE_HEADLESS:
                chrome_options.add_argument("--headless=chrome")
                chrome_options.add_argument('--no-sandbox')
                chrome_options.add_argument("--incognito")
            chrome_options.add_argument("--disable-features=VizDisplayCompositor")
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--log-level=3")
            chrome_options.add_argument('--blink-settings=imagesEnabled=false')
            chrome_options.add_argument("--dns-prefetch-disable")
            if disabled_javascript:
                chrome_prefs = {
                    "webkit.webprefs.javascript_enabled": False,
                    "profile.content_settings.exceptions.javascript.*.setting": 2,
                    "profile.default_content_setting_values.javascript": 2,
                    "profile.managed_default_content_settings.javascript": 2
                }
                chrome_options.add_experimental_option("prefs", chrome_prefs)
                chrome_options.add_argument("--disable-javascript")
        service_args = ['--verbose']
        service = Service(
            executable_path=settings.EXECUTABLE_PATH_CHROME_DRIVE,
            service_args=service_args
        )
        proxy_options = {}
        if hasattr(settings, 'SELENIUMWIRE_PROXY_OPTIONS'):
            proxy_options = settings.SELENIUMWIRE_PROXY_OPTIONS
        self.driver = webdriver.Chrome(
            service=service,
            chrome_options=chrome_options,
            seleniumwire_options={
                'request_storage': 'memory',  # Store requests and responses in memory only
                **proxy_options
            }
        )
        if blocked_urls:
            self.driver.execute_cdp_cmd('Network.enable', {})
            self.driver.execute_cdp_cmd(
                'Network.setBlockedURLs', {
                    "urls": blocked_urls
                }
            )

    def get_driver(self):
        return self.driver

    def close_driver(self):
        driver = self.driver
        driver.close()

    def quit_driver(self):
        self.driver.close()
        self.driver.quit()
