---
spec_id: 260418-1923-credit-wallet-exam-purchase-phase-05
status: pending
phase: 05
title: Frontend Exam Purchase UI
depends_on: phase-02 (API contract), phase-03 (updated ExamSet type)
acceptance_criteria:
  - ExamSet cards show "Miễn phí" badge or "{N} xu" price badge
  - Locked-by-admin sets show existing lock UI (unchanged)
  - Paid+not-unlocked sets show "Mở khóa (N xu)" button instead of "Bắt đầu thi"
  - Purchase confirmation modal with balance check
  - After purchase: balance updates, button changes to "Bắt đầu thi"
  - Insufficient balance shows "Nạp xu" link
  - ExamSet type updated with price_credits and is_unlocked
  - exam-api.ts has purchaseExamSet() method
---

# Phase 05 — Frontend Exam Purchase UI

## Requirements

Update `exam-setup-page.tsx` to show price information and handle the purchase flow for paid exam sets. Parallels Phase 04.

## Type Updates: `apps/frontend/src/services/exam-api.ts`

### Updated `ExamSet` interface
```typescript
export interface ExamSet {
  id: number
  name: string
  description: string
  is_locked: boolean
  price_credits: number      // NEW: 0 = free, >0 = paid
  is_unlocked: boolean       // NEW: true if user can access (free or purchased)
  question_count: number
}
```

### New `PurchaseResult` interface
```typescript
export interface PurchaseResult {
  exam_set_id: number
  credits_spent: number
  new_balance: number
  unlocked_at: string
}
```

### New method in `examApi`
```typescript
purchaseExamSet: (setId: number) =>
  apiClient.post<PurchaseResult>(`/questions/sets/${setId}/purchase/`, {}),
```

## Page Updates: `apps/frontend/src/pages/exam/exam-setup-page.tsx`

### New State
```typescript
const [userBalance, setUserBalance] = useState<number | null>(null)
const [purchasingId, setPurchasingId] = useState<number | null>(null)
const [purchaseModal, setPurchaseModal] = useState<ExamSet | null>(null)
```

### Balance Fetch
On component mount (alongside certifications fetch), also fetch user balance:
```typescript
import { walletApi } from '@/services/wallet-api'

// In useEffect:
walletApi.getWallet()
  .then(w => setUserBalance(w.balance))
  .catch(() => {}) // silent fail — balance not critical
```

### ExamSet Card Changes

**Access state logic** (replace current `isLocked`/`canEnter` logic):
```typescript
const isAdminLocked = set.is_locked              // hard lock
const isFree = set.price_credits === 0
const isUnlocked = set.is_unlocked               // from API
const isPurchasable = !isAdminLocked && !isFree && !isUnlocked
const canStart = !isAdminLocked && isUnlocked
```

**Price badge** (show above or next to set name):
```tsx
{!isAdminLocked && (
  <span style={{
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '100px',
    background: isFree ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 149, 0, 0.15)',
    color: isFree ? '#34c759' : '#ff9500',
    border: isFree ? '1px solid rgba(52,199,89,0.25)' : '1px solid rgba(255,149,0,0.25)',
  }}>
    {isFree ? t('exam.price_free') : `${set.price_credits} xu`}
  </span>
)}
```

**Button state**:
```tsx
<button
  disabled={isAdminLocked || startingId !== null || purchasingId !== null}
  className={canStart ? 'btn-primary' : (isPurchasable ? 'btn-secondary' : 'btn-secondary')}
  style={{ width: '100%', fontSize: '14px', padding: '10px' }}
  onClick={(e) => {
    e.stopPropagation()
    if (canStart) handleStart(set)
    else if (isPurchasable) setPurchaseModal(set)
  }}
>
  {startingId === set.id
    ? t('exam.starting')
    : purchasingId === set.id
    ? t('exam.purchasing')
    : isAdminLocked
    ? t('exam.locked')
    : canStart
    ? t('exam.start_button')
    : `${t('exam.unlock_button')} (${set.price_credits} xu)`
  }
</button>
```

**Card onClick**: remove the card-level click when set is purchasable (prevent accidental clicks):
```tsx
onClick={() => {
  if (canStart) handleStart(set)
  else if (isPurchasable) setPurchaseModal(set)
  // admin locked: no-op
}}
```

### Purchase Modal

```tsx
{purchaseModal && (
  <PurchaseModal
    examSet={purchaseModal}
    userBalance={userBalance ?? 0}
    onClose={() => setPurchaseModal(null)}
    onConfirm={handlePurchase}
    purchasing={purchasingId === purchaseModal.id}
  />
)}
```

**`PurchaseModal` component** (inline in exam-setup-page.tsx or separate component file):
```
Layout:
  - Title: "Mở khóa {examSet.name}"
  - Balance display: "Số dư: {balance} xu"
  - Cost: "Chi phí: {price_credits} xu"
  - Balance after: "Số dư còn lại: {balance - price_credits} xu"
  - If balance < price_credits:
      Warning: "Số dư không đủ" + link to /wallet "Nạp xu ngay"
  - Confirm button (disabled if insufficient): "Xác nhận mở khóa"
  - Cancel button
```

### `handlePurchase` function
```typescript
const handlePurchase = async (examSet: ExamSet) => {
  setPurchasingId(examSet.id)
  setPurchaseModal(null)
  try {
    const result = await examApi.purchaseExamSet(examSet.id)
    // Update local state: mark set as unlocked
    setExamSets(prev => prev.map(s =>
      s.id === examSet.id ? { ...s, is_unlocked: true } : s
    ))
    setUserBalance(result.new_balance)
    addToast({ type: 'success', message: t('exam.purchase_success') })
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('Insufficient')) {
      addToast({ type: 'error', message: t('exam.purchase_insufficient') })
    } else {
      addToast({ type: 'error', message: t('exam.purchase_error') })
    }
  } finally {
    setPurchasingId(null)
  }
}
```

### Balance Display (optional, page-level)

Show a small balance chip in the exam set list header when `userBalance !== null`:
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <PageHeader title={selectedCert.name} subtitle={t('exam.select_set_subtitle')} />
  {userBalance !== null && (
    <span style={{
      fontSize: '12px', padding: '4px 10px', borderRadius: '100px',
      background: 'rgba(255,149,0,0.15)', color: '#ff9500',
      border: '1px solid rgba(255,149,0,0.2)', fontWeight: 600,
    }}>
      {userBalance} xu
    </span>
  )}
</div>
```

## i18n Additions to `vi.json` (exam section)

```json
"price_free": "Miễn phí",
"unlock_button": "Mở khóa",
"purchasing": "Đang mở khóa...",
"purchase_success": "Mở khóa thành công!",
"purchase_error": "Không thể mở khóa. Vui lòng thử lại.",
"purchase_insufficient": "Số dư không đủ. Vui lòng nạp thêm xu.",
"purchase_modal_title": "Mở khóa bộ đề",
"purchase_balance": "Số dư hiện tại:",
"purchase_cost": "Chi phí:",
"purchase_balance_after": "Số dư còn lại:",
"purchase_insufficient_warning": "Số dư không đủ để mở khóa bộ đề này.",
"topup_link": "Nạp xu ngay",
"confirm_unlock": "Xác nhận mở khóa",
```

## Implementation Steps

1. Update `ExamSet` interface in `exam-api.ts` — add `price_credits`, `is_unlocked`
2. Add `PurchaseResult` interface and `purchaseExamSet()` method to `exam-api.ts`
3. Update `exam-setup-page.tsx`:
   a. Add wallet balance state + fetch on mount
   b. Replace access state logic with new 3-state logic
   c. Add price badge to each card
   d. Update button rendering
   e. Add `PurchaseModal` (inline component or import)
   f. Add `handlePurchase` function
4. Update `vi.json` + `en.json` with new exam strings

## Success Criteria

1. Free sets (price_credits=0, is_locked=False) show green "Miễn phí" badge and "Bắt đầu thi" button
2. Admin-locked sets show dim card + lock icon (unchanged behavior)
3. Paid+not-unlocked sets show orange "N xu" badge and "Mở khóa (N xu)" button
4. Clicking "Mở khóa" opens confirmation modal with correct balance display
5. After successful purchase: button becomes "Bắt đầu thi", balance updates
6. Insufficient balance modal shows "Nạp xu ngay" link to /wallet
7. Already-unlocked paid sets show "Bắt đầu thi" button

## Risk Assessment

- **ExamSetHistoryModal**: Currently shown for all `canEnter` sets. After this change, it should only appear for sets where `canStart` is true. Review `handleStart`/`handleSelectExamSet` logic to ensure purchase modal does NOT trigger the history modal. Current code: `handleStart = handleSelectExamSet`. New code: `handleSelectExamSet` called only when `canStart`. No breakage expected.
- **Stale balance**: Balance fetched once on mount. After purchase, we update from the API response `result.new_balance`. After top-up approval, balance won't auto-refresh (acceptable — user must revisit wallet page).
- **TypeScript**: The `ExamSet` interface update is a breaking change if any other file uses `ExamSet` without the new fields. Check: `admin-exams-page.tsx` defines its own local `ExamSet` interface, so no conflict. `exam-api.ts` export is the source of truth.
