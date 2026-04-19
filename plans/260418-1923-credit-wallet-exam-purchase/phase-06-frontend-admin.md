---
spec_id: 260418-1923-credit-wallet-exam-purchase-phase-06
status: pending
acceptance_criteria:
  - Admin can view all pending TopUpRequests in a dedicated page at /admin/wallet
  - Admin can approve a TopUpRequest: user's wallet balance is credited and request status changes to 'approved'
  - Admin can reject a TopUpRequest with an optional admin_note
  - Admin can set price_credits on any ExamSet from admin-exams-page; 0 means "free"
  - All new admin UI strings are in vi.json under wallet and admin keys
  - New wallet nav item appears under ADMIN_ITEMS in sidebar for is_staff users
  - No TypeScript errors; new pages match existing admin UI style conventions
---

# Phase 06 — Frontend: Admin Wallet & Exam Price Config

## Requirements

1. New admin page `admin-wallet-page.tsx` — list pending top-up requests and allow approve/reject.
2. Update `admin-exams-page.tsx` — add inline `price_credits` editor per exam set.
3. Update `admin-api.ts` — add wallet admin endpoints.
4. Update `sidebar.tsx` — add "Ví xu" nav item under ADMIN_ITEMS.
5. Update router — add `/admin/wallet` route.
6. Update `vi.json` — add all new admin wallet strings.

## Architecture

### Admin Wallet Flow

```
admin-wallet-page.tsx
  ├── useEffect → adminApi.getTopUpRequests({ status: 'pending' })
  ├── Table: [user, email, txn_code, amount_credits, amount_vnd, created_at, actions]
  ├── ApproveButton → adminApi.approveTopUp(id) → optimistic remove from list
  └── RejectModal → adminApi.rejectTopUp(id, { admin_note }) → optimistic remove
```

### Exam Price Config Flow

```
admin-exams-page.tsx (extended)
  ├── ExamSet local type: add price_credits field
  ├── PriceEditor per row: click-to-edit inline number input
  ├── onSave → adminApi.updateExamSet(setId, { price_credits })
  └── optimistic update local state
```

## Implementation Steps

### Step 1 — Extend `admin-api.ts`

Add the following types and methods to the existing `adminApi` object.

New types to add:

```typescript
export interface TopUpRequestAdmin {
  id: number
  user_id: number
  user_email: string
  user_name: string
  amount_credits: number
  amount_vnd: number
  transaction_code: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string
  created_at: string
  approved_at: string | null
}
```

New API methods to add inside `adminApi`:

```typescript
getTopUpRequests: (params?: { status?: string }) => {
  const qs = params?.status ? `?status=${params.status}` : ''
  return apiClient.list<TopUpRequestAdmin>(`/wallet/admin/topup-requests/${qs}`)
},

approveTopUp: (requestId: number) =>
  apiClient.post<TopUpRequestAdmin>(`/wallet/admin/topup-requests/${requestId}/approve/`, {}),

rejectTopUp: (requestId: number, data: { admin_note?: string }) =>
  apiClient.post<TopUpRequestAdmin>(`/wallet/admin/topup-requests/${requestId}/reject/`, data),
```

File: `apps/frontend/src/services/admin-api.ts`

### Step 2 — Create `admin-wallet-page.tsx`

File path: `apps/frontend/src/pages/admin/admin-wallet-page.tsx`

Component structure:

```typescript
export default function AdminWalletPage() {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const [requests, setRequests] = useState<TopUpRequestAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<{
    id: number
    adminNote: string
  } | null>(null)
  const [processing, setProcessing] = useState<number | null>(null)
  // ...
}
```

**Table columns** (matching admin-users-page.tsx header style):
- Người dùng (user_name / user_email)
- Mã giao dịch (transaction_code — monospace, copyable)
- Số xu (amount_credits)
- Số tiền VND (amount_vnd formatted with `.toLocaleString('vi-VN')`)
- Ngày yêu cầu (created_at formatted with `new Date().toLocaleDateString('vi-VN')`)
- Hành động (approve button + reject button)

**handleApprove(id)**:
1. `setProcessing(id)`
2. `await adminApi.approveTopUp(id)`
3. Remove request from `requests` state optimistically
4. `addToast({ type: 'success', message: t('admin.wallet.approve_success') })`
5. In catch: `addToast({ type: 'error', message: t('admin.wallet.approve_error') })`
6. `setProcessing(null)` in finally

**handleReject(id, adminNote)**:
1. `setRejectModal(null)`
2. `setProcessing(id)`
3. `await adminApi.rejectTopUp(id, { admin_note: adminNote })`
4. Remove request from `requests` state
5. `addToast({ type: 'success', message: t('admin.wallet.reject_success') })`
6. Catch/finally same pattern

**RejectModal** (inline, no separate file needed):
- Simple overlay with dark background
- Textarea for admin_note (optional)
- Cancel + Confirm buttons
- Matches modal style used in `ExamSetHistoryModal`

**Empty state**: when no pending requests, show centered message: `t('admin.wallet.no_pending_requests')`

**Tab bar** (optional enhancement, mark as low priority): "Đang chờ" / "Đã xử lý" tabs that re-fetch with `?status=pending` or `?status=approved,rejected`.

Style guide — copy these patterns from `admin-users-page.tsx`:
- Outer container: `{ display: 'flex', flexDirection: 'column', gap: '24px' }`
- Table wrapper: `{ background: '#272729', borderRadius: '12px', overflow: 'hidden' }`
- `tableHeaderStyle` and `cellStyle` matching existing admin pages
- Action buttons use inline style (no external CSS classes for variant colors)

Approve button style: `background: '#34c759', color: '#fff'`
Reject button style: `background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)'`

### Step 3 — Update `admin-exams-page.tsx`

**Extend local ExamSet interface**:
```typescript
interface ExamSet {
  id: number
  name: string
  is_locked: boolean
  question_count: number
  price_credits: number   // ADD THIS
}
```

**Add price editing state**:
```typescript
const [editingPrice, setEditingPrice] = useState<number | null>(null)
const [priceInput, setPriceInput] = useState<string>('')
const [savingPrice, setSavingPrice] = useState<number | null>(null)
```

**Add table column "Giá (xu)"** between Questions and Status columns.

**Inline price cell per set**:
```tsx
<td style={{ ...cellStyle, textAlign: 'center' }}>
  {editingPrice === set.id ? (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
      <input
        type="number"
        min="0"
        value={priceInput}
        onChange={(e) => setPriceInput(e.target.value)}
        style={{
          width: '70px', padding: '4px 8px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '6px', color: '#fff', fontSize: '12px'
        }}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSavePrice(set.id, cert.id)
          if (e.key === 'Escape') setEditingPrice(null)
        }}
      />
      <button onClick={() => handleSavePrice(set.id, cert.id)}
        disabled={savingPrice === set.id}
        style={{ /* small green save button */ }}>
        {savingPrice === set.id ? '...' : '✓'}
      </button>
      <button onClick={() => setEditingPrice(null)}
        style={{ /* small grey cancel button */ }}>
        ✕
      </button>
    </div>
  ) : (
    <button
      onClick={() => { setEditingPrice(set.id); setPriceInput(String(set.price_credits)) }}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: set.price_credits === 0 ? '#34c759' : '#ff9f0a',
        fontSize: '12px', fontWeight: 600, padding: '4px 8px',
        borderRadius: '6px',
        border: '1px solid ' + (set.price_credits === 0 ? 'rgba(52,199,89,0.2)' : 'rgba(255,159,10,0.2)')
      }}
    >
      {set.price_credits === 0 ? t('admin.wallet.price_free') : `${set.price_credits} xu`}
    </button>
  )}
</td>
```

**handleSavePrice(setId, certId)**:
```typescript
const handleSavePrice = async (setId: number, certId: number) => {
  const parsed = parseInt(priceInput, 10)
  if (isNaN(parsed) || parsed < 0) {
    addToast({ type: 'error', message: t('admin.wallet.price_invalid') })
    return
  }
  setSavingPrice(setId)
  try {
    await adminApi.updateExamSet(setId, { price_credits: parsed })
    setExamSets(prev => ({
      ...prev,
      [certId]: prev[certId].map(s => s.id === setId ? { ...s, price_credits: parsed } : s)
    }))
    setEditingPrice(null)
    addToast({ type: 'success', message: t('admin.wallet.price_saved') })
  } catch {
    addToast({ type: 'error', message: t('admin.wallet.price_save_error') })
  } finally {
    setSavingPrice(null)
  }
}
```

Note: `adminApi.updateExamSet` already accepts `Partial<{is_locked, price_credits}>` since it's typed as `data: { is_locked: boolean }`. The type signature needs broadening to `data: { is_locked?: boolean; price_credits?: number }` in `admin-api.ts`.

### Step 4 — Update `sidebar.tsx`

Add a WalletIcon SVG component (coin/credit card icon style matching existing icons):

```tsx
const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="10" r="1" fill="currentColor" />
  </svg>
)
```

Add to `ADMIN_ITEMS`:
```typescript
{ labelKey: 'nav.wallet', to: '/admin/wallet', icon: <WalletIcon /> },
```

Insert after the existing exam item so the order is:
1. Quản trị (admin/dashboard)
2. Thi thử (admin/exams)
3. Ví xu (admin/wallet)  ← new
4. Người dùng (admin/users)
5. Nhập dữ liệu (admin/import)

### Step 5 — Update Router

File: `apps/frontend/src/App.tsx` (or wherever admin routes are registered — confirm by checking the router file)

Add route:
```tsx
<Route path="/admin/wallet" element={<AdminWalletPage />} />
```

Import:
```typescript
import AdminWalletPage from '@/pages/admin/admin-wallet-page'
```

The route must be protected by the same admin guard that wraps `/admin/dashboard`, `/admin/exams`, etc.

### Step 6 — Update `vi.json`

Add to `nav` section:
```json
"wallet": "Ví xu"
```

Add to `admin` section:
```json
"wallet": {
  "page_title": "Quản lý nạp xu",
  "page_subtitle": "Duyệt các yêu cầu nạp xu từ học viên",
  "no_pending_requests": "Không có yêu cầu nạp xu nào đang chờ xử lý.",
  "table_user": "Người dùng",
  "table_txn_code": "Mã giao dịch",
  "table_credits": "Số xu",
  "table_vnd": "Số tiền (VNĐ)",
  "table_date": "Ngày yêu cầu",
  "table_actions": "Hành động",
  "approve_btn": "Duyệt",
  "reject_btn": "Từ chối",
  "approve_success": "Đã duyệt thành công và cộng xu vào tài khoản.",
  "approve_error": "Không thể duyệt yêu cầu này.",
  "reject_success": "Đã từ chối yêu cầu.",
  "reject_error": "Không thể từ chối yêu cầu.",
  "reject_modal_title": "Từ chối yêu cầu nạp xu",
  "reject_modal_note_label": "Ghi chú (không bắt buộc)",
  "reject_modal_note_placeholder": "Lý do từ chối...",
  "reject_modal_confirm": "Xác nhận từ chối",
  "price_free": "Miễn phí",
  "price_invalid": "Giá không hợp lệ (phải là số không âm).",
  "price_saved": "Đã lưu giá bộ đề.",
  "price_save_error": "Không thể lưu giá. Thử lại sau.",
  "price_column_header": "Giá (xu)"
}
```

## Component Tree

```
/admin/wallet
└── AdminWalletPage
    ├── PageHeader (title, subtitle)
    ├── <table> pending requests
    │   ├── <thead> [user, txn_code, credits, vnd, date, actions]
    │   └── <tbody>
    │       ├── loading row (colSpan=6)
    │       ├── empty row (colSpan=6)
    │       └── TopUpRequest rows
    │           ├── user info cell (name + email stacked)
    │           ├── transaction_code cell (monospace)
    │           ├── amount_credits cell
    │           ├── amount_vnd cell (formatted)
    │           ├── created_at cell
    │           └── actions cell (Approve + Reject buttons)
    └── RejectModal (conditional render)
        ├── overlay div
        ├── modal card
        │   ├── title
        │   ├── <textarea> admin_note
        │   └── [Cancel, Confirm] buttons
        └── (no portal needed — simple conditional render)
```

## State Requirements

```typescript
// admin-wallet-page.tsx state
requests: TopUpRequestAdmin[]      // all fetched requests
loading: boolean                    // initial load
processing: number | null           // id of request being approved/rejected
rejectModal: { id: number; adminNote: string } | null

// admin-exams-page.tsx additional state
editingPrice: number | null         // set.id being edited
priceInput: string                  // controlled input value
savingPrice: number | null          // set.id being saved
```

## Success Criteria

1. Navigate to `/admin/wallet` → table shows pending requests or empty state
2. Click "Duyệt" on a request → row disappears, success toast shown, backend credited user
3. Click "Từ chối" → modal appears, enter note, click confirm → row disappears, reject toast
4. Navigate to `/admin/exams` → price column shows green "Miễn phí" or orange "N xu" badge
5. Click price badge → inline input appears pre-filled with current value
6. Enter new value, press Enter → saves and badge updates immediately
7. Press Escape → cancels without saving
8. "Ví xu" appears in admin sidebar

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend returns 403 on wallet admin endpoints for non-staff | High | Endpoints already behind `IsAdminUser`; frontend shows error toast |
| `adminApi.updateExamSet` type too narrow (only `is_locked`) | Medium | Broaden type signature to union `{ is_locked?: boolean; price_credits?: number }` |
| Reject note textarea empty string sent to backend | Low | Backend `admin_note` is `blank=True`; empty string is valid |
| Stale request list (admin A approves while admin B views) | Low | Pull-to-refresh not needed at MVP; page reload shows fresh state |
| `/admin/wallet` route not protected | High | Wrap in same admin guard component as other admin routes |
