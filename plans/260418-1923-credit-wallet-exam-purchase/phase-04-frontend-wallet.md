---
spec_id: 260418-1923-credit-wallet-exam-purchase-phase-04
status: pending
phase: 04
title: Frontend Wallet Page + Service
depends_on: phase-02 (API contract)
acceptance_criteria:
  - wallet-api.ts service created with all wallet endpoints
  - /wallet route shows balance and transaction history
  - "Nạp xu" flow: select amount → show telegram template + copy button
  - Wallet link in sidebar (coin icon, above Admin section)
  - Balance shown in sidebar when expanded
  - i18n strings added to vi.json and en.json
---

# Phase 04 — Frontend Wallet Page + Service

## Requirements

Create the user-facing wallet experience: view balance, view transaction history, initiate top-up request.

## Component Tree

```
/wallet
└── WalletPage
    ├── WalletBalanceCard           (balance display, "Nạp xu" button)
    ├── TopUpModal (conditional)    (amount input → show TG template)
    │   ├── amount selector (50/100/200/500 xu presets + custom)
    │   ├── telegram template display (monospace, copy button)
    │   └── "Open Telegram" button
    └── TransactionHistoryTable     (list of CreditTransaction)
```

## New File: `apps/frontend/src/services/wallet-api.ts`

```typescript
import { apiClient } from '@/lib/api-client'

export interface CreditTransaction {
  id: number
  delta: number
  type: 'topup' | 'purchase' | 'admin_adjust' | 'refund'
  ref_id: string
  note: string
  created_at: string
}

export interface WalletData {
  balance: number
  transactions: CreditTransaction[]
}

export interface TopUpRequest {
  id: number
  transaction_code: string
  amount_credits: number
  amount_vnd: number
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string
  created_at: string
}

export interface TopUpCreateResponse {
  id: number
  transaction_code: string
  amount_credits: number
  amount_vnd: number
  status: string
  telegram_template: string
  admin_telegram_url: string
}

export const walletApi = {
  getWallet: () =>
    apiClient.get<WalletData>('/wallet/'),

  createTopUpRequest: (amount_credits: number) =>
    apiClient.post<TopUpCreateResponse>('/wallet/topup/', { amount_credits }),

  getTopUpHistory: () =>
    apiClient.list<TopUpRequest>('/wallet/topup-requests/'),
}
```

## New File: `apps/frontend/src/pages/wallet/wallet-page.tsx`

### State
```typescript
const [wallet, setWallet] = useState<WalletData | null>(null)
const [loading, setLoading] = useState(true)
const [showTopUpModal, setShowTopUpModal] = useState(false)
const [topUpAmount, setTopUpAmount] = useState<number>(100)
const [customAmount, setCustomAmount] = useState('')
const [topUpResult, setTopUpResult] = useState<TopUpCreateResponse | null>(null)
const [submittingTopUp, setSubmittingTopUp] = useState(false)
const [copied, setCopied] = useState(false)
```

### Key behaviors
1. On mount: fetch wallet data, show balance + transactions
2. "Nạp xu" button → open modal with amount selector
3. Amount presets: [50, 100, 200, 500] xu chips; also a number input for custom
4. On submit in modal (Step 1): call `walletApi.createTopUpRequest(amount)` → set `topUpResult`
5. Modal transitions to Step 2: show `topUpResult.telegram_template` in a `<pre>` block
6. "Copy" button: `navigator.clipboard.writeText(topUpResult.telegram_template)` → show checkmark 1s
7. "Open Telegram" button: `window.open(topUpResult.admin_telegram_url, '_blank')` if URL is set
8. Close modal: reset to Step 1
9. Transaction table: show delta with `+` prefix for positive, red for negative. Show type badge.

### TopUp Modal flow
```
Step 1: Amount Selection
  - Title: "Nạp xu vào tài khoản"
  - Subtitle: "1 xu = {vnd_per_credit} VNĐ" (compute from topUpResult after first call, or show static)
  - Amount chips: 50, 100, 200, 500
  - Custom amount input
  - "Tiếp tục" button → submits

Step 2: Telegram Template
  - Title: "Gửi thông tin cho Admin"
  - Instruction: "Sao chép nội dung bên dưới và gửi cho Admin qua Telegram"
  - <pre> block with telegram_template (monospace)
  - "Sao chép" button (copy to clipboard)
  - "Mở Telegram" button (if admin_telegram_url is set)
  - "Đóng" button
  - Note: "Xu sẽ được cộng sau khi Admin xác nhận thanh toán"
```

### Transaction table columns
| Column | Field | Notes |
|--------|-------|-------|
| Thời gian | created_at | format: dd/mm/yyyy HH:mm |
| Loại | type | badge: topup=green, purchase=orange, admin_adjust=blue, refund=purple |
| Số xu | delta | "+100" green / "-50" red |
| Ghi chú | note | truncate 60 chars |

## Router Update: `apps/frontend/src/router/routes.tsx`

Add to protected app routes under AppShell:
```typescript
import WalletPage from '@/pages/wallet/wallet-page'

// In children array:
{ path: '/wallet', element: <WalletPage /> },
```

## Sidebar Update: `apps/frontend/src/layouts/sidebar.tsx`

Add wallet nav item to `NAV_ITEMS` array:
```typescript
const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
)

// Add to NAV_ITEMS:
{ labelKey: 'nav.wallet', to: '/wallet', icon: <WalletIcon /> },
```

Place it after 'nav.analytics' (before admin section).

## i18n Updates

### `vi.json` — add `wallet` key:
```json
"wallet": {
  "title": "Ví xu",
  "subtitle": "Quản lý số xu và lịch sử giao dịch",
  "balance_label": "Số dư hiện tại",
  "unit": "xu",
  "topup_button": "Nạp xu",
  "topup_modal_title": "Nạp xu vào tài khoản",
  "topup_step2_title": "Gửi thông tin cho Admin",
  "topup_instruction": "Sao chép nội dung bên dưới và gửi cho Admin qua Telegram",
  "copy_button": "Sao chép",
  "copied": "Đã sao chép!",
  "open_telegram": "Mở Telegram",
  "close": "Đóng",
  "topup_note": "Xu sẽ được cộng sau khi Admin xác nhận thanh toán",
  "continue_button": "Tiếp tục",
  "amount_label": "Số xu muốn nạp",
  "transaction_history": "Lịch sử giao dịch",
  "no_transactions": "Chưa có giao dịch nào.",
  "tx_time": "Thời gian",
  "tx_type": "Loại",
  "tx_amount": "Số xu",
  "tx_note": "Ghi chú",
  "type_topup": "Nạp xu",
  "type_purchase": "Mua đề",
  "type_admin_adjust": "Điều chỉnh",
  "type_refund": "Hoàn tiền",
  "error_load": "Không thể tải thông tin ví.",
  "error_topup": "Không thể tạo yêu cầu nạp xu.",
  "topup_history_title": "Lịch sử nạp xu",
  "topup_pending": "Chờ xác nhận",
  "topup_approved": "Đã duyệt",
  "topup_rejected": "Bị từ chối"
}
```

Add `"wallet": "Ví xu"` to `nav` section.

### `en.json` — add equivalent English strings.

## Implementation Steps

1. Create `apps/frontend/src/services/wallet-api.ts`
2. Create `apps/frontend/src/pages/wallet/` directory (just create the file, directory is implied)
3. Write `apps/frontend/src/pages/wallet/wallet-page.tsx` — balance card + topup modal + transaction table
4. Update `apps/frontend/src/router/routes.tsx` — add `/wallet` route
5. Update `apps/frontend/src/layouts/sidebar.tsx` — add WalletIcon + nav item
6. Update `apps/frontend/src/i18n/locales/vi.json` — add wallet section
7. Update `apps/frontend/src/i18n/locales/en.json` — add wallet section

## Success Criteria

1. Navigating to `/wallet` shows balance (0 xu for new user)
2. "Nạp xu" button opens modal with amount chips
3. Submitting amount shows a formatted telegram template
4. Copy button copies text to clipboard
5. Transaction history shows empty state message for new users
6. Wallet link appears in sidebar (collapsed: icon only, expanded: "Ví xu")

## Risk Assessment

- **Clipboard API**: `navigator.clipboard.writeText` requires HTTPS or localhost. Fallback: `document.execCommand('copy')` for non-secure contexts. Add try-catch.
- **VND formatting**: Use `Intl.NumberFormat('vi-VN').format(amount_vnd)` for proper comma formatting.
- **Modal state reset**: When user closes modal mid-flow (Step 2), reset `topUpResult` to null so next open starts at Step 1.
