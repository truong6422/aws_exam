from django.core.exceptions import ImproperlyConfigured

try:
    from rest_framework.exceptions import ValidationError
except ImportError as e:
    raise ImproperlyConfigured("Error loading rest_framework module: %s" % e)


def set_element_value(page, xpath, value):
    """
    :param page:
    :param xpath:
    :param value:
    :return:
    """
    if not xpath:
        return
    try:
        element = page.locator(xpath)
    except Exception:
        raise ValidationError('{} is not a valid'.format(xpath))
    # Check tag name of element
    set_element_value_by_element(element=element, value=value)


def set_element_value_by_element(element, value):
    tag_name = element.evaluate('e => e.tagName').lower()
    if tag_name == 'input':
        # Check type of input
        input_type = element.get_attribute('type').lower()
        if input_type == 'checkbox':
            if element.is_checked() != value:
                if value:
                    element.check(force=True)
                else:
                    element.uncheck(force=True)
        elif input_type == 'radio':
            if element.is_checked() != value:
                element.click()
        elif input_type == 'text':
            element.fill(str(value))
        else:
            element.fill(value)
    elif tag_name == 'textarea':
        element.fill(value)
    elif tag_name == 'select':
        element.select_option(str(value))


def get_element_value(page, xpath):
    """
        :param page:
        :param xpath:
        :param value:
        :return:
        """
    if not xpath:
        return
    try:
        element = page.locator(xpath)
    except Exception:
        raise ValidationError('{} is not a valid'.format(xpath))
    # Check tag name of element
    return get_element_value_by_element(element=element)


def get_element_value_by_element(element):
    tag_name = element.evaluate('e => e.tagName').lower()
    if tag_name == 'input':
        # Check type of input
        input_type = element.get_attribute('type').lower()
        if input_type == 'checkbox':
            return element.is_checked()
        elif input_type == 'radio':
            return element.is_checked()
    return element.input_value()
