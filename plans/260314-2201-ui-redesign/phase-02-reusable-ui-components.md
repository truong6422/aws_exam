---
spec_id: phase-02-reusable-ui-components
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Button component with variant prop (primary | ghost | accent | danger) renders correctly
  - FormField component wraps label + input/select + error message
  - StatCard component used consistently across dashboard and admin
  - SectionCard component (titled card container) replaces inline rounded-xl divs
  - EmptyState component for zero-data placeholders
  - All new components under 80 lines each
  - No existing page business logic changed
---

# Phase 02 — Reusable UI Component Library

## Overview
**Priority:** High — unblocks all page phases
**Status:** Pending
Extract repeated inline patterns into small, focused components. Pages currently repeat the same Tailwind strings for buttons, form fields, cards, and empty states. This phase DRYs that up.

## Components to Create

### `components/ui/button.tsx`
```tsx
type Variant = 'primary' | 'ghost' | 'accent' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant  // default: 'primary'
  size?: Size        // default: 'md'
  loading?: boolean
  leftIcon?: React.ReactNode
}
```
Maps variant → CSS class name (`.btn-primary`, `.btn-ghost`, etc.).
Renders `<button disabled aria-busy>` when `loading=true`.

### `components/ui/link-button.tsx`
Same variants as Button but renders as `<Link>` from react-router-dom.
Use for navigation CTAs (e.g. "Start Exam", "Retake Exam").

### `components/ui/form-field.tsx`
```tsx
interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode  // the <input> or <select>
}
```
Renders: `<label>` → `children` → optional error/hint text.
Consumers pass `<input className="field" />` as children — no coupling to input type.

### `components/ui/stat-card.tsx`
```tsx
interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode  // SVG or emoji
  trend?: { value: string; positive: boolean }  // e.g. "+5% this week"
  href?: string  // makes card clickable
}
```
Uses `.stat-card` CSS class from phase 01.
Replaces the four inline stat divs in `dashboard-page.tsx` and `admin-dashboard-page.tsx`.

### `components/ui/section-card.tsx`
```tsx
interface SectionCardProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode  // e.g. a "View all" link in the header
  children: React.ReactNode
  className?: string
}
```
Replaces the repeated `rounded-xl border border-gray-200 bg-white p-5 shadow-sm` pattern.
Renders a `.card` container with an optional titled header row.

### `components/ui/empty-state.tsx`
```tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode  // a <Button> or <LinkButton>
}
```
Used in History table, Recent Activity, Analytics chart placeholders.

### `components/ui/page-header.tsx` (refine existing)
Add optional `actions` prop for right-side buttons:
```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode  // renders right-aligned in a flex row
}
```
Backward-compatible — existing usages without `actions` still work.

## What NOT to Create
- No modal/dialog component (no use case yet — YAGNI)
- No dropdown/menu component (sidebar handles navigation)
- No table component (History table is straightforward enough inline for now)
- No toast changes (ToastContainer already works)

## Affected Files

| File | Change type |
|------|------------|
| `src/components/ui/button.tsx` | **CREATE** |
| `src/components/ui/link-button.tsx` | **CREATE** |
| `src/components/ui/form-field.tsx` | **CREATE** |
| `src/components/ui/stat-card.tsx` | **CREATE** |
| `src/components/ui/section-card.tsx` | **CREATE** |
| `src/components/ui/empty-state.tsx` | **CREATE** |
| `src/components/ui/page-header.tsx` | **MODIFY** (add `actions` prop) |

## Implementation Steps
1. Create each component file (keep each under 80 lines)
2. No page files are modified in this phase — components are created only
3. Run TypeScript check (`npx tsc --noEmit`) to validate types

## Risk
- Low. New files only (except page-header.tsx minor extension). No existing logic touched.
