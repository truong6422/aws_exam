---
spec_id: phase-02-shell-navigation
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Sidebar renders correctly in open (240px) and collapsed (64px) states
  - Sidebar collapses to hidden overlay drawer on screens < md (mobile)
  - Navbar shows breadcrumb/page title area + user menu dropdown
  - AuthLayout uses a modern split-panel design
  - AdminLayout tab bar visually distinct from sidebar nav
  - All nav links and logout remain functional
  - No store interface changes
---

# Phase 02 — Shell & Navigation

## Context Links
- File: `apps/frontend/src/layouts/app-shell.tsx`
- File: `apps/frontend/src/layouts/sidebar.tsx`
- File: `apps/frontend/src/layouts/navbar.tsx`
- File: `apps/frontend/src/layouts/auth-layout.tsx`
- File: `apps/frontend/src/layouts/admin-layout.tsx`
- Store: `apps/frontend/src/stores/ui-store.ts` (read-only — no changes)

## Overview

**Priority:** High — the shell wraps every page.
**Status:** Pending

Refine the shell layout and navigation to feel like a polished SaaS product. The structural pattern (fixed sidebar + top navbar + main outlet) is correct and stays. Changes are styling, responsiveness, and UX polish only.

## Key Insights

- `AppShell` uses hard-coded `ml-64` / `ml-16` margin shifts — these work but break on mobile. Need responsive override.
- `Sidebar` SVG icons are already inline (no icon library needed) — keep this pattern.
- `Navbar` is very sparse (just a toggle + avatar) — add a page-title slot and a minimal user dropdown.
- `AuthLayout` uses an emoji `☁️` — replace with SVG cloud icon consistent with sidebar.
- `AdminLayout` horizontal tab bar is fine — needs better active state contrast.
- Mobile: `sidebarOpen` from ui-store will drive a drawer overlay at `< md`.

## Changes

### `app-shell.tsx`

```tsx
// Current: hard margin shifts on all viewport sizes
// Target: margin shifts only on md+; on mobile sidebar is an overlay

<div className={clsx(
  'flex flex-1 flex-col overflow-hidden transition-all duration-300',
  'md:' + (sidebarOpen ? 'ml-60' : 'ml-16'),  // desktop only
  'ml-0',                                        // mobile: no margin (sidebar overlays)
)}
```

Also add a subtle backdrop overlay that appears on mobile when sidebar is open:
```tsx
{/* Mobile backdrop */}
{sidebarOpen && (
  <div
    className="fixed inset-0 z-20 bg-gray-900/40 md:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

### `sidebar.tsx`

**Structural changes (no logic changes):**

1. **Logo area** — Replace emoji with proper branded mark:
   - Left: Cloud SVG icon in `brand-400` color
   - Right (expanded): "AWS Exam" in white, `font-bold`, + subtitle "Prep Platform" in `brand-400` at `text-[10px]`

2. **Nav items** — Active state upgrade:
   - Active: `bg-brand-700/60 text-white` with a `border-l-2 border-brand-300` left accent line
   - Inactive: `text-brand-300 hover:bg-brand-800/50 hover:text-white`
   - Collapsed: show only icon, centered

3. **Section labels** — Upgrade from all-caps tiny to slightly larger:
   - `text-[11px] font-semibold uppercase tracking-wider text-brand-500`

4. **User footer** — More polished:
   - Avatar: `h-8 w-8` circle, `bg-brand-600`, initial letter
   - Name: `text-sm font-medium text-white`
   - Email: `text-[11px] text-brand-400`
   - Logout button: `text-brand-300 hover:text-red-400 hover:bg-red-900/20 transition-colors`

5. **Mobile behavior** — Sidebar becomes fixed full-height overlay:
   - On mobile: always `w-60`, position fixed, `translate-x-0` when open, `-translate-x-full` when closed
   - On desktop: current collapse behavior retained

### `navbar.tsx`

**Additions (no logic changes):**

1. **Left side** — Keep hamburger toggle. Add a page title display:
   ```tsx
   // Read current route label from a static route→label map
   // e.g. '/dashboard' → 'Dashboard', '/exam/setup' → 'New Exam'
   ```

2. **Right side** — Expand the user area into a minimal dropdown:
   - Show user name + `▾` chevron
   - Avatar circle (`bg-brand-600`, initial)
   - Dropdown panel (absolute positioned): shows email + "Sign out" link
   - Dropdown driven by local `useState` (no store change needed)

3. **Visual** — Slightly taller (`h-14` from `h-16`), white bg, `border-b border-gray-100`

### `auth-layout.tsx`

Replace current gradient-background + centered card with a split-panel design:

```
┌─────────────────────┬─────────────────────┐
│   Left panel        │   Right panel       │
│   brand-900 bg      │   white bg          │
│   Logo + tagline    │   <Outlet /> form   │
│   feature bullets   │                     │
│   (hidden on mobile)│   (full width mob)  │
└─────────────────────┴─────────────────────┘
```

- Left: `hidden md:flex`, `bg-brand-900`, logo SVG, app name, 3 feature bullets
- Right: `flex-1`, `bg-white`, centered form, `max-w-sm` form width

### `admin-layout.tsx`

Tab bar refinements:
- Active tab: `border-b-2 border-brand-600 text-brand-700 font-semibold`
- Inactive: `text-gray-500 hover:text-gray-700 hover:border-gray-300`
- Add a subtle admin banner at top: `bg-amber-50 border-b border-amber-100 text-amber-800 text-xs px-4 py-1.5` saying "Admin Area"

## Implementation Steps

1. **`app-shell.tsx`** — Add mobile backdrop overlay; fix margin to `md:ml-60` / `md:ml-16`; add `setSidebarOpen` from store for backdrop click
2. **`sidebar.tsx`** — Update logo area (SVG, subtitle); update active/inactive link styles; update section labels; update user footer; add mobile slide-in behavior via `translate-x` + `transition-transform`
3. **`navbar.tsx`** — Add route→title map; add page title span; replace avatar with dropdown component (local state); adjust height
4. **`auth-layout.tsx`** — Rewrite to split-panel; preserve `<Outlet />` in right panel
5. **`admin-layout.tsx`** — Add admin banner; refine tab active/inactive classes

## Todo

- [ ] Update `app-shell.tsx` — mobile backdrop + responsive margins
- [ ] Update `sidebar.tsx` — logo, link styles, user footer, mobile translate
- [ ] Update `navbar.tsx` — page title slot + user dropdown
- [ ] Update `auth-layout.tsx` — split panel design
- [ ] Update `admin-layout.tsx` — admin banner + tab refinements
- [ ] Test sidebar collapse/expand on desktop
- [ ] Test sidebar overlay on mobile (< md)
- [ ] Run `npm run build` — confirm no type errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mobile sidebar overlay conflicts with router navigation | Low | Medium | onClick on backdrop calls `setSidebarOpen(false)` before nav |
| Navbar dropdown obscures content | Low | Low | `z-50` + click-outside `useEffect` handler |
| Auth split panel breaks on tablet | Medium | Low | Test at md breakpoint; left panel hides below md |
| Admin banner adds unexpected height | Low | Low | Fixed `py-1.5`, won't push content significantly |

## Open Questions

- **Q2**: Mobile sidebar — hidden + overlay OR icon-strip always visible? (see plan.md open question #2)
- Should the navbar user dropdown include a "Profile" link for future use?
