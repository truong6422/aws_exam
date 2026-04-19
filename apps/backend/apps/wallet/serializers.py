from rest_framework import serializers

from .models import CreditTransaction, TopUpRequest, Wallet


class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ["id", "delta", "type", "ref_id", "note", "created_at"]


class WalletSerializer(serializers.ModelSerializer):
    transactions = CreditTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ["balance", "transactions"]


class TopUpRequestCreateSerializer(serializers.Serializer):
    amount_credits = serializers.IntegerField(min_value=1, max_value=10000)


class TopUpRequestSerializer(serializers.ModelSerializer):
    """For user: own requests list"""

    class Meta:
        model = TopUpRequest
        fields = [
            "id",
            "transaction_code",
            "amount_credits",
            "amount_vnd",
            "status",
            "admin_note",
            "created_at",
        ]
        read_only_fields = fields


class AdminTopUpRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True)

    class Meta:
        model = TopUpRequest
        fields = [
            "id",
            "user_id",
            "user_email",
            "user_name",
            "transaction_code",
            "amount_credits",
            "amount_vnd",
            "status",
            "admin_note",
            "approved_by_email",
            "approved_at",
            "created_at",
        ]
