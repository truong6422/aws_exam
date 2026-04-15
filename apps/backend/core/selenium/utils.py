import logging

from django.core.exceptions import ImproperlyConfigured

try:
    from selenium.common.exceptions import StaleElementReferenceException
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.select import Select
    from selenium.webdriver.support.ui import WebDriverWait
except ImportError as e:
    raise ImproperlyConfigured("Error loading selenium module: %s" % e)

logger = logging.getLogger(__name__)


def scroll_shim(driver, element, retry=0, max_retry=3):
    try:
        x = element.location['x']
        y = element.location['y']
        scroll_by_coord = 'window.scrollTo(%s,%s);' % (
            x,
            y
        )
        scroll_nav_out_of_way = 'window.scrollBy(0, -120);'
        driver.execute_script(scroll_by_coord)
        driver.execute_script(scroll_nav_out_of_way)
    except StaleElementReferenceException as exc:
        logger.exception(exc)
        if retry > max_retry:
            raise exc
        retry += 1
        scroll_shim(driver, element, retry, max_retry)


def actions_click(actions, element, retry=0, max_retry=3):
    try:
        actions.move_to_element(element).click().perform()
    except StaleElementReferenceException as exc:
        logger.exception(exc)
        retry += 1
        if retry > max_retry:
            raise exc
        actions_click(actions, element, retry, max_retry)


def wait_until_presence_of_element_located(driver, element, retry=0, max_retry=3):
    try:
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, element))
        )
    except Exception as exc:
        logger.exception(exc)
        if retry > max_retry:
            raise exc
        retry += 1
        wait_until_presence_of_element_located(driver, element, retry, max_retry)


def wait_until_presence_of_all_elements_located(driver, element, retry=0, max_retry=3):
    try:
        WebDriverWait(driver, 5).until(EC.presence_of_all_elements_located((By.XPATH, element)))
    except Exception as exc:
        logger.exception(exc)
        if retry > max_retry:
            raise exc
        retry += 1
        wait_until_presence_of_all_elements_located(driver, element, retry, max_retry)


def wait_until_visibility_of_element_located(driver, element, retry=0, max_retry=3):
    try:
        WebDriverWait(driver, 5).until(EC.visibility_of_element_located((By.XPATH, element)))
    except Exception as exc:
        logger.exception(exc)
        if retry > max_retry:
            raise exc
        retry += 1
        wait_until_visibility_of_element_located(driver, element, retry, max_retry)


def wait_until_element_to_be_clickable(driver, element, retry=0, max_retry=3):
    try:
        WebDriverWait(driver, 5).until(EC.element_to_be_clickable((By.XPATH, element)))
    except Exception as exc:
        logger.exception(exc)
        if retry > max_retry:
            raise exc
        retry += 1
        wait_until_element_to_be_clickable(driver, element, retry, max_retry)


def set_element_value(driver, element_xpath, value) -> None:
    """
    :param driver:
    :param element_xpath: Only support select, textarea, input: checkbox, radio
    :param value:
    :return:
    """
    if not element_xpath:
        return
    element = driver.find_element(by=By.XPATH, value=element_xpath)
    # Check tag name of element
    tag_name = element.tag_name
    if tag_name == 'input':
        # Check type of input
        actions = ActionChains(driver)
        scroll_shim(driver=driver, element=element)
        input_type = element.get_attribute('type')
        if input_type in ['checkbox', 'radio']:
            # Detect checkbox is checked and value
            if input_type == 'checkbox' and element.is_selected() == value:
                return
            actions_click(actions=actions, element=element)
        else:
            element.clear()
            element.send_keys(value)
    elif tag_name == 'textarea':
        element.clear()
        element.send_keys(value)
    elif tag_name == 'select':
        select = Select(element)
        select.select_by_value(str(value))


def set_element_value(driver, element_xpath, value) -> None:
    """
    :param driver:
    :param element_xpath: Only support select, textarea, input: checkbox, radio
    :param value:
    :return:
    """
    if not element_xpath:
        return
    element = driver.find_element(by=By.XPATH, value=element_xpath)
    # Check tag name of element
    tag_name = element.tag_name
    if tag_name == 'input':
        # Check type of input
        actions = ActionChains(driver)
        scroll_shim(driver=driver, element=element)
        input_type = element.get_attribute('type')
        if input_type in ['checkbox', 'radio']:
            # Detect checkbox is checked and value
            if input_type == 'checkbox' and element.is_selected() == value:
                return
            actions_click(actions=actions, element=element)
        else:
            element.clear()
            element.send_keys(value)
    elif tag_name == 'textarea':
        element.clear()
        element.send_keys(value)
    elif tag_name == 'select':
        select = Select(element)
        select.select_by_value(str(value))


def get_element_value(driver, element_xpath):
    if not element_xpath:
        return
    element = driver.find_element(by=By.XPATH, value=element_xpath)
    # Check tag name of element
    tag_name = element.tag_name
    if tag_name == 'input':
        # Check type of input
        scroll_shim(driver=driver, element=element)
        input_type = element.get_attribute('type')
        if input_type in ['checkbox', 'radio']:
            return element.is_selected()
        return element.get_attribute('value')
    elif tag_name == 'select':
        select = Select(element)
        return select.first_selected_option.get_attribute("value")
    return element.get_attribute('value')
