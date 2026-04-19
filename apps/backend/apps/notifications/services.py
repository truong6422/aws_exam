from apps.accounts.models import User
from .models import Notification

def notify_user(user, title, message, notification_type="system", link=None):
    """Helper to create a notification for a user."""
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link
    )

def notify_admins(title, message, notification_type="system", link=None):
    """Helper to create a notification for all admin users."""
    admins = User.objects.filter(is_staff=True)
    for admin in admins:
        notify_user(admin, title, message, notification_type, link)
