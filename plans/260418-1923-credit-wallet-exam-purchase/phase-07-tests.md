---
spec_id: 260418-1923-credit-wallet-exam-purchase-phase-07
status: pending
acceptance_criteria:
  - Wallet purchase atomicity test: two concurrent purchase requests for the same exam set result in exactly one success (HTTP 200) and one "Insufficient credits" (HTTP 402)
  - Double-purchase prevention test: second purchase of same exam set returns HTTP 409 or equivalent
  - Balance enforcement test: purchase with insufficient balance returns HTTP 402
  - Top-up approval flow test: approve endpoint credits wallet, creates CreditTransaction, sets status='approved'
  - Access control test: exam set with price_credits>0 returns is_unlocked=False for unauthenticated and non-purchaser, True for purchaser
  - ExamStart paywall test: POST /api/v1/exams/start/ with exam_set_id returns 403 if not unlocked
  - All tests pass with pytest -x --reuse-db
---

# Phase 07 — Tests

## Requirements

Cover the new wallet, purchase, and access-control logic with pytest-style Django tests that follow the existing patterns in `apps/backend/apps/exams/tests/` and `apps/backend/apps/accounts/tests/`.

## Architecture

### Test File Layout

```
apps/backend/apps/wallet/
└── tests/
    ├── __init__.py
    ├── conftest.py            # shared fixtures for wallet tests
    ├── test_wallet_balance.py # unit tests: balance deduction, insufficient funds
    ├── test_purchase.py       # integration: purchase endpoint, double-buy, concurrency
    └── test_topup.py          # integration: top-up request creation, admin approval flow

apps/backend/apps/questions/
└── tests/
    └── test_exam_set_access.py  # is_unlocked serializer logic + ExamStart paywall
```

Note: `apps/backend/apps/questions/tests/` likely already exists (check before writing new file — if `test_exam_set_access.py` already exists, add cases to it rather than creating a new file).

## Implementation Steps

### Step 1 — `apps/wallet/tests/conftest.py`

```python
"""
Shared pytest fixtures for wallet app tests.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.questions.models import Answer, Certification, ExamSet, Question
from apps.wallet.models import Wallet

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='buyer@example.com',
        email='buyer@example.com',
        password='testpass123',
    )


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username='staff@example.com',
        email='staff@example.com',
        password='staffpass123',
        is_staff=True,
    )


def _make_client(user_obj):
    client = APIClient()
    refresh = RefreshToken.for_user(user_obj)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


@pytest.fixture
def auth_client(user):
    return _make_client(user), user


@pytest.fixture
def staff_client(staff_user):
    return _make_client(staff_user), staff_user


@pytest.fixture
def wallet(user):
    """Create wallet with 100 credits for the test user."""
    return Wallet.objects.create(user=user, balance=100)


@pytest.fixture
def certification(db):
    return Certification.objects.create(
        code='SAA-C03',
        name='AWS Solutions Architect Associate',
        description='Test cert',
        time_limit_minutes=130,
        total_questions=10,
        passing_score=72,
    )


@pytest.fixture
def free_exam_set(db, certification):
    """ExamSet with price_credits=0 (free)."""
    return ExamSet.objects.create(
        certification=certification,
        name='Free Set',
        description='',
        is_locked=False,
        price_credits=0,
    )


@pytest.fixture
def paid_exam_set(db, certification):
    """ExamSet with price_credits=50."""
    return ExamSet.objects.create(
        certification=certification,
        name='Paid Set',
        description='',
        is_locked=False,
        price_credits=50,
    )


@pytest.fixture
def expensive_exam_set(db, certification):
    """ExamSet with price_credits=200 (more than the default wallet balance of 100)."""
    return ExamSet.objects.create(
        certification=certification,
        name='Expensive Set',
        description='',
        is_locked=False,
        price_credits=200,
    )
```

### Step 2 — `apps/wallet/tests/test_wallet_balance.py`

Unit-level tests that exercise the model/service logic directly without HTTP.

```python
"""
Unit tests for Wallet balance manipulation and CreditTransaction creation.
"""
import pytest
from django.contrib.auth import get_user_model
from apps.wallet.models import Wallet, CreditTransaction

User = get_user_model()

PURCHASE_URL_TEMPLATE = '/api/v1/questions/sets/{set_id}/purchase/'


@pytest.mark.django_db
class TestWalletModel:
    """Direct model-level assertions."""

    def test_wallet_created_with_zero_balance(self, user):
        """New wallet starts at 0."""
        w = Wallet.objects.create(user=user)
        assert w.balance == 0

    def test_balance_can_be_set_to_positive(self, user):
        w = Wallet.objects.create(user=user, balance=500)
        assert w.balance == 500

    def test_wallet_user_is_unique(self, user):
        """Cannot create two wallets for the same user."""
        from django.db import IntegrityError
        Wallet.objects.create(user=user)
        with pytest.raises(IntegrityError):
            Wallet.objects.create(user=user)


@pytest.mark.django_db
class TestInsufficientFunds:
    """HTTP-level tests for balance enforcement."""

    def test_purchase_insufficient_balance_returns_402(
        self, auth_client, wallet, expensive_exam_set
    ):
        """Purchase fails with 402 when balance < price."""
        client, _ = auth_client
        resp = client.post(
            PURCHASE_URL_TEMPLATE.format(set_id=expensive_exam_set.id), {}, format='json'
        )
        assert resp.status_code == 402
        assert 'detail' in resp.data or 'error' in resp.data

    def test_purchase_insufficient_does_not_alter_balance(
        self, auth_client, wallet, expensive_exam_set
    ):
        """Failed purchase leaves wallet balance unchanged."""
        client, user = auth_client
        initial_balance = wallet.balance
        client.post(
            PURCHASE_URL_TEMPLATE.format(set_id=expensive_exam_set.id), {}, format='json'
        )
        wallet.refresh_from_db()
        assert wallet.balance == initial_balance

    def test_purchase_no_wallet_auto_creates_wallet_and_returns_402(
        self, auth_client, expensive_exam_set
    ):
        """Purchase endpoint auto-creates wallet if missing, then returns 402."""
        client, user = auth_client
        # No wallet created yet
        resp = client.post(
            PURCHASE_URL_TEMPLATE.format(set_id=expensive_exam_set.id), {}, format='json'
        )
        assert resp.status_code == 402
        # Wallet was auto-created with balance=0
        from apps.wallet.models import Wallet
        assert Wallet.objects.filter(user=user).exists()
        assert Wallet.objects.get(user=user).balance == 0
```

### Step 3 — `apps/wallet/tests/test_purchase.py`

```python
"""
Integration tests for the exam set purchase endpoint.

Covers:
- Successful purchase: balance deducted, UserExamUnlock created, CreditTransaction logged
- Double-purchase prevention (unique_together constraint)
- Locked exam set cannot be purchased
- Free exam set returns error (no purchase needed)
- Admin user bypasses paywall (no purchase needed)
- Concurrent purchase atomicity (requires transaction=True)
"""
import pytest
import threading
from django.contrib.auth import get_user_model

from apps.wallet.models import CreditTransaction, Wallet
from apps.questions.models import UserExamUnlock

User = get_user_model()

PURCHASE_URL_TEMPLATE = '/api/v1/questions/sets/{set_id}/purchase/'


@pytest.mark.django_db
class TestSuccessfulPurchase:

    def test_purchase_deducts_balance(self, auth_client, wallet, paid_exam_set):
        """Purchase reduces wallet.balance by price_credits."""
        client, user = auth_client
        initial = wallet.balance  # 100
        resp = client.post(
            PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json'
        )
        assert resp.status_code == 200
        wallet.refresh_from_db()
        assert wallet.balance == initial - paid_exam_set.price_credits

    def test_purchase_creates_user_exam_unlock(self, auth_client, wallet, paid_exam_set):
        """Successful purchase creates a UserExamUnlock record."""
        client, user = auth_client
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        assert UserExamUnlock.objects.filter(user=user, exam_set=paid_exam_set).exists()

    def test_purchase_creates_credit_transaction(self, auth_client, wallet, paid_exam_set):
        """Purchase creates a CreditTransaction with correct delta."""
        client, user = auth_client
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        tx = CreditTransaction.objects.filter(wallet=wallet).last()
        assert tx is not None
        assert tx.delta == -paid_exam_set.price_credits
        assert tx.type == CreditTransaction.TYPE_PURCHASE

    def test_purchase_credits_spent_recorded(self, auth_client, wallet, paid_exam_set):
        """UserExamUnlock.credits_spent equals the price at time of purchase."""
        client, user = auth_client
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        unlock = UserExamUnlock.objects.get(user=user, exam_set=paid_exam_set)
        assert unlock.credits_spent == paid_exam_set.price_credits


@pytest.mark.django_db
class TestDoublePurchase:

    def test_second_purchase_returns_error(self, auth_client, wallet, paid_exam_set):
        """Buying the same exam set twice returns a 409 or 400 error."""
        client, _ = auth_client
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        resp2 = client.post(
            PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json'
        )
        assert resp2.status_code in (400, 409)

    def test_double_purchase_does_not_duplicate_unlock(self, auth_client, wallet, paid_exam_set):
        """After two purchase attempts, exactly one UserExamUnlock exists."""
        client, user = auth_client
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        assert UserExamUnlock.objects.filter(user=user, exam_set=paid_exam_set).count() == 1

    def test_double_purchase_balance_only_deducted_once(
        self, auth_client, wallet, paid_exam_set
    ):
        """Balance is deducted exactly once even if purchased twice."""
        client, user = auth_client
        initial = wallet.balance
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        wallet.refresh_from_db()
        assert wallet.balance == initial - paid_exam_set.price_credits


@pytest.mark.django_db
class TestPurchaseEdgeCases:

    def test_locked_exam_set_cannot_be_purchased(self, auth_client, wallet, certification):
        """Admin-locked sets return 403 when purchase is attempted."""
        from apps.questions.models import ExamSet
        locked_set = ExamSet.objects.create(
            certification=certification,
            name='Locked', description='', is_locked=True, price_credits=50
        )
        client, _ = auth_client
        resp = client.post(PURCHASE_URL_TEMPLATE.format(set_id=locked_set.id), {}, format='json')
        assert resp.status_code == 403

    def test_free_exam_set_purchase_returns_error(self, auth_client, wallet, free_exam_set):
        """Free exam sets (price_credits=0) should not need purchase."""
        client, _ = auth_client
        resp = client.post(PURCHASE_URL_TEMPLATE.format(set_id=free_exam_set.id), {}, format='json')
        # Either 400 (bad request: already free) or 404 (endpoint ignores free sets)
        assert resp.status_code in (400, 404)

    def test_unauthenticated_purchase_returns_401(self, paid_exam_set):
        """Unauthenticated request returns 401."""
        from rest_framework.test import APIClient
        client = APIClient()
        resp = client.post(PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json')
        assert resp.status_code == 401


@pytest.mark.django_db(transaction=True)
class TestConcurrentPurchase:
    """
    Concurrency test for select_for_update() protection.

    Requires transaction=True so each thread gets a real DB transaction.
    Uses threading to simulate simultaneous requests.
    This test may be slow (2-3s) due to DB locking overhead — mark with @pytest.mark.slow if needed.
    """

    def test_concurrent_purchase_only_deducts_once(
        self, user, paid_exam_set
    ):
        """
        Two simultaneous purchase requests: only one succeeds,
        total balance deducted equals price_credits exactly once.
        """
        from apps.wallet.models import Wallet
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework.test import APIClient

        # Give user exactly enough for one purchase
        wallet = Wallet.objects.create(user=user, balance=paid_exam_set.price_credits)

        def make_request():
            client = APIClient()
            refresh = RefreshToken.for_user(user)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
            return client.post(
                PURCHASE_URL_TEMPLATE.format(set_id=paid_exam_set.id), {}, format='json'
            )

        results = []
        threads = [threading.Thread(target=lambda: results.append(make_request())) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        statuses = sorted([r.status_code for r in results])
        # One 200 (success) and one 402 (insufficient funds)
        assert statuses == [200, 402]

        # Balance should be 0 (deducted exactly once)
        wallet.refresh_from_db()
        assert wallet.balance == 0

        # Exactly one unlock record
        assert UserExamUnlock.objects.filter(user=user, exam_set=paid_exam_set).count() == 1
```

### Step 4 — `apps/wallet/tests/test_topup.py`

```python
"""
Integration tests for top-up request creation and admin approval flow.

Covers:
- User creates a top-up request → gets transaction_code in response
- Transaction code is unique across multiple requests
- Admin approves → wallet balance increased, CreditTransaction created, status='approved'
- Admin rejects → status='rejected', wallet balance unchanged
- Non-admin cannot approve or reject
- Cannot approve an already-approved request
"""
import pytest
from apps.wallet.models import CreditTransaction, TopUpRequest, Wallet

TOPUP_URL = '/api/v1/wallet/topup/'
TOPUP_REQUESTS_URL = '/api/v1/wallet/topup-requests/'
APPROVE_URL_TEMPLATE = '/api/v1/wallet/admin/topup-requests/{id}/approve/'
REJECT_URL_TEMPLATE = '/api/v1/wallet/admin/topup-requests/{id}/reject/'


@pytest.mark.django_db
class TestTopUpRequestCreation:

    def test_create_topup_returns_transaction_code(self, auth_client):
        """Creating a top-up request returns a transaction_code."""
        client, _ = auth_client
        resp = client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        assert resp.status_code == 201
        assert 'transaction_code' in resp.data
        assert len(resp.data['transaction_code']) >= 8

    def test_topup_computes_amount_vnd(self, auth_client):
        """amount_vnd is computed from SystemConfig.vnd_per_credit."""
        client, _ = auth_client
        resp = client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        assert resp.status_code == 201
        assert 'amount_vnd' in resp.data
        assert resp.data['amount_vnd'] > 0

    def test_topup_codes_are_unique(self, auth_client):
        """Two top-up requests for the same user have different transaction codes."""
        client, _ = auth_client
        r1 = client.post(TOPUP_URL, {'amount_credits': 50}, format='json')
        r2 = client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        assert r1.data['transaction_code'] != r2.data['transaction_code']

    def test_topup_status_is_pending(self, auth_client):
        """Newly created top-up request has status='pending'."""
        client, _ = auth_client
        resp = client.post(TOPUP_URL, {'amount_credits': 50}, format='json')
        req = TopUpRequest.objects.get(id=resp.data['id'])
        assert req.status == TopUpRequest.STATUS_PENDING

    def test_unauthenticated_topup_returns_401(self):
        """Cannot create top-up request without authentication."""
        from rest_framework.test import APIClient
        client = APIClient()
        resp = client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        assert resp.status_code == 401

    def test_zero_credits_topup_returns_error(self, auth_client):
        """Requesting 0 credits is invalid."""
        client, _ = auth_client
        resp = client.post(TOPUP_URL, {'amount_credits': 0}, format='json')
        assert resp.status_code == 400


@pytest.mark.django_db
class TestTopUpApproval:

    def test_admin_approve_credits_wallet(self, auth_client, staff_client):
        """Admin approval increases user's wallet balance by amount_credits."""
        user_client, user = auth_client
        admin_client, _ = staff_client

        # User creates request
        resp = user_client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        req_id = resp.data['id']

        # Admin approves
        approve_resp = admin_client.post(APPROVE_URL_TEMPLATE.format(id=req_id), {}, format='json')
        assert approve_resp.status_code == 200

        # Wallet balance increased
        wallet = Wallet.objects.get(user=user)
        assert wallet.balance == 100

    def test_admin_approve_creates_credit_transaction(self, auth_client, staff_client):
        """Approval creates a CreditTransaction with type='topup' and correct delta."""
        user_client, user = auth_client
        admin_client, _ = staff_client

        resp = user_client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        req_id = resp.data['id']
        admin_client.post(APPROVE_URL_TEMPLATE.format(id=req_id), {}, format='json')

        wallet = Wallet.objects.get(user=user)
        tx = CreditTransaction.objects.filter(wallet=wallet).last()
        assert tx is not None
        assert tx.delta == 100
        assert tx.type == CreditTransaction.TYPE_TOPUP

    def test_admin_approve_sets_status_approved(self, auth_client, staff_client):
        """Approved request has status='approved' and approved_at is set."""
        user_client, _ = auth_client
        admin_client, admin_user = staff_client

        resp = user_client.post(TOPUP_URL, {'amount_credits': 50}, format='json')
        req_id = resp.data['id']
        admin_client.post(APPROVE_URL_TEMPLATE.format(id=req_id), {}, format='json')

        req = TopUpRequest.objects.get(id=req_id)
        assert req.status == TopUpRequest.STATUS_APPROVED
        assert req.approved_at is not None
        assert req.approved_by_id == admin_user.id

    def test_approve_idempotent_second_call_returns_error(self, auth_client, staff_client):
        """Cannot approve an already-approved request."""
        user_client, _ = auth_client
        admin_client, _ = staff_client

        resp = user_client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        req_id = resp.data['id']
        admin_client.post(APPROVE_URL_TEMPLATE.format(id=req_id), {}, format='json')
        resp2 = admin_client.post(APPROVE_URL_TEMPLATE.format(id=req_id), {}, format='json')
        assert resp2.status_code in (400, 409)

    def test_non_admin_cannot_approve(self, auth_client):
        """Regular user cannot call the approve endpoint."""
        client, _ = auth_client
        resp = client.post(TOPUP_URL, {'amount_credits': 50}, format='json')
        req_id = resp.data['id']
        approve_resp = client.post(APPROVE_URL_TEMPLATE.format(id=req_id), {}, format='json')
        assert approve_resp.status_code == 403


@pytest.mark.django_db
class TestTopUpRejection:

    def test_admin_reject_sets_status_rejected(self, auth_client, staff_client):
        """Rejected request has status='rejected'."""
        user_client, _ = auth_client
        admin_client, _ = staff_client

        resp = user_client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        req_id = resp.data['id']
        admin_client.post(
            REJECT_URL_TEMPLATE.format(id=req_id),
            {'admin_note': 'Transfer not found'},
            format='json'
        )
        req = TopUpRequest.objects.get(id=req_id)
        assert req.status == TopUpRequest.STATUS_REJECTED
        assert req.admin_note == 'Transfer not found'

    def test_admin_reject_does_not_alter_wallet(self, auth_client, staff_client, wallet):
        """Rejection does not change user's wallet balance."""
        user_client, user = auth_client
        admin_client, _ = staff_client

        initial_balance = wallet.balance
        resp = user_client.post(TOPUP_URL, {'amount_credits': 100}, format='json')
        req_id = resp.data['id']
        admin_client.post(REJECT_URL_TEMPLATE.format(id=req_id), {}, format='json')

        wallet.refresh_from_db()
        assert wallet.balance == initial_balance
```

### Step 5 — `apps/questions/tests/test_exam_set_access.py`

```python
"""
Tests for exam set access control — is_unlocked serializer field and ExamStart paywall.

Covers:
- Free exam set: is_unlocked=True for any authenticated user
- Paid set: is_unlocked=False for user who has not purchased
- Paid set: is_unlocked=True for user who has purchased
- Staff user: is_unlocked=True regardless of purchase
- ExamStart blocked with 403 for unpurchased paid set
- ExamStart succeeds after purchase
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.questions.models import Answer, ExamSet, Question, UserExamUnlock
from apps.wallet.models import Wallet

User = get_user_model()

SETS_URL_TEMPLATE = '/api/v1/questions/certifications/{cert_id}/sets/'
EXAM_START_URL = '/api/v1/exams/start/'


@pytest.mark.django_db
class TestExamSetIsUnlocked:
    """Verify is_unlocked field in ExamSetSerializer responses."""

    def test_free_set_is_unlocked_for_authenticated_user(
        self, auth_client, certification, free_exam_set
    ):
        """price_credits=0 → is_unlocked=True."""
        client, _ = auth_client
        resp = client.get(SETS_URL_TEMPLATE.format(cert_id=certification.id))
        assert resp.status_code == 200
        found = next((s for s in resp.data if s['id'] == free_exam_set.id), None)
        assert found is not None
        assert found['is_unlocked'] is True

    def test_paid_set_is_locked_for_non_purchaser(
        self, auth_client, certification, paid_exam_set
    ):
        """price_credits>0, no UserExamUnlock → is_unlocked=False."""
        client, _ = auth_client
        resp = client.get(SETS_URL_TEMPLATE.format(cert_id=certification.id))
        found = next((s for s in resp.data if s['id'] == paid_exam_set.id), None)
        assert found is not None
        assert found['is_unlocked'] is False

    def test_paid_set_is_unlocked_after_purchase(
        self, auth_client, certification, paid_exam_set, wallet
    ):
        """After UserExamUnlock is created, is_unlocked=True."""
        client, user = auth_client
        UserExamUnlock.objects.create(
            user=user, exam_set=paid_exam_set, credits_spent=paid_exam_set.price_credits
        )
        resp = client.get(SETS_URL_TEMPLATE.format(cert_id=certification.id))
        found = next((s for s in resp.data if s['id'] == paid_exam_set.id), None)
        assert found['is_unlocked'] is True

    def test_staff_sees_all_sets_as_unlocked(
        self, staff_client, certification, paid_exam_set
    ):
        """Staff users bypass paywall — is_unlocked=True for all sets."""
        client, _ = staff_client
        resp = client.get(SETS_URL_TEMPLATE.format(cert_id=certification.id))
        found = next((s for s in resp.data if s['id'] == paid_exam_set.id), None)
        assert found['is_unlocked'] is True

    def test_unauthenticated_user_sees_paid_set_as_locked(
        self, certification, paid_exam_set
    ):
        """Unauthenticated request: is_unlocked=False for paid sets."""
        client = APIClient()
        resp = client.get(SETS_URL_TEMPLATE.format(cert_id=certification.id))
        # Response may be 401 or 200 with is_unlocked=False depending on auth config
        if resp.status_code == 200:
            found = next((s for s in resp.data if s['id'] == paid_exam_set.id), None)
            if found:
                assert found['is_unlocked'] is False


@pytest.mark.django_db
class TestExamStartPaywall:
    """Verify ExamStartView enforces the paywall."""

    def test_start_free_set_succeeds(
        self, auth_client, certification, free_exam_set
    ):
        """Starting a free set requires no purchase."""
        # Need questions for exam start to work
        _add_questions_to_set(free_exam_set, certification)
        client, _ = auth_client
        resp = client.post(EXAM_START_URL, {'exam_set_id': free_exam_set.id}, format='json')
        assert resp.status_code == 201

    def test_start_paid_set_without_purchase_returns_403(
        self, auth_client, certification, paid_exam_set
    ):
        """Starting a paid set without UserExamUnlock returns 403."""
        _add_questions_to_set(paid_exam_set, certification)
        client, _ = auth_client
        resp = client.post(EXAM_START_URL, {'exam_set_id': paid_exam_set.id}, format='json')
        assert resp.status_code == 403

    def test_start_paid_set_after_purchase_succeeds(
        self, auth_client, certification, paid_exam_set, wallet
    ):
        """Starting a paid set with UserExamUnlock returns 201."""
        _add_questions_to_set(paid_exam_set, certification)
        client, user = auth_client
        UserExamUnlock.objects.create(
            user=user, exam_set=paid_exam_set, credits_spent=paid_exam_set.price_credits
        )
        resp = client.post(EXAM_START_URL, {'exam_set_id': paid_exam_set.id}, format='json')
        assert resp.status_code == 201

    def test_start_locked_set_returns_403(
        self, auth_client, certification
    ):
        """Admin-locked set returns 403 even when purchased."""
        from apps.questions.models import ExamSet
        locked_set = ExamSet.objects.create(
            certification=certification,
            name='Locked Paid', description='', is_locked=True, price_credits=0
        )
        _add_questions_to_set(locked_set, certification)
        client, user = auth_client
        UserExamUnlock.objects.create(user=user, exam_set=locked_set, credits_spent=0)
        resp = client.post(EXAM_START_URL, {'exam_set_id': locked_set.id}, format='json')
        assert resp.status_code == 403


def _add_questions_to_set(exam_set, certification, count=5):
    """Helper: create questions assigned to an exam set."""
    for i in range(count):
        q = Question.objects.create(
            text=f'Q{i} for {exam_set.name}',
            question_type='single',
            certification=certification,
            exam_set=exam_set,
        )
        Answer.objects.create(question=q, text='Correct', is_correct=True)
        Answer.objects.create(question=q, text='Wrong', is_correct=False)
```

Note: `_add_questions_to_set` assumes `Question` has an `exam_set` ForeignKey or M2M. Verify against the actual `apps/questions/models.py` Question model definition. Adjust if Question links to ExamSet differently (e.g., through `exam_set` as a ForeignKey or through a separate mapping table).

### Step 6 — `pytest.ini` / `conftest.py` root checks

Verify the top-level `conftest.py` or `pytest.ini` at `apps/backend/` includes the `wallet` app in `DJANGO_SETTINGS_MODULE` (it should after phase-01 adds `'apps.wallet'` to `LOCAL_APPS`). No changes needed here beyond verifying.

```ini
# apps/backend/pytest.ini (verify these settings exist)
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

## Manual Smoke Tests (Frontend)

These are checklist items for manual QA after implementation, not automated:

### Wallet Page (`/wallet`)
- [ ] Page loads with correct balance (0 for new user)
- [ ] "Nạp xu" button opens top-up modal
- [ ] Step 1: amount chips (50/100/200/500) select correctly, custom input works
- [ ] Step 2: TXN code displayed in monospace, copy button copies to clipboard
- [ ] "Mở Telegram" link opens `https://t.me/{telegram_username}` in new tab
- [ ] Transaction history table shows submitted requests with correct status badges

### Exam Setup Page (`/exam/setup`)
- [ ] Free sets show green "Miễn phí" badge and "Bắt đầu thi" button
- [ ] Paid-but-unlocked sets show no price badge and "Bắt đầu thi" button
- [ ] Paid-but-locked sets show orange "N xu" badge and "Mua bộ đề" button
- [ ] Admin-locked sets show lock icon and dimmed card (unchanged behavior)
- [ ] Clicking "Mua bộ đề" opens purchase modal with balance and price displayed
- [ ] Insufficient balance: modal shows warning and "Nạp xu ngay" link
- [ ] Sufficient balance: confirm purchase → balance reduced, button changes to "Bắt đầu thi"

### Admin Wallet Page (`/admin/wallet`)
- [ ] "Ví xu" nav item appears in admin sidebar
- [ ] Page shows pending requests or empty state message
- [ ] Approve: row disappears, success toast shown
- [ ] Reject: modal opens, admin can type note, confirm → row disappears

### Admin Exams Page (`/admin/exams`)
- [ ] Price column appears with green "Miễn phí" or orange "N xu" badges
- [ ] Click badge → inline input appears pre-filled
- [ ] Type new value, press Enter → saves and badge updates
- [ ] Press Escape → cancels without saving
- [ ] Set to 0 → badge changes to green "Miễn phí"

## Success Criteria

1. `pytest apps/backend/apps/wallet/ -v` — all 30+ tests pass
2. `pytest apps/backend/apps/questions/tests/test_exam_set_access.py -v` — all 8 tests pass
3. `pytest apps/backend/apps/wallet/tests/test_purchase.py::TestConcurrentPurchase -v` — passes (may require PostgreSQL, not SQLite)
4. No N+1 queries on `/api/v1/questions/certifications/{id}/sets/` (verify with `django-debug-toolbar` or `assertNumQueries`)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `select_for_update()` not supported on SQLite in test environment | High | Use `@pytest.mark.django_db(transaction=True)` and PostgreSQL in CI; SQLite tests can skip concurrent test with `pytest.importorskip` or DB-conditional skip |
| `Question.exam_set` FK structure unknown | Medium | Verify `apps/questions/models.py` before writing `_add_questions_to_set`; adjust FK path accordingly |
| `TopUpRequest.STATUS_PENDING` constant name differs from actual model | Low | Import from `apps.wallet.models` directly; adjust string if model uses a different constant naming |
| `CreditTransaction.TYPE_TOPUP` constant undefined | Low | Match whatever constant names are defined in phase-01 models |
| Concurrent test flakiness due to thread timing | Medium | Add `time.sleep(0.01)` between thread starts if both threads don't actually run concurrently; alternatively use `concurrent.futures.ThreadPoolExecutor` |
