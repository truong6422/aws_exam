import re

from django.db import transaction
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.notifications.services import notify_user
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from .services import send_to_telegram_admin


class ChatMessageListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        return ChatMessage.objects.filter(user=self.request.user)


class ChatSendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message_text = request.data.get("message")
        if not message_text:
            return Response({"detail": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Save to DB
        msg = ChatMessage.objects.create(
            user=request.user,
            sender_type="user",
            message=message_text
        )

        # Send to Telegram
        send_to_telegram_admin(request.user, message_text)

        # Notify Admin on Website
        from apps.notifications.services import notify_admins
        notify_admins(
            title=f"Tin nhắn mới từ {request.user.name or request.user.email}",
            message=message_text[:100],
            notification_type="chat",
            link="/admin/chat"
        )

        return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class ChatWebhookView(APIView):
    permission_classes = [AllowAny]  # Telegram sends webhooks

    def post(self, request):
        data = request.data
        
        # Verify it's a message reply from Admin
        if "message" in data and "reply_to_message" in data["message"]:
            msg = data["message"]
            reply_to = msg["reply_to_message"]
            text = msg.get("text", "")
            
            # Extract User ID from the replied-to message text
            # Expecting format: "🆔 User ID: 123"
            match = re.search(r"User ID: (\d+)", reply_to.get("text", ""))
            if match:
                user_id = int(match.group(1))
                try:
                    user = User.objects.get(id=user_id)
                    
                    # Save Admin reply
                    with transaction.atomic():
                        chat_msg = ChatMessage.objects.create(
                            user=user,
                            sender_type="admin",
                            message=text,
                            telegram_message_id=msg.get("message_id")
                        )
                        
                        # Notification
                        notify_user(
                            user=user,
                            title="Admin đã phản hồi 💬",
                            message=text[:100] + ("..." if len(text) > 100 else ""),
                            notification_type="chat",
                            link="/chat"
                        )
                    
                    return Response({"status": "delivered"})
                except User.DoesNotExist:
                    pass

        return Response({"status": "ignored"})

class AdminChatSessionListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Max
        # Get all users who have messages, sorted by latest message
        users = ChatMessage.objects.values('user_id').annotate(
            latest_message=Max('created_at')
        ).order_by('-latest_message')
        
        results = []
        for entry in users:
            user = User.objects.get(id=entry['user_id'])
            last_msg = ChatMessage.objects.filter(user=user).latest('created_at')
            results.append({
                "id": user.id,
                "name": user.name or user.email,
                "email": user.email,
                "last_message": last_msg.message,
                "last_message_time": last_msg.created_at,
                "unread_count": ChatMessage.objects.filter(user=user, sender_type='user', is_read=False).count()
            })
        return Response(results)


class AdminChatMessageListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if not user_id:
            return ChatMessage.objects.none()
        
        # Mark as read when admin views
        ChatMessage.objects.filter(user_id=user_id, sender_type='user', is_read=False).update(is_read=True)
        return ChatMessage.objects.filter(user_id=user_id).order_by('created_at')


class AdminChatSendMessageView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user_id = request.data.get("user_id")
        message_text = request.data.get("message")
        
        if not user_id or not message_text:
            return Response({"detail": "User ID and message are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            msg = ChatMessage.objects.create(
                user=user,
                sender_type="admin",
                message=message_text
            )
            
            # Notify user
            notify_user(
                user=user,
                title="Admin đã phản hồi 💬",
                message=message_text[:100],
                notification_type="chat",
                link="/chat"
            )
            
            return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
