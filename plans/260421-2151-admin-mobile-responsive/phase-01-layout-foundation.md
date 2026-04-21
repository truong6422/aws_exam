---
phase: "01"
title: "Core Layout & Navigation Foundation"
status: ready
priority: critical
blocks: [phase-02, phase-03]
files_owned:
  - apps/frontend/src/hooks/use-is-mobile.ts
  - apps/frontend/src/stores/ui-store.ts
  - apps/frontend/src/layouts/app-shell.tsx
  - apps/frontend/src/layouts/sidebar.tsx
  - apps/frontend/src/layouts/navbar.tsx
---

# Phase 01 — Core Layout & Navigation Foundation

## Goal

Make the fundamental layout skeleton mobile-responsive. Everything else is blocked on this phase.

## Why This First

The `marginLeft: sidebarOpen ? '240px' : '60px'` in `app-shell.tsx` breaks every single admin page on mobile. The sidebar overlaps content on every screen. Fix the shell first, then pages are usable.

## Task Breakdown

### Task 1.1 — Create `use-is-mobile` hook

**File:** `apps/frontend/src/hooks/use-is-mobile.ts` (NEW)

```typescript
import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768 // md

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
```

**Notes:**
- Uses `window.matchMedia` for event-driven updates (no resize listener polling)
- SSR-safe initial value via lazy initializer
- Breakpoint 768px = Tailwind `md:`

---

### Task 1.2 — Extend `ui-store.ts`

**File:** `apps/frontend/src/stores/ui-store.ts`

Add mobile drawer state alongside existing `sidebarOpen`:

```typescript
interface UiState {
  sidebarOpen: boolean       // desktop collapse state (unchanged)
  mobileDrawerOpen: boolean  // mobile-only overlay drawer state
  // ... existing fields ...
  openMobileDrawer: () => void
  closeMobileDrawer: () => void
  toggleMobileDrawer: () => void
}

// In create():
mobileDrawerOpen: false,
openMobileDrawer: () => set({ mobileDrawerOpen: true }),
closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
toggleMobileDrawer: () => set((s) => ({ mobileDrawerOpen: !s.mobileDrawerOpen })),
```

**Why separate state?**
- `sidebarOpen` controls 240/60px toggle on desktop — should not be touched
- `mobileDrawerOpen` is a separate overlay concern on mobile
- Hamburger button in Navbar will toggle `mobileDrawerOpen` on mobile, `sidebarOpen` on desktop

---

### Task 1.3 — Update `app-shell.tsx`

**File:** `apps/frontend/src/layouts/app-shell.tsx`

**Before (broken on mobile):**
```tsx
<div
  className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
  style={{ marginLeft: sidebarOpen ? '240px' : '60px' }}
>
```

**After (responsive):**
```tsx
const isMobile = useIsMobile()
const mobileDrawerOpen = useUiStore((s) => s.mobileDrawerOpen)
const closeMobileDrawer = useUiStore((s) => s.closeMobileDrawer)

// Mobile: no margin, sidebar is overlay
// Desktop: push margin based on sidebarOpen
const contentMargin = isMobile ? '0px' : sidebarOpen ? '240px' : '60px'

return (
  <div className="flex h-screen overflow-hidden" style={{ background: '#000' }}>
    {/* Mobile backdrop */}
    {isMobile && mobileDrawerOpen && (
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={closeMobileDrawer}
        aria-hidden="true"
      />
    )}

    <Sidebar />

    <div
      className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
      style={{ marginLeft: contentMargin }}
    >
      <Navbar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 16px', background: '#000' }}
      >
        <Outlet />
      </main>
    </div>

    <LanguageSwitcher />
    <ToastContainer />
  </div>
)
```

**Key changes:**
- `contentMargin` computed based on `isMobile` — 0 on mobile, 240/60 on desktop
- Mobile backdrop div: semi-transparent overlay, click closes drawer
- Main padding reduced to `24px 16px` on mobile vs `32px 24px` desktop (use responsive CSS)

**Responsive main padding — add to `index.css`:**
```css
@media (max-width: 767px) {
  .admin-main { padding: 20px 16px; }
}
```
Or use a className + Tailwind: `className="p-4 md:p-8"` on main.

---

### Task 1.4 — Update `sidebar.tsx`

**File:** `apps/frontend/src/layouts/sidebar.tsx`

**Core logic change:**
```tsx
const isMobile = useIsMobile()
const mobileDrawerOpen = useUiStore((s) => s.mobileDrawerOpen)
const closeMobileDrawer = useUiStore((s) => s.closeMobileDrawer)

// Mobile: full-width drawer, translate based on mobileDrawerOpen
// Desktop: fixed push sidebar, width based on sidebarOpen
const sidebarWidth = isMobile ? '280px' : sidebarOpen ? '240px' : '60px'
const translateX = isMobile && !mobileDrawerOpen ? '-100%' : '0'
```

**Aside element:**
```tsx
<aside
  className="fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300"
  style={{
    width: sidebarWidth,
    transform: `translateX(${translateX})`,
    background: '#000',
    borderRight: '1px solid rgba(255,255,255,0.08)',
  }}
>
```

**Route change auto-close on mobile:**
```tsx
import { useLocation } from 'react-router-dom'

const location = useLocation()
useEffect(() => {
  if (isMobile) closeMobileDrawer()
}, [location.pathname])
```

**`SidebarLink` — on mobile always show label text (not collapsed):**
The `collapsed` prop should be `false` on mobile regardless of `sidebarOpen`.

```tsx
// In Sidebar component:
const collapsed = isMobile ? false : !sidebarOpen
// Pass collapsed={collapsed} to each SidebarLink
```

---

### Task 1.5 — Update `navbar.tsx`

**File:** `apps/frontend/src/layouts/navbar.tsx`

**Hamburger behavior change:**
```tsx
const isMobile = useIsMobile()
const toggleSidebar = useUiStore((s) => s.toggleSidebar)           // desktop
const toggleMobileDrawer = useUiStore((s) => s.toggleMobileDrawer) // mobile

const handleMenuToggle = isMobile ? toggleMobileDrawer : toggleSidebar
```

**Hide username text on mobile (avatar stays):**
```tsx
<span
  className="hidden md:inline"
  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.12px' }}
>
  {user?.name ?? user?.email}
</span>
```

**Full updated hamburger button:**
```tsx
<button
  onClick={handleMenuToggle}
  aria-label="Toggle sidebar"
  className="transition-opacity hover:opacity-70"
  style={{
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px', borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}
>
  ...svg...
</button>
```

---

## Acceptance Criteria — Phase 1

- [ ] On 375px screen: content fills full width, no sidebar visible by default
- [ ] Hamburger tap opens sidebar as overlay drawer from left
- [ ] Tapping backdrop closes drawer
- [ ] Navigating to a new admin route closes the drawer
- [ ] Desktop (≥768px): sidebar behaves exactly as before (push mode, 240/60 toggle)
- [ ] Username text hidden on mobile navbar (avatar still visible)
- [ ] No TypeScript errors

## Risk Notes

- `sidebarOpen: true` default in ui-store means on desktop initial load sidebar is open — leave this unchanged
- Body scroll lock: not critical for MVP; add if time allows (set `document.body.style.overflow = 'hidden'` when `mobileDrawerOpen`)
- z-index stack: sidebar z-50, backdrop z-40, navbar z-40 — verify no overlap conflicts
