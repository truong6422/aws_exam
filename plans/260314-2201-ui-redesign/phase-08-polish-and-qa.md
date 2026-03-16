---
spec_id: phase-08-polish-and-qa
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - No visual regressions on auth, dashboard, exam session, history at 375px / 768px / 1280px
  - Sidebar works correctly as overlay on mobile and fixed-width on desktop
  - All interactive elements have :focus-visible styles
  - Transitions are consistent (150ms ease for micro-interactions, 300ms for sidebar)
  - Toast notifications render correctly with new theme
  - TypeScript check passes with zero errors
  - Build completes without errors
---

# Phase 08 — Polish, Responsiveness & QA

## Overview
**Priority:** Medium
**Status:** Pending
Cross-cutting visual polish, final responsive passes, accessibility checks, and build verification.

## Polish Tasks

### 1. Micro-interactions & Hover States
Audit every interactive element:
- All buttons: `active:scale-[.98]` (already in `.btn-primary`, verify `.btn-ghost`, `.btn-accent`)
- Answer option buttons: smooth border-color transition (`transition-colors duration-150`)
- Stat cards: add `hover:shadow-card-hover transition-shadow` if cards become links
- Nav links in sidebar: verify `transition-colors` is applied consistently

### 2. Focus Accessibility
The global `:focus-visible` ring is defined in `index.css`. Verify:
- All `<button>` elements show the ring on keyboard focus
- All `<input>` / `<select>` fields: `.field` class already has `focus:ring-2 focus:ring-brand-500/20` — confirm it's visible enough
- `<NavLink>` elements in sidebar and admin tabs have visible focus ring

### 3. Responsive Breakpoints
Test at 3 widths:

| Width | Expected behavior |
|-------|------------------|
| 375px (mobile) | Sidebar is off-canvas overlay; main content full-width; exam nav stacked |
| 768px (tablet) | Sidebar overlay still applies (< lg); stat grid 2-col; table scrollable |
| 1280px (desktop) | Sidebar fixed; sidebar-open 240px; full stat grid 4-col |

Specific mobile fixes:
- `stat-card` grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Setup form: full-width on mobile (already `content-sm` centered)
- History table: add `overflow-x-auto` wrapper for horizontal scroll on mobile
- Exam session footer: `flex-col sm:flex-row` for very small screens
- Admin tabs: `flex-wrap` or horizontal scroll for overflow

### 4. Toast Container
Currently bottom-right. Verify it doesn't overlap with the sticky exam session footer. If overlap detected, adjust z-index or move to `top-right` on session pages.

### 5. Typography Consistency
Audit and standardize:
- Page titles: `text-2xl font-bold text-gray-900` (via PageHeader)
- Section titles inside cards: `text-sm font-semibold text-gray-700` (via SectionCard)
- Body text: `text-sm text-gray-700`
- Meta/hints: `text-xs text-gray-400`
- Ensure no orphan `font-bold` / `font-semibold` classes that deviate from the scale

### 6. Icon Consistency
All inline SVG icons in sidebar use `h-5 w-5 shrink-0`. Ensure new icons added in Phase 06-07 (admin pages, answer options, EmptyState) follow the same size convention.

### 7. Color Usage Audit
Verify these rules are followed everywhere:
- Primary actions → `brand-600` / `brand-700` hover
- Practice/positive actions → `accent-600` (teal) or `brand-600` is acceptable
- Destructive → `red-600`
- Muted text → `gray-400` or `gray-500`
- No random `gray-600` / `gray-700` used for headings (use `gray-900`)

## QA Checklist

### Functional (smoke-test — no logic changes expected)
- [ ] Can log in with valid credentials
- [ ] Sidebar toggle works (opens/closes, persists state via ui-store)
- [ ] Navigation to all routes works (Dashboard, History, Analytics, Exam Setup, Practice Setup)
- [ ] Toast appears on login success
- [ ] Logout navigates to /login

### Visual (manual browser check)
- [ ] Auth page renders correctly on mobile
- [ ] Dashboard stat cards display in 2-col mobile, 4-col desktop
- [ ] Exam setup form is readable and centered
- [ ] Exam session sticky header/footer visible and not clipped
- [ ] History table scrollable on mobile
- [ ] Admin tabs wrap or scroll on mobile

### Build
```bash
cd apps/frontend
npx tsc --noEmit       # TypeScript check
npm run build          # Vite production build
```

## Affected Files (Polish Pass)

| File | Change type |
|------|------------|
| `src/index.css` | Minor: verify `2xs` font size works, add `overflow-x-auto` utility if needed |
| `src/layouts/app-shell.tsx` | Verify mobile padding `p-4 lg:p-6` on `<main>` |
| `src/layouts/sidebar.tsx` | Verify admin section icon sizing |
| `src/pages/history/history-page.tsx` | Add `overflow-x-auto` wrapper around table |
| `src/pages/exam/exam-session-page.tsx` | Footer `flex-col sm:flex-row` |
| `src/components/ui/toast-container.tsx` | Verify z-index doesn't conflict with exam sticky footer |

## Risk
- Low. All changes are cosmetic tweaks and responsive adjustments.
- Only risk: the `<main>` `flex flex-col` change from Phase 06 being applied inconsistently — verify other pages still fill height correctly.

## Final Deliverable
After Phase 08, the redesign is complete and ready for Phase 2 (API wiring). All screens should match the SaaS dashboard aesthetic with no broken layouts at any major breakpoint.
