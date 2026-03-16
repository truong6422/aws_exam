---
spec_id: phase-03-dashboard-ui
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - PageHeader greeting có visual weight rõ hơn
  - Quick action buttons dùng .btn-primary / .btn-ghost nhất quán
  - Stat cards có layout đẹp hơn, icon area styled
  - Recent Activity section có placeholder state rõ ràng
  - Navbar hiển thị user info đẹp hơn
  - Không đổi routing, store, data fetching
---

# Phase 03 — Dashboard Page UI

## Context Links
- File chính: `apps/frontend/src/pages/dashboard/dashboard-page.tsx`
- Layout: `apps/frontend/src/layouts/app-shell.tsx`
- Navbar: `apps/frontend/src/layouts/navbar.tsx`
- PageHeader component: `apps/frontend/src/components/ui/page-header.tsx`
- Auth store (KHÔNG đổi): `apps/frontend/src/stores/auth-store.ts`

---

## Overview

**Priority:** High — trang chủ chính sau khi login
**Status:** Pending

Dashboard hiện tại có structure ổn (greeting + quick actions + stats grid + recent activity). Cải thiện visual polish từng section.

---

## Current State Analysis

### `dashboard-page.tsx` (58 dòng)

**Section 1 — PageHeader:**
```tsx
<PageHeader
  title={`Welcome, ${displayName}!`}
  subtitle="Track your AWS exam progress and start practising below."
/>
```
→ Render ra `text-2xl font-bold text-gray-900` + `text-sm text-gray-500`
→ Khá plain, không có visual differentiation

**Section 2 — Quick Actions:**
```tsx
<div className="flex gap-3">
  <Link to="/exam/setup" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
    📝 Start Exam
  </Link>
  <Link to="/practice/setup" className="rounded-lg border border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50">
    🎯 Practice Mode
  </Link>
</div>
```
→ Không dùng `.btn-primary`, `.btn-ghost`
→ Emoji prefix, không dùng SVG icon

**Section 3 — Stats Grid:**
```tsx
<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
  {STAT_CARDS.map((s) => (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-2xl">{s.icon}</div>         // emoji
      <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
      <p className="text-xs text-gray-500">{s.label}</p>
    </div>
  ))}
</div>
```
→ `.card` class không được dùng (inline classes)
→ Emoji icon chỉ là text
→ Value placeholder `—` và `—%` trông chưa polish

**Section 4 — Recent Activity:**
```tsx
<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <h2 className="mb-3 text-sm font-semibold text-gray-700">Recent Activity</h2>
  <p className="text-sm text-gray-400 italic">No activity yet — take your first exam!</p>
</div>
```
→ Placeholder text hơi bland
→ Không dùng `.card`

---

## Requirements

### Functional (KHÔNG đổi)
- `useAuthStore` để lấy user — giữ nguyên
- Links tới `/exam/setup`, `/practice/setup` — giữ nguyên
- `STAT_CARDS` data structure — giữ nguyên (placeholder `—`)

### UI Improvements

**Dashboard layout wrapper:**
- Thêm `max-w-5xl` để không stretch quá rộng trên màn hình lớn

**Greeting section:**
- Thêm time-based greeting (Good morning/afternoon/evening) — pure UI logic, không cần API
- Cải thiện subtitle styling

**Quick Actions:**
- Dùng `.btn-primary`, `.btn-ghost` + `as` pattern với Link component hoặc wrap className
- Tăng size nhẹ: `py-2.5 px-5` → `py-2.5 px-6`
- Thêm SVG icon nhỏ bên cạnh text (tái dùng SVG từ sidebar)
- Thêm wrapper section với title: "Quick Actions"

**Stat Cards:**
- Dùng `.card` class
- Icon area: background circle với màu tương ứng từng stat
- Value placeholder: style khác để rõ là "chưa có data" (text-gray-300 thay text-gray-900)
- Label: giữ `text-xs text-gray-500`
- Thêm `hover:shadow-card-hover` transition

**Recent Activity:**
- Dùng `.card`
- Empty state: thêm icon + text hướng dẫn action
- Tiêu đề section: dùng `.card-title` class

---

## Implementation Steps

### Step 1 — Dashboard wrapper + greeting logic

```tsx
// Thêm time-based greeting utility (inline, không tách file vì đơn giản)
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Trong component:
const greeting = `${getGreeting()}, ${displayName}!`

// Wrapper
<div className="mx-auto max-w-5xl space-y-6">
```

### Step 2 — Quick Actions section

```tsx
<section>
  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
    Quick Actions
  </h2>
  <div className="flex flex-wrap gap-3">
    <Link to="/exam/setup" className="btn-primary gap-2 py-2.5 px-6">
      {/* SVG clipboard icon */}
      <IconClipboard className="h-4 w-4" />
      Start Exam
    </Link>
    <Link to="/practice/setup" className="btn-ghost gap-2 py-2.5 px-6">
      {/* SVG target icon */}
      <IconTarget className="h-4 w-4" />
      Practice Mode
    </Link>
  </div>
</section>
```

**Lưu ý:** `Link` từ react-router-dom không phải `button`, nên cần thêm trực tiếp className vào Link. `.btn-primary` và `.btn-ghost` dùng `inline-flex` nên sẽ work.

### Step 3 — Stat Cards

```tsx
// Màu icon background theo từng stat
const STAT_CARDS = [
  { label: 'Exams Taken',   value: '—', iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   Icon: IconClipboard },
  { label: 'Avg. Score',    value: '—%', iconBg: 'bg-green-50',  iconColor: 'text-green-500',  Icon: IconTarget    },
  { label: 'Pass Rate',     value: '—%', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', Icon: IconChart     },
  { label: 'Practice Sets', value: '—', iconBg: 'bg-amber-50',  iconColor: 'text-amber-500',  Icon: IconHistory   },
]

// Card markup:
<div className="card p-5 transition hover:shadow-card-hover">
  <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg', s.iconBg)}>
    <s.Icon className={clsx('h-5 w-5', s.iconColor)} />
  </div>
  <p className="mt-3 text-2xl font-bold text-gray-300">{s.value}</p>  {/* gray-300 = placeholder */}
  <p className="mt-0.5 text-xs font-medium text-gray-500">{s.label}</p>
</div>
```

### Step 4 — Recent Activity empty state

```tsx
<section className="card p-5">
  <h2 className="card-title mb-4">Recent Activity</h2>
  {/* Empty state */}
  <div className="flex flex-col items-center py-8 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
      <IconHistory className="h-6 w-6 text-gray-400" />
    </div>
    <p className="mt-3 text-sm font-medium text-gray-500">No activity yet</p>
    <p className="mt-1 text-xs text-gray-400">Complete an exam to see your history here.</p>
    <Link to="/exam/setup" className="btn-primary mt-4 py-1.5 px-4 text-xs">
      Take your first exam
    </Link>
  </div>
</section>
```

### Step 5 — Navbar minor improvement

`navbar.tsx` — thêm page title hoặc breadcrumb ở giữa/trái (optional):
```tsx
// Hiện tại navbar chỉ có: toggle button | user info
// Cải thiện: toggle button | [app name text trên mobile] | user info
// Thêm role badge nếu user là admin
{user?.roles?.includes('admin') && (
  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
    Admin
  </span>
)}
```

---

## Related Code Files

**Modify:**
- `apps/frontend/src/pages/dashboard/dashboard-page.tsx`
- `apps/frontend/src/layouts/navbar.tsx` (minor — admin badge)

**Reference (KHÔNG modify):**
- `apps/frontend/src/layouts/sidebar.tsx` — lấy SVG icon components
- `apps/frontend/src/layouts/app-shell.tsx` — giữ nguyên

---

## Todo List

- [ ] Thêm `getGreeting()` helper và cập nhật title
- [ ] Cập nhật `STAT_CARDS` array với SVG icons thay emoji
- [ ] Refactor quick actions: dùng `.btn-primary`, `.btn-ghost` + SVG icons
- [ ] Refactor stat cards: dùng `.card`, icon circle, placeholder styling
- [ ] Refactor recent activity: dùng `.card`, empty state đẹp hơn
- [ ] Cập nhật `navbar.tsx`: thêm admin badge (optional)
- [ ] Visual check: `max-w-5xl` wrapper không break layout trong app-shell

---

## Success Criteria

- Dashboard trông professional, có section separation rõ ràng
- Quick actions dùng design system buttons nhất quán
- Stat cards có icon visual, empty state rõ ràng (gray placeholder)
- Recent activity empty state có actionable CTA
- Tất cả data/behavior giữ nguyên (auth store, links)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SVG icons cho stat cards chưa có — cần copy từ sidebar | Low | Sidebar đã có đủ: `IconClipboard`, `IconTarget`, `IconChart`, `IconHistory` — extract ra shared |
| `Link` component với className từ CSS class `.btn-primary` | Low | `.btn-primary` dùng `@apply inline-flex` → work với any element |
| `max-w-5xl` wrapper có thể conflict với existing padding | Low | `app-shell.tsx` dùng `p-6` trong main, `max-w-5xl` là inner constraint |
