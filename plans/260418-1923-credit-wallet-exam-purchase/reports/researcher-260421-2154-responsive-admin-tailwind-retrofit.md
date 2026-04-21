# Responsive Admin Dashboard — Tailwind 3.x Retrofit Research

**Date:** 2026-04-21  
**Scope:** Retrofit existing admin (not greenfield). Codebase: React 18 + Tailwind 3.4.11 + Zustand `ui-store`.

---

## Codebase Snapshot (What We're Working With)

| File | Current state |
|---|---|
| `layouts/app-shell.tsx` | `marginLeft: sidebarOpen ? '240px' : '60px'` — inline style |
| `layouts/sidebar.tsx` | `width: sidebarOpen ? '240px' : '60px'` — inline style, `fixed inset-y-0 left-0 z-30` (Tailwind) |
| `layouts/navbar.tsx` | hamburger calls `toggleSidebar` from `ui-store` |
| `stores/ui-store.ts` | `sidebarOpen: true` (boolean), `toggleSidebar()` — no mobile awareness |
| `pages/admin/*` | 100% `style={{}}` inline; tables without overflow wrappers |
| `tailwind.config.js` | minimal — no custom breakpoints, no theme extensions |

---

## Topic 1: Sidebar → Mobile Drawer Pattern

### Core pattern

On desktop: sidebar stays fixed in-flow, main content shifts right.  
On mobile: sidebar becomes an overlay drawer (slides in via `translate-x`), backdrop dims content, body scroll locked.

### Tailwind translate-x approach

```tsx
// sidebar.tsx — key classes
<aside
  className={[
    'fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300',
    // Desktop: always visible, width-based collapse
    'md:translate-x-0',
    // Mobile: off-screen by default, slide in when open
    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
  ].join(' ')}
  style={{ width: sidebarOpen ? '240px' : '60px' }}   // keep desktop collapse logic
/>
```

The `-translate-x-full` class moves the sidebar exactly its own width off-screen — no magic number needed. On `md:` breakpoint it's always anchored to 0.

### Backdrop overlay (mobile only)

```tsx
{/* In AppShell, after <Sidebar /> */}
{sidebarOpen && (
  <div
    className="fixed inset-0 z-30 bg-black/60 md:hidden"
    onClick={closeSidebar}
    aria-hidden="true"
  />
)}
```

`md:hidden` ensures the backdrop never shows on desktop. `z-30` sits under sidebar (`z-40`) but above content.

### Body scroll lock

When the drawer is open on mobile, background content should not scroll.

```tsx
// In ui-store or AppShell useEffect
useEffect(() => {
  if (isMobile && sidebarOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => { document.body.style.overflow = '' }
}, [sidebarOpen, isMobile])
```

**Pitfall:** Only lock scroll on mobile. Locking on desktop breaks the sidebar's own `overflow-y-auto` scroll.

### z-index stack (this codebase)

Current: navbar is `zIndex: 40`, sidebar is `z-30`. Fix: sidebar drawer must be above navbar on mobile.

Recommended stack:
- Backdrop: `z-30`
- Sidebar: `z-40`
- Navbar: `z-40` (sticky, same layer — fine since they don't overlap)
- Modals: `z-50`

### ui-store change needed

The current `sidebarOpen: true` default is wrong for mobile — it would show the drawer open on first load. The store needs to initialize based on viewport:

```ts
// ui-store.ts
sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
```

Or: keep `sidebarOpen` as the desktop collapse toggle, add `mobileDrawerOpen: boolean` as separate state. This avoids colliding semantics — desktop "icon-only collapse" vs. mobile "fully hidden drawer".

**Recommended: two-state approach** — `sidebarOpen` (desktop collapse) + `mobileDrawerOpen` (drawer overlay).

---

## Topic 2: Inline Styles vs Tailwind Classes — Precedence & Migration

### Precedence rule

**Inline `style={{}}` always wins** over Tailwind classes — they are applied as element-level CSS (`style` attribute), which has higher specificity than any class-based rule. No exceptions.

```tsx
// This will be green, not red — inline wins
<div className="text-red-500" style={{ color: 'green' }}>text</div>
```

### Mixing them: fine, but be intentional

Use inline styles for values Tailwind can't generate (dynamic colors, arbitrary widths from JS state):
```tsx
// OK: dynamic color from JS — can't be a static Tailwind class
<div style={{ background: `conic-gradient(#1d9b5e ${pct}%, ...)` }} />

// OK: JS-driven dimension
<aside style={{ width: sidebarOpen ? '240px' : '60px' }} />
```

Use Tailwind for everything that is static or breakpoint-driven:
```tsx
// Replace inline display:flex with Tailwind
// Before: style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
// After:
<div className="flex flex-col gap-6">
```

### Progressive retrofit strategy (for this codebase)

1. **Phase 1 — Layout/spacing only.** Replace `display`, `flexDirection`, `gap`, `padding`, `margin`, `alignItems`, `justifyContent`. These are 1:1 with Tailwind utils. Zero visual risk.
2. **Phase 2 — Colors using CSS variables.** The existing `--ap-*` vars in `index.css` can be extended into `tailwind.config.js`:
   ```js
   theme: { extend: { colors: {
     'ap-surface': '#272729',
     'ap-blue': '#0071e3',
   }}}
   ```
   Then replace `background: '#272729'` → `bg-ap-surface`. Inline colors that reference custom vars can become `bg-[var(--ap-surface-1)]` (Tailwind JIT arbitrary values).
3. **Phase 3 — Typography.** Replace `fontSize`, `fontWeight`, `letterSpacing` combos with `@layer components` custom classes or Tailwind text utils.
4. **Phase 4 — Interactive/dynamic.** Leave `NavLink` `style={({ isActive }) => ...}` inline for now — active state logic with callbacks can't be cleanly expressed as static Tailwind classes without a helper.

### Common pitfall: Tailwind purge vs dynamic class names

Tailwind 3 JIT scans source for class names. **Never construct class names dynamically:**
```tsx
// WRONG — Tailwind won't include this class
const cls = `text-${color}-500`

// RIGHT — full class name must appear in source
const cls = color === 'red' ? 'text-red-500' : 'text-blue-500'
```

---

## Topic 3: Mobile-First Table Patterns

### Pattern A: `overflow-x-auto` wrapper (recommended for admin data tables)

Minimal change, preserves existing table structure:
```tsx
<div className="overflow-x-auto rounded-xl" style={{ background: '#272729' }}>
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
    ...
  </table>
</div>
```

The container scrolls horizontally on small viewports; the table keeps its fixed column widths. Users can scroll to see all columns. Works well for data-dense admin tables where all columns have meaning.

**Add `min-w` to prevent over-squeezing:**
```tsx
<table className="w-full min-w-[600px]" style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
```

### Pattern B: Card view on mobile (responsive transform)

Hide the table on mobile, show cards instead. More work, better UX for non-admin users who care about fewer fields.

```tsx
{/* Table — hidden on mobile */}
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>

{/* Card list — shown on mobile */}
<div className="md:hidden space-y-3">
  {users.map(user => (
    <div key={user.id} className="rounded-xl p-4" style={{ background: '#272729' }}>
      <p className="font-medium text-white">{user.name}</p>
      <p className="text-sm text-white/60">{user.email}</p>
      ...
    </div>
  ))}
</div>
```

### When to use which

| Scenario | Approach |
|---|---|
| Admin-only table (staff sees all columns) | `overflow-x-auto` — simpler, faster |
| User-facing list (fewer required fields) | Card view |
| Table with > 6 columns | Card view or column hiding with `hidden sm:table-cell` |
| This codebase (admin pages) | `overflow-x-auto` with `min-w` |

### Column hiding with responsive classes

For tables with some less-critical columns:
```tsx
<th className="hidden lg:table-cell">Stats</th>
<td className="hidden lg:table-cell">...</td>
```

---

## Topic 4: `useIsMobile` / `useBreakpoint` Hooks

### Option A: `window.matchMedia` (recommended — cleanest)

```ts
// hooks/use-is-mobile.ts
import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768 // matches Tailwind's `md`

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

**Advantages:** No polling, fires exactly on breakpoint cross, SSR-safe with initializer function.

### Option B: ResizeObserver on body

More verbose, fires on every resize (not just breakpoint cross). Only worth it if you need the exact pixel width.

```ts
useEffect(() => {
  const ro = new ResizeObserver(([entry]) => {
    setWidth(entry.contentRect.width)
  })
  ro.observe(document.body)
  return () => ro.disconnect()
}, [])
```

### Option C: CSS-only (no hook needed)

For purely visual concerns (show/hide, layout shift), prefer Tailwind responsive classes over JS hooks. Hooks are only needed when JS behavior must change (e.g., body scroll lock, auto-closing drawer on route change).

### Recommended for this codebase

Use `useIsMobile` only in:
- `AppShell` — to lock body scroll when drawer is open
- `ui-store` initializer — to set `sidebarOpen` default correctly

Do NOT put `useIsMobile` in every page component — use Tailwind responsive classes there instead.

---

## Topic 5: Tailwind Responsive Sidebar Layout Pattern

### The classic `ml-0` / `ml-60` pattern

```tsx
// AppShell — main content margin matches sidebar width
<div
  className={[
    'flex flex-1 flex-col overflow-hidden transition-all duration-300',
    // Mobile: no margin (sidebar is overlay, not in-flow)
    'ml-0',
    // Desktop: margin matches sidebar width
    sidebarOpen ? 'md:ml-60' : 'md:ml-[60px]'
  ].join(' ')}
>
```

**Current code uses inline style `marginLeft`** — replacing with Tailwind classes requires adding the exact widths to tailwind config or using arbitrary values `md:ml-[240px]` / `md:ml-[60px]`.

Since `240px = 60` in Tailwind's default scale (`ml-60 = 240px` when base is 4px → `60 * 4 = 240`), `ml-60` works out of the box. The collapsed `60px` maps to `ml-[60px]` (arbitrary value).

```tsx
// app-shell.tsx replacement
<div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ml-0 ${
  sidebarOpen ? 'md:ml-60' : 'md:ml-[60px]'
}`}>
```

**Remove the inline `style={{ marginLeft: ... }}`** once this is in place.

### CSS transition compatibility

Tailwind's `transition-all duration-300` handles the transition between `ml-60` and `ml-[60px]` since both are `margin-left`. This works correctly.

### Sidebar width with CSS variables (alternative)

To avoid magic numbers scattered across files:
```js
// tailwind.config.js
theme: { extend: {
  spacing: {
    'sidebar-full': '240px',
    'sidebar-mini': '60px',
  }
}}
```
Then: `md:ml-sidebar-full` / `md:ml-sidebar-mini` — readable and maintainable.

---

## Retrofit Implementation Checklist (Priority Order)

1. **Add `useIsMobile` hook** — no UI changes, enables all other steps
2. **Extend `ui-store`** — add `mobileDrawerOpen`, fix `sidebarOpen` default
3. **Retrofit `AppShell`** — replace inline `marginLeft` with Tailwind responsive classes, add backdrop
4. **Retrofit `Sidebar`** — add `-translate-x-full md:translate-x-0` for mobile, body scroll lock
5. **Wrap all admin tables** in `overflow-x-auto` container + `min-w-[600px]` on table
6. **Extend `tailwind.config.js`** — add `--ap-*` colors and sidebar spacing tokens
7. **Progressive inline style replacement** — Phase 1 (layout/spacing) across admin pages

---

## Key Pitfalls to Avoid

| Pitfall | Risk | Fix |
|---|---|---|
| One `sidebarOpen` for both desktop collapse + mobile drawer | Sidebar flashes open on mobile page load | Split into `sidebarOpen` + `mobileDrawerOpen` |
| Body scroll lock applies on desktop | Breaks sidebar's internal scroll | Gate lock behind `isMobile` check |
| Navbar `z-40` higher than sidebar `z-30` | Navbar covers open drawer | Raise sidebar to `z-40`, backdrop to `z-30` |
| Dynamic Tailwind class construction | Class purged, style breaks in prod | Always use full static class names |
| Removing inline `style` before adding Tailwind equivalent | Visual regression | Replace one-for-one, verify each step |
| `overflow-x-auto` on table element itself | Doesn't work — must be on a block container wrapping the table | Put it on a `<div>` wrapper |

---

## Unresolved Questions

1. Should the sidebar collapse state (`sidebarOpen`) persist to `localStorage`? Currently resets to `true` on every page load — user preference is lost on refresh.
2. The `admin-layout.tsx` tab nav (`/admin/exams`, `/admin/users`, etc.) uses horizontal scroll-like tab pattern — does this need mobile treatment (scrollable tabs) or are 3–5 tabs acceptable to stack/wrap?
3. Will `admin-questions-page.tsx` and `admin-exams-page.tsx` require the card view pattern rather than `overflow-x-auto`? Need to count their column counts to decide.
4. Should `useIsMobile` live in a shared `hooks/` directory or be a utility in `ui-store`? The codebase currently has no `hooks/` directory.
