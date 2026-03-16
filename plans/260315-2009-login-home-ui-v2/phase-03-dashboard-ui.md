---
spec_id: phase-03-dashboard-ui
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Quick action buttons dùng `.btn-primary` và `.btn-ghost`
  - Stat cards dùng `.card` class
  - Recent Activity section dùng `.card` class
  - Typography/spacing rõ ràng, nhất quán
  - Không đổi data, routing, hay store calls
  - typecheck pass
---

# Phase 03 — Dashboard Page UI

## Context Links
- Source: `apps/frontend/src/pages/dashboard/dashboard-page.tsx`
- Global CSS: `apps/frontend/src/index.css` (`.btn-primary`, `.btn-ghost`, `.card`, `.card-title`)
- Component: `apps/frontend/src/components/ui/page-header.tsx`

## Overview

**Priority:** High
**Status:** Pending
**Description:** Refactor dashboard để tận dụng global CSS classes, cải thiện stat card layout, và visual hierarchy tổng thể. Không đổi data logic hay routing.

## Current State Analysis

```tsx
// dashboard-page.tsx (58 lines) — vấn đề:

// Quick actions: inline Tailwind thay vì .btn-primary / .btn-ghost
<Link className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
<Link className="rounded-lg border border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50">

// Stat cards: inline thay vì .card
<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

// Recent Activity: inline thay vì .card
<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <h2 className="mb-3 text-sm font-semibold text-gray-700">Recent Activity</h2>
```

**Vấn đề cụ thể:**
1. Không dùng global classes → inconsistency với phần còn lại của app
2. Stat card: icon (emoji) và value nằm thẳng đứng — thiếu visual balance
3. Stat card value `text-2xl font-bold` bên cạnh icon `text-2xl` — kích thước giống nhau, icon không nổi bật
4. `PageHeader` đang dùng đúng — giữ nguyên
5. Quick actions container: `flex gap-3` — ổn nhưng button không có transition/scale

## Requirements

### Functional (giữ nguyên hoàn toàn)
- `useAuthStore` → `displayName` — không đổi
- `STAT_CARDS` array — không đổi data
- Links `/exam/setup`, `/practice/setup` — không đổi
- `<PageHeader>` — giữ nguyên

### UI Changes

**Quick action buttons:**
1. "Start Exam" Link: thay inline → `className="btn-primary"` + giữ emoji prefix
2. "Practice Mode" Link: thay inline → `className="btn-ghost"` + giữ emoji prefix
   *(`.btn-ghost` = `border border-gray-300 bg-white text-gray-700` — cần override thành brand color)*
   → Thay vì dùng `.btn-ghost` thuần, dùng custom class: `btn-ghost border-brand-600 text-brand-600 hover:bg-brand-50`
   → Hoặc đơn giản giữ inline classes nhưng thêm `transition active:scale-[.98]`
   → **Quyết định**: dùng `.btn-primary` cho Exam, tạo thêm 1 biến thể outline trong index.css tên `.btn-outline` cho Practice, hoặc giữ inline nhưng thêm `transition active:scale-[.98]`
   → **KISS approach**: chỉ thêm `transition active:scale-[.98]` vào cả 2 buttons — không tạo class mới (YAGNI)

**Stat cards:**
1. Wrapper: `className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"` → `className="card p-5"`
2. Layout bên trong card: thay vì icon trên value dưới, dùng `flex items-start justify-between`:
   ```
   [value + label (left)]  [icon large (right)]
   ```
3. Icon: `text-2xl` → `text-3xl text-brand-400` (subtle brand color)
4. Value: `text-2xl font-bold text-gray-900` → giữ, thêm `leading-none`
5. Label: `text-xs text-gray-500` → giữ, thêm `mt-1`

**Recent Activity section:**
1. Wrapper: thay inline → `className="card p-5"`
2. Title `h2`: thay inline → `className="card-title mb-3"`
3. Empty state text: `text-sm text-gray-400 italic` — giữ nguyên

**Overall spacing:**
- `space-y-6` → `space-y-6` (giữ)
- Stats grid: `grid-cols-2 gap-4 sm:grid-cols-4` — giữ nguyên

## Architecture

```
dashboard-page.tsx
├── <PageHeader> (unchanged)
├── Quick actions <div className="flex gap-3 flex-wrap">
│   ├── Start Exam Link       ← MODIFY: use .btn-primary + transition
│   └── Practice Mode Link    ← MODIFY: keep brand outline + add transition/scale
├── Stats grid (2→4 cols)
│   └── {STAT_CARDS.map()} → <div className="card p-5">
│       ├── flex row: [value+label] [icon]   ← MODIFY: layout flip
│       └── (unchanged data)
└── Recent Activity <div className="card p-5">
    ├── <h2 className="card-title mb-3">     ← MODIFY: use .card-title
    └── empty state <p> (unchanged)
```

## Related Code Files

**Modify:**
- `apps/frontend/src/pages/dashboard/dashboard-page.tsx`

**Read-only (reference):**
- `apps/frontend/src/index.css` — `.card`, `.card-title`, `.btn-primary`, `.btn-ghost`
- `apps/frontend/src/components/ui/page-header.tsx` — không modify

## Implementation Steps

1. Read `dashboard-page.tsx`
2. **Quick actions**:
   - Start Exam: `className="btn-primary"`
   - Practice Mode: giữ brand outline classes, thêm `transition active:scale-[.98]`
   - Thêm `flex-wrap` vào container cho mobile
3. **Stat cards**:
   - Outer div: `className="card p-5"`
   - Inner layout: `<div className="flex items-start justify-between">`
     - Left: `<div><p className="text-2xl font-bold leading-none text-gray-900">{s.value}</p><p className="mt-1 text-xs text-gray-500">{s.label}</p></div>`
     - Right: `<span className="text-3xl text-brand-300" aria-hidden="true">{s.icon}</span>`
4. **Recent Activity**:
   - Outer div: `className="card p-5"`
   - `h2`: `className="card-title mb-3"`
5. Run `npx tsc --noEmit`

## Todo List

- [ ] Refactor quick action buttons — `.btn-primary`, outline + transition
- [ ] Refactor stat cards — `.card`, layout flip (value-label left, icon right)
- [ ] Refactor Recent Activity — `.card`, `.card-title`
- [ ] Run typecheck

## Success Criteria

- Dashboard dùng consistent global CSS classes
- Stat cards layout cân đối, icon không đè lên value
- Recent Activity trông như 1 section card thực sự
- Không có TS errors, không break routing

## Risk Assessment

- **Very low risk**: chỉ className và layout changes bên trong map()
- Stat card layout flip (flex row) không ảnh hưởng data hay state

## Next Steps

→ Phase 04: Verify (lint + typecheck + build)
