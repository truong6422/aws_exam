from django.urls import path
from .views import (
    ChatMessageListView, ChatSendMessageView, ChatWebhookView,
    AdminChatSessionListView, AdminChatMessageListView, AdminChatSendMessageView
)

app_name = "chat"

urlpatterns = [
    path("messages/", ChatMessageListView.as_view(), name="message-list"),
    path("send/", ChatSendMessageView.as_view(), name="message-send"),
    path("webhook/", ChatWebhookView.as_view(), name="webhook"),
    
    # Admin endpoints
    path("admin/sessions/", AdminChatSessionListView.as_view(), name="admin-session-list"),
    path("admin/messages/", AdminChatMessageListView.as_view(), name="admin-message-list"),
    path("admin/send/", AdminChatSendMessageView.as_view(), name="admin-send"),
]
