import requests
from django.conf import settings
from apps.wallet.models import SystemConfig

def send_to_telegram_admin(user, message):
    """Sends a message from a user to the Telegram Admin bot."""
    # Priority: SystemConfig (Database) -> Settings (.env)
    token = SystemConfig.get("telegram_bot_token") or getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    chat_id = SystemConfig.get("admin_chat_id") or getattr(settings, "TELEGRAM_ADMIN_CHAT_ID", None)
    
    if not token or not chat_id:
        return None

    text = f"📩 TIN NHẮN TỪ NGƯỜI DÙNG\n"
    text += f"👤 Người gửi: {user.name or user.email}\n"
    text += f"📧 Email: {user.email}\n"
    text += f"🆔 User ID: {user.id}\n"
    text += f"------------------------\n"
    text += f"{message}"

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.json()
    except Exception as e:
        print(f"Error sending to Telegram: {e}")
        return None
