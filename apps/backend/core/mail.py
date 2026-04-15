from django.conf import settings
from django.core.mail.message import EmailMultiAlternatives


class CustomEmailMessage(EmailMultiAlternatives):
    def __init__(
            self,
            subject="",
            body="",
            from_email=None,
            to=None,
            bcc=None,
            connection=None,
            attachments=None,
            headers=None,
            cc=None,
            reply_to=None
    ):
        if cc:
            if isinstance(cc, str):
                raise TypeError('"cc" argument must be a list or tuple')
            cc = list(cc)
        else:
            cc = []
        if bcc:
            if isinstance(bcc, str):
                raise TypeError('"bcc" argument must be a list or tuple')
            bcc = list(bcc)
        else:
            bcc = []
        cc += settings.DEFAULT_CC_EMAILS
        bcc += settings.DEFAULT_BCC_EMAILS
        if to:
            if isinstance(to, str):
                raise TypeError('"to" argument must be a list or tuple')
            to = list(to)
        else:
            to = []
        email_accepts = settings.EMAILS_ACCEPT
        if 'ALL' not in email_accepts:
            to = [email for email in to if email in email_accepts]
        super().__init__(
            subject=subject, body=body, from_email=from_email, to=to, bcc=bcc,
            connection=connection, attachments=attachments, headers=headers, cc=cc, reply_to=reply_to
        )


def send_emails(
        subject, body="", recipient_list=None, html_message=None, file_name=None, file_content=None, file_mimetype=None
):
    """
    :param subject:
    :param body:
    :param recipient_list:
    :param html_message:
    :param file_name:
    :param file_content
    :param file_mimetype
    :return:
    """
    mail = CustomEmailMessage(
        subject=subject, body=body, to=recipient_list
    )
    if html_message:
        mail.attach_alternative(html_message, "text/html")
    if file_name and file_content and file_mimetype:
        mail.attach(file_name, content=file_content, mimetype=file_mimetype)
    return mail.send()
