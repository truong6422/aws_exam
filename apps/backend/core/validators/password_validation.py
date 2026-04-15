import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class PasswordRulesValidator:
    """
    Validate that the password is of a minimum / maximum length.
    """
    PASSWORD_RULES = {
        'Be between 8 and 20 chars': (lambda pw: 8 <= len(pw) <= 20),
        'Use positive look ahead to see if at least one lower case letter exists': (
            lambda pw: re.match(r"(?=.*[a-z])", pw)
        ),
        'Use positive look ahead to see if at least one upper case letter exists': (
            lambda pw: re.match(r"(?=.*[A-Z])", pw)
        ),
        'Use positive look ahead to see if at least one digit exists': (lambda pw: re.match(r"(?=.*\d)", pw)),
        'Reject the strings having spaces in them.': (lambda pw: re.match(r"^[^ ]+$", pw))
    }

    def validate(self, password, user=None):
        if [rule for rule, check in self.PASSWORD_RULES.items() if not check(password)]:
            raise ValidationError(
                [_("8桁～20桁の半角英数字で設定してください。　数字、大文字、小文字を少なくとも１つずつ含む必要があります。")]
            )

    @staticmethod
    def get_help_text():
        return _("Your password must pass rules.")
