---
spec_id: phase-03-shared-components
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - PageHeader updated with optional action slot (right-aligned CTA button area)
  - ToastContainer uses refined pill design with status colors from new tokens
  - StatCard component extracted to components/ui/stat-card.tsx (reused by dashboard + admin)
  - Badge component extracted to components/ui/badge.tsx
  - All existing call-sites of PageHeader continue to work without changes
  - No new external dependencies
---

# Phase 03 — Shared UI Components

## Context Links
- File: `apps/frontend/src/components/ui/page-header.tsx`
- File: `apps/frontend/src/components/ui/toast-container.tsx`
- New: `apps/frontend/src/components/ui/stat-card.tsx`
- New: `apps/frontend/src/components/ui/badge.tsx`

## Overview

**Priority:** Medium — unblocks Phases 4–6 which all use these.
**Status:** Pending

Extract and polish the 2 existing shared components. Create 2 new ones (StatCard, Badge) that are used repeatedly across student + admin pages. Keep all components under 80 lines.

## Key Insights

- `PageHeader` is minimal (14 lines) — add an `actions` slot without breaking existing callers
- `ToastContainer` uses inline style for position — keep, just refine visual
- Stat cards appear on **DashboardPage** (4 cards) and **AdminDashboardPage** (4 cards) with identical structure — extract to avoid duplication
- Badge pill pattern needed for: exam scores (pass/fail), session types (exam/practice), question difficulty

## Changes

### `page-header.tsx` — update in-place

```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode  // NEW — optional right-aligned slot
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
```

Changes:
- Title: `text-2xl` → `text-xl` (slightly tighter, SaaS-style)
- Added `actions` prop (backward-compat — optional)
- Flex row layout to accommodate action buttons

### `toast-container.tsx` — update in-place

Refine toast pill design:
- Width: `w-80` (fixed)
- Shape: `rounded-xl` + `shadow-lg`
- Color strips by type using new status tokens:
  - `success`: `bg-accent-50 border-accent-500/30 text-accent-800`
  - `error`: `bg-red-50 border-red-300 text-red-800`
  - `warning`: `bg-amber-50 border-amber-300 text-amber-800`
  - `info`: `bg-brand-50 border-brand-300 text-brand-800`
- Add a colored left-border stripe: `border-l-4`
- Keep auto-dismiss at 4s (no logic change)
- Keep `fixed bottom-4 right-4 z-50` positioning

### NEW `stat-card.tsx`

```
components/ui/stat-card.tsx   (~40 lines)
```

```tsx
interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode      // SVG icon element
  trend?: { value: string; positive: boolean }  // optional "+12%" indicator
  className?: string
}
```

Visual design:
- White card, `rounded-2xl border border-gray-200 shadow-card p-5`
- Icon: `h-10 w-10 rounded-xl bg-brand-50 text-brand-600` container, top-left
- Value: `text-2xl font-bold text-gray-900 mt-3`
- Label: `text-xs text-gray-500 mt-0.5`
- Trend (optional): `text-xs font-medium` — green if positive, red if negative

### NEW `badge.tsx`

```
components/ui/badge.tsx   (~30 lines)
```

```tsx
type BadgeVariant = 'blue' | 'green' | 'red' | 'amber' | 'gray' | 'purple'

interface BadgeProps {
  label: string
  variant?: BadgeVariant   // default: 'gray'
  dot?: boolean            // show colored dot before text
}
```

Uses `.badge .badge-{color}` classes from Phase 01 index.css.

## Implementation Steps

1. Update `page-header.tsx` — add `actions` prop, adjust title size, flex layout
2. Update `toast-container.tsx` — refine color mapping, left-border stripe, shape
3. Create `stat-card.tsx` — new component with icon, value, label, optional trend
4. Create `badge.tsx` — new component wrapping `.badge` CSS classes
5. Verify all existing `<PageHeader>` usages still render (no required prop added)
6. Run `npm run build`

## Todo

- [ ] Update `page-header.tsx` with actions slot
- [ ] Update `toast-container.tsx` with new visual design
- [ ] Create `stat-card.tsx`
- [ ] Create `badge.tsx`
- [ ] Confirm existing PageHeader call-sites compile without changes
- [ ] Run `npm run build`

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `actions` prop breaks TS inference on existing callers | None | None | Optional prop with `?`, backward-compat |
| StatCard icon prop requires caller to pass SVG — boilerplate | Low | Low | Icon is optional; emoji fallback fine in Phase 4 |
| Badge CSS classes not purged (not used in JSX) | Low | Low | Use classes inline in badge.tsx JSX, not just @apply |
