from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Min
from django.contrib.auth import get_user_model
import uuid

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

        # Generate broadcast_id for this batch of notifications
        batch_broadcast_id = uuid.uuid4()

        notifications_to_create = [
            Notification(
                user=user,
                title=data["title"],
                message=data["message"],
                notification_type=data["notification_type"],
                action_type=data["action_type"],
                link=data.get("link", ""),
                action_data=data.get("action_data", {}),
                broadcast_id=batch_broadcast_id,
            )
            for user in target_users
        ]

        Notification.objects.bulk_create(notifications_to_create)

        return Response({
            "status": "ok",
            "sent_count": len(notifications_to_create),
            "message": f"Successfully sent to {len(notifications_to_create)} users",
            "broadcast_id": str(batch_broadcast_id),
        })


class AdminNotificationHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def list(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({"error": "Admin only"}, status=status.HTTP_403_FORBIDDEN)

        # Get distinct broadcasts with count
        queryset = Notification.objects.filter(
            broadcast_id__isnull=False
        ).values(
            'broadcast_id', 'title', 'message', 'notification_type',
            'action_type'
        ).annotate(
            recipient_count=Count('id'),
            created_at=Min('created_at'),
        ).order_by('-created_at')

        notification_type = request.query_params.get("notification_type")
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        # Manual pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        start = (page - 1) * page_size
        end = start + page_size

        total_count = queryset.count()
        paginated = list(queryset[start:end])

        return Response({
            "data": [{
                "id": item['broadcast_id'],
                "title": item['title'],
                "message": item['message'],
                "notification_type": item['notification_type'],
                "action_type": item['action_type'],
                "recipient_count": item['recipient_count'],
                "created_at": item['created_at'].isoformat(),
            } for item in paginated],
            "links": {
                "total_pages": (total_count + page_size - 1) // page_size,
                "count": total_count,
            }
        })
