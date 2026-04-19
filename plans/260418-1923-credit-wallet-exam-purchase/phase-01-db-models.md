---
spec_id: 260418-1923-credit-wallet-exam-purchase-phase-01
status: pending
phase: 01
title: DB Models + Migrations
acceptance_criteria:
  - New wallet app exists with Wallet, CreditTransaction, TopUpRequest, SystemConfig models
  - ExamSet.price_credits field added
  - UserExamUnlock model added to questions app
  - All migrations run without error
  - apps.wallet registered in INSTALLED_APPS
  - Django admin registered for all new models
---

# Phase 01 — DB Models + Migrations

## Requirements

- Create `apps/backend/apps/wallet/` Django app with four models
- Add `price_credits` field to `ExamSet`
- Add `UserExamUnlock` join table in `apps/questions/models.py`
- Register wallet app in settings
- Register all models in Django admin
- Wire URL prefix in root config (needed even in phase 01 so the app is discoverable)

## Architecture

### New App Structure

```
apps/backend/apps/wallet/
├── __init__.py
├── apps.py                 # WalletConfig, label='wallet'
├── models.py               # Wallet, CreditTransaction, TopUpRequest, SystemConfig
├── admin.py                # Django admin registrations
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py
```

### Model Definitions

#### `Wallet`
```python
class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    balance = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallet_wallet'

    def __str__(self):
        return f"Wallet({self.user_id}) = {self.balance} xu"
```

NOTE: Does NOT extend `TimestampedModel`. Plain `models.Model` — fast balance lookup table, not an audit record.

#### `CreditTransaction`
```python
class CreditTransaction(TimestampedModel):
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
    delta = models.IntegerField()           # positive = add, negative = deduct
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    ref_id = models.CharField(max_length=100, blank=True)  # TopUpRequest.transaction_code or str(ExamSet.id)
    note = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'wallet_credittransaction'
        ordering = ['-created_at']
```

`TimestampedModel` = `ModelMixin` (from `apps.core.models`). Provides `created_at`, `updated_at`, soft delete fields. For CreditTransaction we only care about `created_at` (immutable audit record — never update or delete).

#### `TopUpRequest`
```python
class TopUpRequest(TimestampedModel):
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
        related_name='topup_requests'
    )
    amount_credits = models.PositiveIntegerField()
    amount_vnd = models.PositiveIntegerField()
    transaction_code = models.CharField(max_length=20, unique=True)  # TXN-XXXXXXXX
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    admin_note = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_topups'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'wallet_topuprequest'
        ordering = ['-created_at']
```

#### `SystemConfig`
```python
class SystemConfig(models.Model):
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
```

Known keys: `vnd_per_credit` (default `"1000"`), `telegram_username` (default `""`), `bank_account_info` (default `""`).

### Questions App Changes

#### `ExamSet` — add field
```python
price_credits = models.PositiveIntegerField(default=0)
# 0 = free, >0 = requires purchase
```
Field added after `is_locked` in the model class body.

#### New model `UserExamUnlock` — add to questions/models.py
```python
class UserExamUnlock(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_unlocks'
    )
    exam_set = models.ForeignKey(
        ExamSet,
        on_delete=models.CASCADE,
        related_name='unlocks'
    )
    credits_spent = models.PositiveIntegerField()
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'exam_set')
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"Unlock: {self.user_id} -> ExamSet#{self.exam_set_id}"
```

## Implementation Steps

### Step 1 — Create wallet app skeleton

Create these files:
- `apps/backend/apps/wallet/__init__.py` — empty
- `apps/backend/apps/wallet/apps.py`:
  ```python
  from django.apps import AppConfig
  class WalletConfig(AppConfig):
      default_auto_field = 'django.db.models.BigAutoField'
      name = 'apps.wallet'
      label = 'wallet'
  ```
- `apps/backend/apps/wallet/migrations/__init__.py` — empty

### Step 2 — Write models.py

Write `apps/backend/apps/wallet/models.py` with all four models as specified above.
Import `TimestampedModel` from `apps.core.models` (same pattern as other apps).
Import `settings` from `django.conf`.

### Step 3 — Update questions/models.py

Add `price_credits` field to `ExamSet` (after `is_locked`).
Add `UserExamUnlock` class at the end of the file (before `Bookmark` or after it — place after `Bookmark`).
Add import for `settings` if not already present (it is already imported via `from django.conf import settings`).

### Step 4 — Write migrations

**`apps/backend/apps/wallet/migrations/0001_initial.py`**
- `CreateModel` for `SystemConfig`, `Wallet`, `TopUpRequest`, `CreditTransaction`
- Dependencies: `[('accounts', '0001_initial')]`
- `Wallet` has `OneToOneField` to `settings.AUTH_USER_MODEL`
- `CreditTransaction` has `ForeignKey` to `wallet.Wallet`
- `TopUpRequest` has two FKs to `settings.AUTH_USER_MODEL`
- Include all `TimestampedModel` base fields (created_by, updated_by, deleted_by, created_at, updated_at, deleted_at, is_deleted) on `CreditTransaction` and `TopUpRequest` — copy exact pattern from `apps/questions/migrations/0001_initial.py` lines 29-36.

**`apps/backend/apps/questions/migrations/0007_examset_price_credits_userexamunlock.py`**
- Dependencies: `[('questions', '0006_remove_comment_referenced_answer_comment_parent_and_more')]`
- `AddField`: `ExamSet.price_credits = PositiveIntegerField(default=0)`
- `CreateModel`: `UserExamUnlock` with all fields + `unique_together`

### Step 5 — Register in settings

In `apps/backend/config/settings/base.py`, add `'apps.wallet'` to `LOCAL_APPS` list after `apps.imports`.

### Step 6 — Write admin.py

```python
# apps/backend/apps/wallet/admin.py
from django.contrib import admin
from .models import CreditTransaction, SystemConfig, TopUpRequest, Wallet

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'updated_at']
    search_fields = ['user__email']
    readonly_fields = ['updated_at']

@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'delta', 'type', 'ref_id', 'note', 'created_at']
    list_filter = ['type']
    readonly_fields = ['wallet', 'delta', 'type', 'ref_id', 'note', 'created_at']
    search_fields = ['wallet__user__email', 'ref_id']

@admin.register(TopUpRequest)
class TopUpRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'transaction_code', 'amount_credits', 'amount_vnd', 'status', 'created_at']
    list_filter = ['status']
    readonly_fields = ['user', 'transaction_code', 'amount_credits', 'amount_vnd', 'created_at']
    search_fields = ['user__email', 'transaction_code']

@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'updated_at']
```

Also update `apps/backend/apps/questions/admin.py`:
- Add `UserExamUnlock` import
- Register with `@admin.register(UserExamUnlock)` showing `user`, `exam_set`, `credits_spent`, `unlocked_at`

### Step 7 — Wire URL stub in root config

In `apps/backend/config/urls.py`, add:
```python
path("api/v1/wallet/", include(("apps.wallet.urls", "wallet_v1"))),
```
Create `apps/backend/apps/wallet/urls.py` with a stub for now (to be filled in Phase 02):
```python
from django.urls import path
app_name = 'wallet'
urlpatterns = []
```

## Success Criteria

1. `python manage.py migrate` runs without error on a clean DB
2. `python manage.py check` passes (no system check errors)
3. Django admin at `/admin/` shows Wallet, CreditTransaction, TopUpRequest, SystemConfig, UserExamUnlock
4. ExamSet records have `price_credits=0` by default (verified via admin)

## Risk Assessment

- **Migration conflict**: The `questions` app migration depends on `0006`. Verify the latest migration file name before writing `0007`.
- **TimestampedModel fields**: The `ModelMixin` base adds `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`, `is_deleted` columns. The migration must include all these. Copy the exact field definitions from `0001_initial.py` in questions.
- **AppConfig label**: Must be `label = 'wallet'` (not `'apps.wallet'`) to avoid migration label conflicts.
