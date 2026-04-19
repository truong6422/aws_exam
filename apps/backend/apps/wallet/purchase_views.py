from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.questions.models import ExamSet, UserExamUnlock
from apps.wallet.models import CreditTransaction, Wallet


class ExamSetPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            exam_set = ExamSet.objects.get(pk=pk)
        except ExamSet.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Hard lock check first
        if exam_set.is_locked:
            return Response({"detail": "Exam set is locked by admin."}, status=status.HTTP_403_FORBIDDEN)

        # Free check
        if exam_set.price_credits == 0:
            return Response({"detail": "This exam set is free."}, status=status.HTTP_400_BAD_REQUEST)

        # Already purchased?
        if UserExamUnlock.objects.filter(user=request.user, exam_set=exam_set).exists():
            return Response({"detail": "Already purchased."}, status=status.HTTP_409_CONFLICT)

        with transaction.atomic():
            # Step 1: Ensure wallet exists
            Wallet.objects.get_or_create(user=request.user)
            # Step 2: Lock it for update
            wallet = Wallet.objects.select_for_update().get(user=request.user)

            if wallet.balance < exam_set.price_credits:
                return Response({"detail": "Insufficient credits."}, status=status.HTTP_402_PAYMENT_REQUIRED)

            wallet.balance -= exam_set.price_credits
            wallet.save(update_fields=["balance", "updated_at"])

            unlock = UserExamUnlock.objects.create(
                user=request.user,
                exam_set=exam_set,
                credits_spent=exam_set.price_credits,
            )

            CreditTransaction.objects.create(
                wallet=wallet,
                delta=-exam_set.price_credits,
                type=CreditTransaction.TYPE_PURCHASE,
                ref_id=str(exam_set.id),
                note=f"Purchased: {exam_set.name}",
            )

        return Response(
            {
                "exam_set_id": exam_set.id,
                "credits_spent": exam_set.price_credits,
                "new_balance": wallet.balance,
                "unlocked_at": unlock.unlocked_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )
