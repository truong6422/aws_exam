---
spec_id: phase-01-design-tokens-and-global-styles
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - tailwind.config.js extended with full token set (typography scale, spacing, new accent color)
  - index.css updated with new base styles, component classes, and utility classes
  - Inter font loaded via @fontsource or Google Fonts link in index.html
  - All existing component classes (.field, .btn-primary, .btn-ghost, .card) refined but backward-compatible
---

# Phase 01 — Design Tokens & Global Styles

## Overview
**Priority:** Critical — must be done first
**Status:** Pending
Establish the single source of truth for the visual language: color palette, typography, spacing, shadows, and motion. Everything downstream derives from this.

## Design System Spec

### Color Palette
Keep existing `brand` (blue, already Tailwind blue-500–900 range) and `surface` tokens.
Add one subtle accent for positive/success states and a neutral semantic set:

```js
// tailwind.config.js additions
colors: {
  brand: { /* existing 50–950 — keep as-is */ },
  surface: {
    DEFAULT: '#ffffff',
    muted:   '#f8fafc',  // page background
    subtle:  '#f1f5f9',  // hover tints, table headers
    border:  '#e2e8f0',  // replaces ad-hoc gray-200
  },
  accent: {
    // Teal — used for "Practice Mode" CTA and success badges
    50:  '#f0fdfa',
    100: '#ccfbf1',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
  },
  // Semantic aliases (map to existing palette)
  // success → accent-600
  // danger  → red-600
  // warning → amber-500
}
```

### Typography
Current: Inter (already in fontFamily config).
Action: Ensure Inter is loaded (add `@fontsource/inter` or Google Fonts `<link>` in index.html).
Type scale additions:
```js
fontSize: {
  '2xs': ['0.625rem', { lineHeight: '1rem' }],   // 10px — for badges, meta
}
```

### Spacing / Radius
No new tokens needed — existing Tailwind defaults + `xl`/`2xl` overrides are sufficient.

### Shadows
Extend with one more level:
```js
boxShadow: {
  card:       '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)',
  'card-hover': '0 4px 12px 0 rgb(0 0 0 / .08), 0 2px 4px -2px rgb(0 0 0 / .06)',
  topbar:     '0 1px 0 0 rgb(0 0 0 / .06)',
  modal:      '0 20px 60px -12px rgb(0 0 0 / .18)',  // NEW — modals, dropdowns
}
```

### Motion
```js
transitionTimingFunction: {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
},
transitionDuration: {
  DEFAULT: '150ms',
  slow: '300ms',
}
```

## Changes to `index.css`

### @layer base
- Add `font-feature-settings: "cv11", "ss01"` to body (Inter optical sizing)
- Tighten scrollbar to 1px on mobile, keep 6px on desktop
- Add `::selection` highlight using `brand-100`

### @layer components (refined classes)
```css
.field {
  /* same as today + use surface.border token */
  @apply ... border-surface-border ...;
}

.btn-primary {
  /* Add focus-visible ring, keep existing hover/active */
  @apply ... focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2;
}

/* NEW */
.btn-accent {
  @apply inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2
         text-sm font-semibold text-white shadow-sm transition
         hover:bg-accent-700 active:scale-[.98]
         disabled:cursor-not-allowed disabled:opacity-50;
}

.badge {
  @apply inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium;
}
.badge-green  { @apply bg-green-100 text-green-700; }
.badge-red    { @apply bg-red-100 text-red-700; }
.badge-blue   { @apply bg-brand-100 text-brand-700; }
.badge-gray   { @apply bg-gray-100 text-gray-600; }
.badge-teal   { @apply bg-accent-100 text-accent-700; }

.stat-card {
  @apply card p-5 flex flex-col gap-1;
}
```

### @layer utilities
```css
/* Content area max widths */
.content-sm  { @apply mx-auto w-full max-w-lg; }
.content-md  { @apply mx-auto w-full max-w-2xl; }
.content-lg  { @apply mx-auto w-full max-w-4xl; }

/* Sidebar widths (keep existing) */
.sidebar-w-open   { width: 15rem; }
.sidebar-w-closed { width: 4rem;  }
```

## Affected Files

| File | Change type |
|------|------------|
| `apps/frontend/tailwind.config.js` | Extend theme: accent colors, shadow.modal, fontSize.2xs |
| `apps/frontend/src/index.css` | Add badge classes, btn-accent, stat-card, content-* utilities, refine base |
| `apps/frontend/index.html` | Add Inter font `<link>` (or install `@fontsource/inter`) |

## Implementation Steps
1. Open `tailwind.config.js` — add `accent`, `surface.border`, `shadow.modal`, `fontSize.2xs` to `theme.extend`
2. Open `index.css` — add `@layer components` additions without removing existing classes
3. Open `index.html` — add Google Fonts preconnect + Inter link (weights: 400, 500, 600, 700)
4. Verify `npm run build` has no Tailwind parse errors

## Risk
- Low. Purely additive. Existing Tailwind classes in components continue to work unchanged.

## Open Questions
- None blocking — accent teal chosen; dev can swap if another accent is preferred.
