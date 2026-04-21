---
id: 260421-2151-admin-mobile-responsive
title: Admin Interface Mobile Responsive Retrofit
status: ready-to-cook
created_at: "2026-04-21T21:51:00+07:00"
type: frontend
scope: admin-only
approach: Option A — Sidebar Drawer + Tailwind Responsive Classes
stack: React 18 + TypeScript + Tailwind CSS 3.4.11 + Zustand
---

# Admin Interface Mobile Responsive Retrofit

## Problem Statement

The admin interface is **not mobile-friendly**:
- Sidebar is fixed 240px/60px with no mobile hiding — breaks layout on all phones
- `marginLeft: 240px | 60px` hardcoded in AppShell — never 0 on mobile
- ~95% inline styles → cannot be overridden by CSS media queries
- Tables have no overflow handling → data unreadable on small screens
- No Tailwind breakpoints used anywhere in admin code

## Goal

Full feature parity on mobile for admin interface. Admin on phones should feel like a proper admin dashboard, not a broken desktop view.

## Approach: Sidebar Drawer Pattern

```
Mobile (<768px):          Desktop (≥768px):
┌─────────────────────┐   ┌──────────┬─────────────────┐
│ [☰] Navbar          │   │          │ Navbar          │
│─────────────────────│   │ Sidebar  │─────────────────│
│                     │   │  240px   │                 │
│   Content (100%)    │   │          │   Content       │
│                     │   │          │                 │
│                     │   │          │                 │
└─────────────────────┘   └──────────┴─────────────────┘

Mobile w/ drawer open:
┌──────────────────────┐
│ [Sidebar overlay 80%]│ ← z-50, backdrop behind
│ (click outside=close)│
└──────────────────────┘
```

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Sidebar mobile mode | Slide-in drawer overlay | Standard admin pattern, reuses hamburger |
| Breakpoint | md: 768px | Separates phone/tablet from desktop |
| Mobile sidebar state | Separate from desktop collapse state | Mobile = hidden/visible; desktop = 240/60 |
| Table overflow | `overflow-x-auto` wrapper + `min-w-[640px]` table | Simpler than card view, preserves all data |
| Inline style migration | Replace layout-affecting inline styles with Tailwind classes | Non-layout styles (colors, borders) can stay inline |
| Body scroll lock | CSS `overflow: hidden` on `<body>` when mobile drawer open | Prevents background scroll |

## Hook: `useIsMobile`

New hook at `apps/frontend/src/hooks/use-is-mobile.ts`:
```typescript
// Returns true if viewport < 768px (md breakpoint)
// Uses window.matchMedia with resize event listener
```

Used in:
- `app-shell.tsx` — to set marginLeft=0 on mobile
- `sidebar.tsx` — to switch between drawer (mobile) and push (desktop) behavior

## File Change Inventory

### Phase 1 — Core Layout (Unblocks everything)
| File | Changes |
|------|---------|
| `apps/frontend/src/hooks/use-is-mobile.ts` | **NEW**: mobile breakpoint hook |
| `apps/frontend/src/stores/ui-store.ts` | Add `mobileDrawerOpen`, `openMobileDrawer`, `closeMobileDrawer` |
| `apps/frontend/src/layouts/app-shell.tsx` | Remove inline marginLeft → Tailwind responsive; add mobile backdrop |
| `apps/frontend/src/layouts/sidebar.tsx` | Add mobile drawer mode (translate-x-full → translate-x-0) |
| `apps/frontend/src/layouts/navbar.tsx` | Responsive right-side items (hide username text on mobile) |

### Phase 2 — Tables & Filters
| File | Changes |
|------|---------|
| `apps/frontend/src/pages/admin/admin-users-page.tsx` | Wrap table in overflow-x-auto; flex-wrap header |
| `apps/frontend/src/pages/admin/admin-exams-page.tsx` | Wrap table(s) in overflow-x-auto; responsive bulk modal |
| `apps/frontend/src/layouts/admin-layout.tsx` | Tab nav overflow-x-auto |
| `apps/frontend/src/components/admin/question-filters.tsx` | flex-wrap filters |

### Phase 3 — Dashboard & Remaining Pages
| File | Changes |
|------|---------|
| `apps/frontend/src/pages/admin/admin-dashboard-page.tsx` | Stack pie chart section on mobile |
| `apps/frontend/src/pages/admin/admin-import-page.tsx` | Full-width dropzone on mobile |
| `apps/frontend/src/pages/admin/admin-settings-page.tsx` | Full-width form fields on mobile |
| `apps/frontend/src/pages/admin/admin-questions-page.tsx` | Responsive header layout |
| `apps/frontend/src/pages/admin/admin-chat-page.tsx` | Full-width on mobile |

## Phases

| Phase | Scope | Files | Blocks |
|-------|-------|-------|--------|
| [Phase 1](phase-01-layout-foundation.md) | Core layout + navigation | 5 files | All others |
| [Phase 2](phase-02-tables-filters.md) | Tables + admin-layout tabs | 4 files | None |
| [Phase 3](phase-03-dashboard-remaining.md) | Dashboard + remaining pages | 5 files | None |

## Non-Goals

- Mobile responsiveness for non-admin pages (practice, exam, landing)
- Changing the design system (colors, fonts, Apple dark theme)
- Touch gestures (swipe to close drawer)
- Adding new admin features

## Test Strategy

Manual testing required on:
- iPhone SE viewport (375px × 667px)
- iPad portrait (768px × 1024px) — breakpoint boundary
- Chrome DevTools device emulation

Automated:
- No new tests required — UI-only changes with no logic change
- Existing auth tests unaffected

## Acceptance Criteria

- [ ] Sidebar hidden by default on mobile, opens via hamburger
- [ ] Backdrop overlay closes sidebar on tap outside
- [ ] Main content fills 100% width on mobile (no sidebar margin)
- [ ] All admin tables horizontally scrollable on mobile
- [ ] Admin tab navigation scrollable on mobile without wrapping
- [ ] Dashboard stat cards display in 2-column grid min on mobile
- [ ] All pages usable at 375px width (no horizontal page overflow)
- [ ] Desktop (≥1024px) behavior unchanged
