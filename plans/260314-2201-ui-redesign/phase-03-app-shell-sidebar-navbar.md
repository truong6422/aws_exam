---
spec_id: phase-03-app-shell-sidebar-navbar
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Sidebar is light-themed (white background) with brand-600 active state
  - Sidebar hover states use brand-50 tint (not dark brand-800)
  - Sidebar logo area shows a styled text/icon badge (not just emoji)
  - Navbar has a breadcrumb or page-title region in the center/left
  - Navbar right side has user avatar with initials + name, with a hover dropdown stub
  - Mobile: sidebar collapses to off-canvas overlay (< lg breakpoint)
  - AppShell main content padding consistent (p-6 desktop, p-4 mobile)
  - No changes to sidebar toggle logic in ui-store
---

# Phase 03 — App Shell: Sidebar & Navbar

## Overview
**Priority:** High — wraps all authenticated screens
**Status:** Pending
The biggest visual change. Current sidebar is dark (`bg-brand-900`). Redesign to a light sidebar matching modern SaaS dashboards (Linear, Vercel, Notion style). Navbar gains a page context area.

## Sidebar Redesign

### Visual Changes
| Token | Current | Redesigned |
|-------|---------|-----------|
| Background | `bg-brand-900` (dark navy) | `bg-white` with `border-r border-surface-border` |
| Logo text | white on dark | `text-brand-700 font-bold` |
| Logo icon | `text-brand-300` | `text-brand-600` |
| Nav item default | `text-brand-200` | `text-gray-600` |
| Nav item hover | `hover:bg-brand-800 hover:text-white` | `hover:bg-brand-50 hover:text-brand-700` |
| Nav item active | `bg-brand-600 text-white` | `bg-brand-50 text-brand-700 font-semibold` with `border-l-2 border-brand-600` |
| Section labels | `text-brand-400` | `text-gray-400` |
| User footer bg | transparent on dark | `bg-surface-muted border-t border-surface-border` |
| User name | `text-white` | `text-gray-800` |
| User email | `text-brand-400` | `text-gray-400` |
| Logout btn | `text-brand-300` | `text-gray-500 hover:text-red-600 hover:bg-red-50` |

### Mobile Behavior (new)
Below `lg` (1024px), sidebar becomes an **off-canvas overlay**:
- Hidden by default (translate-x-[-100%])
- When `sidebarOpen=true` → slides in with backdrop overlay
- Tapping backdrop closes it
- No layout shift on mobile (main content fills full width)

Implementation: wrap `<aside>` in a conditional class:
```tsx
// Desktop: fixed sidebar + margin shift (current behavior)
// Mobile: overlay panel + backdrop
className={clsx(
  'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-surface-border transition-[width,transform] duration-300',
  // Desktop
  'lg:translate-x-0',
  sidebarOpen ? 'lg:w-60' : 'lg:w-16',
  // Mobile
  sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72',
)}
```

Add mobile backdrop:
```tsx
{/* Mobile overlay backdrop */}
{sidebarOpen && (
  <div
    className="fixed inset-0 z-20 bg-black/30 lg:hidden"
    onClick={toggleSidebar}
  />
)}
```

AppShell adjustment for mobile:
```tsx
// Main content: no margin shift on mobile
className={clsx(
  'flex flex-1 flex-col overflow-hidden transition-all duration-300',
  sidebarOpen ? 'lg:ml-60' : 'lg:ml-16',
  // Mobile: always full width
  'ml-0',
)}
```

## Navbar Redesign

### Visual Changes
| Element | Current | Redesigned |
|---------|---------|-----------|
| Height | h-16 | h-16 (keep) |
| Background | white + border-b | white + `shadow-topbar` |
| Left: hamburger | plain icon | icon with subtle hover ring |
| Center/Left: context | empty | **Page title** (read from a `usePageTitle` hook or just left as empty initially — safe to add later) |
| Right: user | name text + avatar circle | Avatar circle + name (hidden on mobile) + chevron-down for dropdown stub |

### User Dropdown (stub, non-functional)
Render a `<button>` wrapping the avatar+name that has `cursor-pointer` but no dropdown behavior yet. Dropdown logic is Phase 8 polish. This just establishes the visual.

```tsx
<button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition">
  <div className="h-8 w-8 rounded-full bg-brand-600 text-white text-sm font-semibold flex items-center justify-center">
    {initial}
  </div>
  <span className="hidden sm:block text-sm font-medium text-gray-700">{name}</span>
  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
</button>
```

## Affected Files

| File | Change type |
|------|------------|
| `src/layouts/sidebar.tsx` | **MODIFY** — light theme, mobile overlay |
| `src/layouts/navbar.tsx` | **MODIFY** — user dropdown stub, chevron icon |
| `src/layouts/app-shell.tsx` | **MODIFY** — mobile-responsive margin, backdrop div |

## Implementation Steps
1. Update `sidebar.tsx`: swap all dark `brand-*` bg classes to light equivalents per table above
2. Add mobile overlay logic in `sidebar.tsx` (translate-x classes + backdrop div)
3. Update `app-shell.tsx`: change `ml-64`/`ml-16` to `lg:ml-60`/`lg:ml-16` (add `ml-0` base)
4. Update `navbar.tsx`: add chevron icon (inline SVG, no new dep), update user area markup
5. Verify sidebar collapse still works at desktop, overlay at mobile
6. TypeScript check

## Risk
- **Medium.** Changing sidebar color theme is the most visible change. Dark-to-light inversion may look wrong if any pages relied on the dark sidebar contrast for legibility — but all pages are in the main area so this is cosmetic only.
- Mobile behavior is new; test at 375px and 768px viewports.

## Open Question
- **Q1:** Should the sidebar have a colored brand accent strip on the left edge when active, or just the `border-l-2` left indicator? (This plan uses `border-l-2 border-brand-600` — confirm.)
- **Q2:** Confirm whether a page-title injection mechanism is wanted in the navbar now or deferred to Phase 8.
