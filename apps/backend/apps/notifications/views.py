from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from django.contrib.auth import get_user_model

from .models import Notification
from .serializers import NotificationSerializer, BroadcastNotificationSerializer


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        if pk:
            notification = generics.get_object_or_404(
                Notification, pk=pk, user=request.user
            )
            notification.is_read = True
            notification.save()
        else:
            Notification.objects.filter(user=request.user, is_read=False).update(
                is_read=True
            )
        return Response({"status": "ok"})


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})


class AdminBroadcastNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Only admins can send broadcast notifications"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BroadcastNotificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        User = get_user_model()

        queryset = User.objects.filter(is_active=True)

        if data["exclude_admin"]:
            queryset = queryset.filter(is_staff=False)

        if data["target_type"] == "active":
            queryset = queryset.annotate(
                attempt_count=Count("exam_attempts")
            ).filter(attempt_count__gt=0)
        elif data["target_type"] == "inactive":
            queryset = queryset.annotate(
                attempt_count=Count("exam_attempts")
            ).filter(attempt_count=0)
        elif data["target_type"] == "selected" and data["target_ids"]:
            queryset = queryset.filter(id__in=data["target_ids"])

        target_users = queryset.only("id")

        notifications_to_create = [
            Notification(
                user=user,
                title=data["title"],
                message=data["message"],
                notification_type=data["notification_type"],
                action_type=data["action_type"],
                link=data.get("link", ""),
                action_data=data.get("action_data", {}),
            )
            for user in target_users
        ]

        Notification.objects.bulk_create(notifications_to_create)

        return Response({
            "status": "ok",
            "sent_count": len(notifications_to_create),
            "message": f"Successfully sent to {len(notifications_to_create)} users"
        })


class AdminNotificationHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        if not self.request.user.is_staff:
            return Notification.objects.none()

        queryset = Notification.objects.all().order_by("-created_at")

        notification_type = self.request.query_params.get("notification_type")
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        target_type = self.request.query_params.get("target_type")
        if target_type == "active":
            queryset = queryset.annotate(
                attempt_count=Count("user__exam_attempts")
            ).filter(attempt_count__gt=0)
        elif target_type == "inactive":
            queryset = queryset.annotate(
                attempt_count=Count("user__exam_attempts")
            ).filter(attempt_count=0)

        return queryset
