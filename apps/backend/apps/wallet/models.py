"""
Wallet app models: credit balance, transaction ledger, top-up requests, system config.
"""
from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Wallet(models.Model):
    """Per-user credit balance store. Not soft-deleted — live balance table."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet',
    )
    balance = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallet_wallet'

    def __str__(self):
        return f"Wallet({self.user_id}) = {self.balance} xu"


class CreditTransaction(TimestampedModel):
    """Immutable audit log of every credit change."""

    TYPE_TOPUP = 'topup'
    TYPE_PURCHASE = 'purchase'
    TYPE_ADMIN_ADJUST = 'admin_adjust'
    TYPE_REFUND = 'refund'
    TRANSACTION_TYPES = [
        (TYPE_TOPUP, 'Top Up'),
        (TYPE_PURCHASE, 'Purchase'),
        (TYPE_ADMIN_ADJUST, 'Admin Adjustment'),
        (TYPE_REFUND, 'Refund'),
    ]

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    delta = models.IntegerField()  # positive = add, negative = deduct
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    ref_id = models.CharField(max_length=100, blank=True)  # TXN code or str(ExamSet.id)
    note = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'wallet_credittransaction'
        ordering = ['-created_at']

    def __str__(self):
        sign = '+' if self.delta >= 0 else ''
        return f"{sign}{self.delta} xu [{self.type}] wallet={self.wallet_id}"


class TopUpRequest(TimestampedModel):
    """User request to top up credits via bank transfer, mediated by admin."""

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='topup_requests',
    )
    amount_credits = models.PositiveIntegerField()
    amount_vnd = models.PositiveIntegerField()
    transaction_code = models.CharField(max_length=20, unique=True)  # TXN-XXXXXXXX
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    admin_note = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_topups',
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'wallet_topuprequest'
        ordering = ['-created_at']

    def __str__(self):
        return f"TopUp#{self.id} {self.transaction_code} [{self.status}] user={self.user_id}"


class SystemConfig(models.Model):
    """Key-value store for admin-configurable system settings."""

    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallet_systemconfig'

    def __str__(self):
        return f"{self.key} = {self.value[:50]}"

    @classmethod
    def get(cls, key, default=None):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default
