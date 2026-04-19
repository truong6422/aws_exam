---
spec_id: 260418-1923-credit-wallet-exam-purchase
status: pending
priority: P1
tags: [wallet, backend, frontend]
created: 2026-04-18
---

# Credit Wallet + Exam Purchase System

## Overview

Add a credit-based economy to the AWS Exam app. Users top up credits (xu) via a Telegram-mediated bank transfer flow, then spend credits to unlock paid exam sets. Admin approves top-ups and configures pricing.

## Phase Table

| Phase | Name | Depends On | Parallelizable With |
|-------|------|------------|---------------------|
| 01 | DB Models + Migrations | — | None (foundation) |
| 02 | Backend API Endpoints | Phase 01 | Phase 03 after 01 |
| 03 | Access Logic Updates | Phase 01 | Phase 02 |
| 04 | Frontend Wallet Page | Phase 02 (contract) | Phase 05 |
| 05 | Frontend Exam Purchase UI | Phase 02 (contract) | Phase 04 |
| 06 | Frontend Admin Wallet | Phase 02 (contract) | Phase 04, 05 |
| 07 | Tests | Phases 01-03 | — |

Phases 02 and 03 depend on Phase 01 and can run in parallel with each other.
Phases 04, 05, 06 depend on Phase 02 API contract being finalized; they can all run in parallel.
Phase 07 depends on Phases 01-03.

## Architecture Summary

### New Backend App
`apps/backend/apps/wallet/` — Django app with:
- `Wallet` (1:1 User), `CreditTransaction` (audit trail), `TopUpRequest`, `SystemConfig`
- All wallet API endpoints: balance, top-up request, admin approval/rejection
- Registered in `INSTALLED_APPS` as `apps.wallet`

### Modified Existing Code
- `apps/questions/models.py`: Add `price_credits` to `ExamSet`, add `UserExamUnlock` model
- `apps/questions/migrations/`: New migration for above fields
- `apps/questions/serializers.py`: Add `price_credits`, `is_unlocked` to `ExamSetSerializer`
- `apps/questions/views.py`: Update `ExamSetListView`, `PracticeQuestionListView` access logic
- `apps/exams/exam_views.py`: Update `ExamStartView` purchase check
- `apps/questions/urls.py`: Add purchase endpoint
- `apps/backend/config/urls.py`: Add wallet URL prefix
- `apps/backend/config/settings/base.py`: Add `apps.wallet` to `LOCAL_APPS`

### New Frontend Files
- `apps/frontend/src/services/wallet-api.ts`
- `apps/frontend/src/pages/wallet/wallet-page.tsx`
- `apps/frontend/src/pages/admin/admin-wallet-page.tsx`

### Modified Frontend Files
- `apps/frontend/src/services/exam-api.ts`: Add wallet types, purchase method
- `apps/frontend/src/services/admin-api.ts`: Add admin wallet/config methods
- `apps/frontend/src/pages/exam/exam-setup-page.tsx`: Price badges, purchase modal
- `apps/frontend/src/pages/admin/admin-exams-page.tsx`: Price field in exam set form
- `apps/frontend/src/router/routes.tsx`: Add wallet and admin-wallet routes
- `apps/frontend/src/layouts/sidebar.tsx`: Add wallet nav item
- `apps/frontend/src/i18n/locales/vi.json` + `en.json`: Wallet i18n strings

## Key Design Decisions

1. **No soft delete on Wallet/CreditTransaction** — `Wallet` does not extend `TimestampedModel`; it is a live balance store. `CreditTransaction` uses `TimestampedModel` for `created_at` only (audit trail).
2. **`select_for_update()` on purchase** — Prevents concurrent double-spend. Wrapped in `transaction.atomic()`.
3. **`price_credits=0` means free** — `is_locked=False` and `price_credits=0` → free access. No `UserExamUnlock` needed.
4. **Hard-lock supremacy** — `is_locked=True` always blocks, even if user paid. Admin override always wins.
5. **`SystemConfig` as key-value** — Simple model for `vnd_per_credit`, `telegram_username`, `bank_account_info`. No per-user config.
6. **Transaction code** — Server-generated, format `TXN-{8 uppercase alphanum}`, unique DB constraint. Frontend shows it with a copy button.
7. **Admin approval flow** — Single `POST /admin/topup-requests/{id}/approve/` view executes: validate pending status, create `CreditTransaction`, update `Wallet.balance`, set `TopUpRequest.status=approved` — all in one atomic transaction.

## Test Strategy

- Django unit tests: wallet purchase atomicity (concurrent `select_for_update` test), balance checks, double-purchase prevention
- API integration tests: full top-up approval flow, purchase flow, access control enforcement
- Frontend: manual smoke test of purchase modal, wallet page, admin approve flow

## Files To Create (Backend)

```
apps/backend/apps/wallet/__init__.py
apps/backend/apps/wallet/apps.py
apps/backend/apps/wallet/models.py
apps/backend/apps/wallet/serializers.py
apps/backend/apps/wallet/views.py
apps/backend/apps/wallet/admin.py
apps/backend/apps/wallet/urls.py
apps/backend/apps/wallet/migrations/0001_initial.py
apps/backend/apps/questions/migrations/0007_examset_price_credits_userexamunlock.py
```

## Files To Create (Frontend)

```
apps/frontend/src/services/wallet-api.ts
apps/frontend/src/pages/wallet/wallet-page.tsx
apps/frontend/src/pages/admin/admin-wallet-page.tsx
```

## Unresolved Questions

- None critical. Exchange rate default value: plan uses 1000 VND/credit as default `SystemConfig` seed.
