import random
import string

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CreditTransaction, SystemConfig, TopUpRequest, Wallet
from .serializers import (
    AdminTopUpRequestSerializer,
    CreditTransactionSerializer,
    TopUpRequestCreateSerializer,
    TopUpRequestSerializer,
)


def _generate_transaction_code():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "TXN-" + "".join(random.choices(chars, k=8))
        if not TopUpRequest.objects.filter(transaction_code=code).exists():
            return code


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        # Limit transactions to last 50 for performance
        txns = wallet.transactions.order_by("-created_at")[:50]
        return Response(
            {
                "balance": wallet.balance,
                "transactions": CreditTransactionSerializer(txns, many=True).data,
            }
        )


class TopUpRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TopUpRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount_credits = serializer.validated_data["amount_credits"]

        vnd_per_credit = int(SystemConfig.get("vnd_per_credit", "1000"))
        amount_vnd = amount_credits * vnd_per_credit
        transaction_code = _generate_transaction_code()
        telegram_username = SystemConfig.get("telegram_username", "")

        telegram_template = (
            f"Xin chào! Tôi muốn nạp xu:\n"
            f"- Mã GD: {transaction_code}\n"
            f"- Số xu: {amount_credits}\n"
            f"- Số tiền: {amount_vnd:,} cá"
        )

        topup = TopUpRequest.objects.create(
            user=request.user,
            amount_credits=amount_credits,
            amount_vnd=amount_vnd,
            transaction_code=transaction_code,
        )

        # Notify Admins
        from apps.notifications.services import notify_admins
        notify_admins(
            title="Yêu cầu nạp xu mới 💰",
            message=f"Người dùng {request.user.email} vừa tạo yêu cầu nạp {amount_credits} xu. Mã: {transaction_code}",
            notification_type="wallet",
            link="/admin/wallet"
        )

        zalo_phone = SystemConfig.get("zalo_phone", "")

        return Response(
            {
                "id": topup.id,
                "transaction_code": transaction_code,
                "amount_credits": amount_credits,
                "amount_vnd": amount_vnd,
                "status": topup.status,
                "telegram_template": telegram_template,
                "admin_telegram_url": f"https://t.me/{telegram_username.replace('@', '')}" if telegram_username else "",
                "admin_zalo_url": f"https://zalo.me/{zalo_phone}" if zalo_phone else "",
                "admin_zalo_phone": zalo_phone,
            },
            status=status.HTTP_201_CREATED,
        )


class TopUpRequestListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TopUpRequestSerializer

    def get_queryset(self):
        return TopUpRequest.objects.filter(user=self.request.user)


class AdminTopUpRequestListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminTopUpRequestSerializer

    def get_queryset(self):
        qs = TopUpRequest.objects.select_related("user", "approved_by").all().order_by("-created_at")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        search = self.request.query_params.get("search")
        if search:
            from django.db import models
            qs = qs.filter(
                models.Q(transaction_code__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search)
            )
        return qs


class AdminTopUpSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Count
        counts = TopUpRequest.objects.values("status").annotate(count=Count("id"))
        data = {item["status"]: item["count"] for item in counts}
        data["total"] = sum(data.values())
        return Response(data)


class AdminTopUpApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        with transaction.atomic():
            try:
                topup = TopUpRequest.objects.select_for_update().get(pk=pk)
            except TopUpRequest.DoesNotExist:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

            if topup.status != TopUpRequest.STATUS_PENDING:
                return Response(
                    {"detail": "Already processed."}, status=status.HTTP_400_BAD_REQUEST
                )

            wallet, _ = Wallet.objects.get_or_create(user=topup.user)
            wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)

            wallet.balance += topup.amount_credits
            wallet.save(update_fields=["balance", "updated_at"])

            CreditTransaction.objects.create(
                wallet=wallet,
                delta=topup.amount_credits,
                type=CreditTransaction.TYPE_TOPUP,
                ref_id=topup.transaction_code,
                note=f"Top-up approved by {request.user.email}",
            )

            topup.status = TopUpRequest.STATUS_APPROVED
            topup.admin_note = request.data.get("admin_note", "")
            topup.approved_by = request.user
            topup.approved_at = timezone.now()
            topup.save(
                update_fields=["status", "admin_note", "approved_by", "approved_at"]
            )

            # Notification
            from apps.notifications.services import notify_user
            notify_user(
                user=topup.user,
                title="Nạp xu thành công ✅",
                message=f"Yêu cầu nạp {topup.amount_credits} xu của bạn đã được duyệt. Số dư của bạn đã được cập nhật.",
                notification_type="wallet"
            )

        return Response(
            {"id": topup.id, "status": topup.status, "balance_after": wallet.balance}
        )


class AdminTopUpRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            topup = TopUpRequest.objects.get(pk=pk)
        except TopUpRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if topup.status != TopUpRequest.STATUS_PENDING:
            return Response(
                {"detail": "Already processed."}, status=status.HTTP_400_BAD_REQUEST
            )
        topup.status = TopUpRequest.STATUS_REJECTED
        topup.admin_note = request.data.get("admin_note", "")
        topup.save(update_fields=["status", "admin_note"])

        # Notification
        from apps.notifications.services import notify_user
        notify_user(
            user=topup.user,
            title="Yêu cầu nạp xu bị từ chối ❌",
            message=f"Yêu cầu nạp {topup.amount_credits} xu của bạn không được duyệt. Lý do: {topup.admin_note or 'Không có lý do cụ thể.'}",
            notification_type="wallet"
        )
        return Response({"id": topup.id, "status": topup.status})


class AdminSystemConfigView(APIView):
    permission_classes = [IsAdminUser]
    ALLOWED_KEYS = ["vnd_per_credit", "telegram_username", "zalo_phone", "bank_account_info", "telegram_bot_token", "admin_chat_id"]

    def get(self, request):
        result = {}
        for key in self.ALLOWED_KEYS:
            result[key] = SystemConfig.get(key, "")
        return Response(result)

    def post(self, request):
        for key in self.ALLOWED_KEYS:
            if key in request.data:
                SystemConfig.objects.update_or_create(
                    key=key, defaults={"value": str(request.data[key])}
                )
        return self.get(request)
