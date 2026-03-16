---
spec_id: phase-04-shared-ui-components
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - SVG icons được extract ra file riêng, tái dùng bởi dashboard và sidebar
  - PageHeader có variant option (default vs prominent)
  - index.css không có duplicate/dead styles
---

# Phase 04 — Shared UI Components Cleanup

## Context Links
- Icons hiện tại: `apps/frontend/src/layouts/sidebar.tsx` (inline, 11 icons)
- PageHeader: `apps/frontend/src/components/ui/page-header.tsx`
- Global CSS: `apps/frontend/src/index.css`

---

## Overview

**Priority:** Low-Medium — đây là refactor nhỏ để giảm duplication
**Status:** Pending
**Dependency:** Cần hoàn thành Phase 01-03 trước để biết icons nào cần dùng

---

## Current State Analysis

**Vấn đề 1 — Icon duplication:**
- Phase 03 (Dashboard) cần `IconClipboard`, `IconTarget`, `IconChart`, `IconHistory`
- Hiện các icons này chỉ tồn tại bên trong `sidebar.tsx` (scoped, không export)
- Nếu dashboard copy lại → vi phạm DRY

**Vấn đề 2 — PageHeader quá đơn giản:**
```tsx
// Hiện tại: chỉ có 1 style duy nhất
<h1 className="text-2xl font-bold text-gray-900">{title}</h1>
```
- Dashboard greeting cần visual weight lớn hơn (text-3xl, tên user nổi bật)
- Admin/inner pages cần heading nhỏ hơn với breadcrumb context

---

## Requirements

### Icon Component File

Tách các SVG icons thường dùng ra `components/ui/icons.tsx`:
- Scope: Chỉ icons đang cần trong scope UI refresh này
- YAGNI: Không tạo icon library đầy đủ — chỉ extract những icon đang bị duplicate

**Icons cần extract:**
- `IconCloud` — dùng ở auth-layout + landing
- `IconClipboard` — dùng ở sidebar + dashboard quick action + stat card
- `IconTarget` — dùng ở sidebar + dashboard quick action + stat card
- `IconChart` — dùng ở sidebar + dashboard stat card
- `IconHistory` — dùng ở sidebar + dashboard stat card

**Icons GIỮ NGUYÊN trong sidebar.tsx (chỉ dùng ở sidebar):**
- `IconHome`, `IconSettings`, `IconUsers`, `IconQuestion`, `IconUpload`, `IconLogout`

### PageHeader Enhancement

Thêm `variant` prop nhỏ:
```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  variant?: 'default' | 'hero'  // default = hiện tại, hero = lớn hơn cho dashboard greeting
}
```

- `default`: giữ nguyên `text-2xl font-bold`
- `hero`: `text-3xl font-bold` với subtitle `text-base`

---

## Implementation Steps

### Step 1 — Tạo `components/ui/icons.tsx`

```tsx
// apps/frontend/src/components/ui/icons.tsx
// Shared SVG icon components — only icons used across multiple modules

interface IconProps {
  className?: string
}

export function IconCloud({ className }: IconProps) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  )
}

export function IconClipboard({ className }: IconProps) { ... }
export function IconTarget({ className }: IconProps) { ... }
export function IconChart({ className }: IconProps) { ... }
export function IconHistory({ className }: IconProps) { ... }
```

### Step 2 — Update `sidebar.tsx`

```tsx
// Import từ shared file thay vì define inline
import { IconClipboard, IconTarget, IconChart, IconHistory } from '@/components/ui/icons'
// Giữ các icons chỉ dùng trong sidebar: IconHome, IconSettings, ...
```

### Step 3 — Update `page-header.tsx`

```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  variant?: 'default' | 'hero'
}

export default function PageHeader({ title, subtitle, variant = 'default' }: PageHeaderProps) {
  const isHero = variant === 'hero'
  return (
    <div>
      <h1 className={isHero ? 'text-3xl font-bold text-gray-900' : 'text-2xl font-bold text-gray-900'}>
        {title}
      </h1>
      {subtitle && (
        <p className={clsx('mt-1 text-gray-500', isHero ? 'text-base' : 'text-sm')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
```

### Step 4 — Update Dashboard to use hero variant

```tsx
<PageHeader
  variant="hero"
  title={`${getGreeting()}, ${displayName}!`}
  subtitle="Track your AWS exam progress and start practising below."
/>
```

---

## Related Code Files

**Create:**
- `apps/frontend/src/components/ui/icons.tsx`

**Modify:**
- `apps/frontend/src/layouts/sidebar.tsx` (import icons thay vì inline)
- `apps/frontend/src/components/ui/page-header.tsx` (thêm variant prop)
- `apps/frontend/src/pages/dashboard/dashboard-page.tsx` (dùng variant="hero")

---

## Todo List

- [ ] Tạo `components/ui/icons.tsx` với 5 shared icons
- [ ] Update `sidebar.tsx`: import 4 icons từ shared file
- [ ] Update `page-header.tsx`: thêm `variant` prop
- [ ] Update `dashboard-page.tsx`: dùng `variant="hero"` + import icons từ shared

---

## File Size Check

| File | Est. Lines | OK? |
|------|-----------|-----|
| `icons.tsx` | ~60 | ✅ |
| `page-header.tsx` | ~20 | ✅ |
| `sidebar.tsx` (sau remove) | ~170 | ✅ |

---

## Success Criteria

- Không còn duplicate SVG path cho `IconCloud`, `IconClipboard`, `IconTarget`, `IconChart`, `IconHistory`
- `sidebar.tsx` vẫn hoạt động đúng sau khi import từ shared file
- `PageHeader` với `variant="hero"` render lớn hơn trên dashboard
- Backward compatible: các trang khác dùng `PageHeader` không bị ảnh hưởng

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sidebar import path sai | Low | Dùng `@/components/ui/icons` — alias đã config trong tsconfig |
| `className` prop trên SVG không có default | Low | Default `'h-5 w-5'` trong IconProps |
