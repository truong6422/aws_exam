---
spec_id: 260418-1923-credit-wallet-exam-purchase-phase-02
status: pending
phase: 02
title: Backend API Endpoints
depends_on: phase-01
acceptance_criteria:
  - GET /api/v1/wallet/ returns balance and transaction history
  - POST /api/v1/wallet/topup/ creates TopUpRequest with generated transaction_code
  - GET /api/v1/wallet/topup-requests/ returns user's own requests
  - POST /api/v1/questions/sets/{id}/purchase/ deducts credits atomically
  - GET /api/v1/admin/topup-requests/ returns paginated requests (staff only)
  - POST /api/v1/admin/topup-requests/{id}/approve/ adds credits atomically
  - POST /api/v1/admin/topup-requests/{id}/reject/ sets status+note
  - GET/PATCH /api/v1/admin/system-config/ reads/updates SystemConfig
  - All admin endpoints return 403 for non-staff users
  - Purchase endpoint prevents double-purchase (409) and insufficient balance (402)
---

# Phase 02 — Backend API Endpoints

## Requirements

Create all API endpoints for the wallet system. Parallel with Phase 03 (which modifies views in different files).

Files to create/modify:
- CREATE `apps/backend/apps/wallet/serializers.py`
- CREATE `apps/backend/apps/wallet/views.py`
- UPDATE `apps/backend/apps/wallet/urls.py`
- CREATE `apps/backend/apps/wallet/purchase_views.py` (purchase endpoint — lives in wallet app but mounted under questions URL)
- UPDATE `apps/backend/apps/questions/urls.py` (add purchase path)
- UPDATE `apps/backend/config/urls.py` (add admin wallet URLs)

## API Contract

### Wallet Endpoints (user-facing)

```
GET  /api/v1/wallet/
Response: {
  balance: int,
  transactions: [
    { id, delta, type, ref_id, note, created_at }
  ]
}

POST /api/v1/wallet/topup/
Request: { amount_credits: int }  # must be > 0
Response (201): {
  id: int,
  transaction_code: str,         # "TXN-A1B2C3D4"
  amount_credits: int,
  amount_vnd: int,               # amount_credits * vnd_per_credit
  status: "pending",
  telegram_template: str,        # formatted message for copy-paste
  admin_telegram_url: str        # "https://t.me/{telegram_username}"
}

GET /api/v1/wallet/topup-requests/
Response: [
  { id, transaction_code, amount_credits, amount_vnd, status, admin_note, created_at }
]
```

### Purchase Endpoint (in questions app)

```
POST /api/v1/questions/sets/{id}/purchase/
Request: {} (empty body)
Response (201): {
  exam_set_id: int,
  credits_spent: int,
  new_balance: int,
  unlocked_at: str
}
Errors:
  402: { detail: "Insufficient credits." }
  409: { detail: "Already purchased." }
  403: { detail: "Exam set is locked by admin." }
  400: { detail: "This exam set is free." }
```

### Admin Endpoints (staff only)

```
GET  /api/v1/admin/topup-requests/
Query params: ?status=pending|approved|rejected
Response: paginated list of {
  id, user: {id, email, name}, transaction_code,
  amount_credits, amount_vnd, status, admin_note,
  approved_by: {id, email} | null, approved_at, created_at
}

POST /api/v1/admin/topup-requests/{id}/approve/
Request: { admin_note: str (optional) }
Response (200): { id, status: "approved", balance_after: int }
Errors:
  400: { detail: "Already processed." }

POST /api/v1/admin/topup-requests/{id}/reject/
Request: { admin_note: str (required) }
Response (200): { id, status: "rejected" }
Errors:
  400: { detail: "Already processed." }

GET  /api/v1/admin/system-config/
Response: { vnd_per_credit: str, telegram_username: str, bank_account_info: str }

PATCH /api/v1/admin/system-config/
Request: { vnd_per_credit?: str, telegram_username?: str, bank_account_info?: str }
Response (200): same as GET
```

## Architecture

### Serializers (`apps/wallet/serializers.py`)

```python
class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ['id', 'delta', 'type', 'ref_id', 'note', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    transactions = CreditTransactionSerializer(many=True, read_only=True)
    class Meta:
        model = Wallet
        fields = ['balance', 'transactions']

class TopUpRequestCreateSerializer(serializers.Serializer):
    amount_credits = serializers.IntegerField(min_value=1, max_value=10000)

class TopUpRequestSerializer(serializers.ModelSerializer):
    """For user: own requests list"""
    class Meta:
        model = TopUpRequest
        fields = ['id', 'transaction_code', 'amount_credits', 'amount_vnd',
                  'status', 'admin_note', 'created_at']
        read_only_fields = fields

class AdminTopUpRequestSerializer(serializers.ModelSerializer):
    """For admin: full details including user info"""
    user = serializers.SerializerMethodField()
    approved_by = serializers.SerializerMethodField()
    def get_user(self, obj):
        return {'id': obj.user_id, 'email': obj.user.email, 'name': obj.user.name}
    def get_approved_by(self, obj):
        if obj.approved_by_id:
            return {'id': obj.approved_by_id, 'email': obj.approved_by.email}
        return None
    class Meta:
        model = TopUpRequest
        fields = ['id', 'user', 'transaction_code', 'amount_credits', 'amount_vnd',
                  'status', 'admin_note', 'approved_by', 'approved_at', 'created_at']
```

### Views (`apps/wallet/views.py`)

```python
import random, string
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CreditTransaction, SystemConfig, TopUpRequest, Wallet


def _generate_transaction_code():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = 'TXN-' + ''.join(random.choices(chars, k=8))
        if not TopUpRequest.objects.filter(transaction_code=code).exists():
            return code


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        # Limit transactions to last 50 for performance
        txns = wallet.transactions.order_by('-created_at')[:50]
        return Response({
            'balance': wallet.balance,
            'transactions': CreditTransactionSerializer(txns, many=True).data,
        })


class TopUpRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TopUpRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount_credits = serializer.validated_data['amount_credits']

        vnd_per_credit = int(SystemConfig.get('vnd_per_credit', '1000'))
        amount_vnd = amount_credits * vnd_per_credit
        transaction_code = _generate_transaction_code()
        telegram_username = SystemConfig.get('telegram_username', '')

        telegram_template = (
            f"Xin chào! Tôi muốn nạp xu:\n"
            f"- Mã GD: {transaction_code}\n"
            f"- Số xu: {amount_credits}\n"
            f"- Số tiền: {amount_vnd:,} VNĐ"
        )

        topup = TopUpRequest.objects.create(
            user=request.user,
            amount_credits=amount_credits,
            amount_vnd=amount_vnd,
            transaction_code=transaction_code,
        )

        return Response({
            'id': topup.id,
            'transaction_code': transaction_code,
            'amount_credits': amount_credits,
            'amount_vnd': amount_vnd,
            'status': topup.status,
            'telegram_template': telegram_template,
            'admin_telegram_url': f'https://t.me/{telegram_username}' if telegram_username else '',
        }, status=status.HTTP_201_CREATED)


class TopUpRequestListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TopUpRequestSerializer

    def get_queryset(self):
        return TopUpRequest.objects.filter(user=self.request.user)


class AdminTopUpRequestListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminTopUpRequestSerializer

    def get_queryset(self):
        qs = TopUpRequest.objects.select_related('user', 'approved_by').all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminTopUpApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        with transaction.atomic():
            topup = TopUpRequest.objects.select_for_update().get(pk=pk)
            if topup.status != TopUpRequest.STATUS_PENDING:
                return Response({'detail': 'Already processed.'}, status=400)

            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=topup.user)
            wallet.balance += topup.amount_credits
            wallet.save(update_fields=['balance', 'updated_at'])

            CreditTransaction.objects.create(
                wallet=wallet,
                delta=topup.amount_credits,
                type=CreditTransaction.TYPE_TOPUP,
                ref_id=topup.transaction_code,
                note=f"Top-up approved by {request.user.email}",
            )

            topup.status = TopUpRequest.STATUS_APPROVED
            topup.admin_note = request.data.get('admin_note', '')
            topup.approved_by = request.user
            topup.approved_at = timezone.now()
            topup.save(update_fields=['status', 'admin_note', 'approved_by', 'approved_at'])

        return Response({'id': topup.id, 'status': topup.status, 'balance_after': wallet.balance})


class AdminTopUpRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        topup = TopUpRequest.objects.get(pk=pk)
        if topup.status != TopUpRequest.STATUS_PENDING:
            return Response({'detail': 'Already processed.'}, status=400)
        topup.status = TopUpRequest.STATUS_REJECTED
        topup.admin_note = request.data.get('admin_note', '')
        topup.save(update_fields=['status', 'admin_note'])
        return Response({'id': topup.id, 'status': topup.status})


class AdminSystemConfigView(APIView):
    permission_classes = [IsAdminUser]
    ALLOWED_KEYS = ['vnd_per_credit', 'telegram_username', 'bank_account_info']

    def get(self, request):
        result = {}
        for key in self.ALLOWED_KEYS:
            result[key] = SystemConfig.get(key, '')
        return Response(result)

    def patch(self, request):
        for key in self.ALLOWED_KEYS:
            if key in request.data:
                SystemConfig.objects.update_or_create(key=key, defaults={'value': request.data[key]})
        return self.get(request)
```

### Purchase View (`apps/wallet/purchase_views.py`)

This view lives in the wallet app but is mounted under questions URLs to keep the endpoint at `/api/v1/questions/sets/{id}/purchase/`.

```python
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from apps.questions.models import ExamSet, UserExamUnlock
from apps.wallet.models import CreditTransaction, Wallet


class ExamSetPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        exam_set = ExamSet.objects.get(pk=pk)

        # Hard lock check first
        if exam_set.is_locked:
            return Response({'detail': 'Exam set is locked by admin.'}, status=403)

        # Free check
        if exam_set.price_credits == 0:
            return Response({'detail': 'This exam set is free.'}, status=400)

        # Already purchased?
        if UserExamUnlock.objects.filter(user=request.user, exam_set=exam_set).exists():
            return Response({'detail': 'Already purchased.'}, status=409)

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get_or_create(user=request.user)[0]

            if wallet.balance < exam_set.price_credits:
                return Response({'detail': 'Insufficient credits.'}, status=402)

            wallet.balance -= exam_set.price_credits
            wallet.save(update_fields=['balance', 'updated_at'])

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

        return Response({
            'exam_set_id': exam_set.id,
            'credits_spent': exam_set.price_credits,
            'new_balance': wallet.balance,
            'unlocked_at': unlock.unlocked_at.isoformat(),
        }, status=201)
```

NOTE: The `get_or_create` + `select_for_update` ordering is intentional — `select_for_update` on `get_or_create` is not directly supported; instead call `get_or_create` first (outside lock), then re-fetch with `select_for_update`. In practice: wrap the whole block in `atomic`, call `Wallet.objects.get_or_create(user=request.user)` then immediately `Wallet.objects.select_for_update().get(user=request.user)` on the same wallet. Simpler: use `get_or_create` then `select_for_update` in two statements inside atomic.

The safe pattern:
```python
with transaction.atomic():
    # Ensure wallet exists
    Wallet.objects.get_or_create(user=request.user)
    # Lock it
    wallet = Wallet.objects.select_for_update().get(user=request.user)
    ...
```

## URL Configuration

### `apps/backend/apps/wallet/urls.py`
```python
from django.urls import path
from .views import (
    AdminSystemConfigView, AdminTopUpApproveView,
    AdminTopUpRejectView, AdminTopUpRequestListView,
    TopUpRequestCreateView, TopUpRequestListView, WalletView,
)

app_name = 'wallet'

urlpatterns = [
    path('', WalletView.as_view(), name='wallet-detail'),
    path('topup/', TopUpRequestCreateView.as_view(), name='topup-create'),
    path('topup-requests/', TopUpRequestListView.as_view(), name='topup-list'),
]

admin_urlpatterns = [
    path('topup-requests/', AdminTopUpRequestListView.as_view(), name='admin-topup-list'),
    path('topup-requests/<int:pk>/approve/', AdminTopUpApproveView.as_view(), name='admin-topup-approve'),
    path('topup-requests/<int:pk>/reject/', AdminTopUpRejectView.as_view(), name='admin-topup-reject'),
    path('system-config/', AdminSystemConfigView.as_view(), name='admin-system-config'),
]
```

### Update `apps/backend/config/urls.py`

Add both prefixes:
```python
path("api/v1/wallet/", include(("apps.wallet.urls", "wallet_v1"))),
path("api/v1/admin/", include(("apps.wallet.urls", "admin_wallet_v1"), 
     # Only import admin_urlpatterns here, not all urlpatterns
     # Better pattern: create a separate urls_admin.py in wallet app
)),
```

Cleaner approach: create `apps/backend/apps/wallet/urls_admin.py`:
```python
from django.urls import path
from .views import (
    AdminSystemConfigView, AdminTopUpApproveView,
    AdminTopUpRejectView, AdminTopUpRequestListView,
)
app_name = 'admin_wallet'
urlpatterns = [
    path('topup-requests/', AdminTopUpRequestListView.as_view(), name='topup-list'),
    path('topup-requests/<int:pk>/approve/', AdminTopUpApproveView.as_view(), name='topup-approve'),
    path('topup-requests/<int:pk>/reject/', AdminTopUpRejectView.as_view(), name='topup-reject'),
    path('system-config/', AdminSystemConfigView.as_view(), name='system-config'),
]
```

Then in `config/urls.py`:
```python
path("api/v1/wallet/", include(("apps.wallet.urls", "wallet_v1"))),
path("api/v1/admin/", include(("apps.wallet.urls_admin", "admin_wallet_v1"))),
```

### Update `apps/backend/apps/questions/urls.py`

Add purchase path:
```python
from apps.wallet.purchase_views import ExamSetPurchaseView

# Add to urlpatterns:
path("sets/<int:pk>/purchase/", ExamSetPurchaseView.as_view(), name="exam-set-purchase"),
```

## Implementation Steps

1. Write `apps/backend/apps/wallet/serializers.py` with all serializers
2. Write `apps/backend/apps/wallet/views.py` with all views (user + admin)
3. Write `apps/backend/apps/wallet/purchase_views.py`
4. Update `apps/backend/apps/wallet/urls.py` (user-facing routes)
5. Create `apps/backend/apps/wallet/urls_admin.py` (admin routes)
6. Update `apps/backend/config/urls.py` — add both wallet and admin prefixes
7. Update `apps/backend/apps/questions/urls.py` — add purchase path

## Success Criteria

1. `GET /api/v1/wallet/` returns `{balance: 0, transactions: []}` for new user
2. `POST /api/v1/wallet/topup/` with `{amount_credits: 100}` returns a `TXN-` code
3. `POST /api/v1/questions/sets/1/purchase/` with 0-balance returns 402
4. `POST /api/v1/admin/topup-requests/1/approve/` by staff adds credits atomically
5. All `/api/v1/admin/` endpoints return 403 for non-staff
6. `GET /api/v1/admin/system-config/` returns the three config keys

## Risk Assessment

- **Circular import**: `purchase_views.py` in `apps.wallet` imports from `apps.questions`. This is fine (questions does not import wallet). Verify no reverse import.
- **Wallet auto-creation**: `get_or_create` on every wallet request. Consider a post-save signal on `User` to create wallet eagerly (optional optimization, not blocking).
- **`select_for_update` on SQLite**: Tests may use SQLite which doesn't support `select_for_update`. Use `pytest.mark.django_db(transaction=True)` and PostgreSQL in tests, or mock the select_for_update in unit tests.
- **HTTP 402**: Standard HTTP status for "payment required". DRF supports this natively.
