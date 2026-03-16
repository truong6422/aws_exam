---
spec_id: phase-01-design-tokens-theme
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - tailwind.config.js extended with new semantic tokens (accent, status colors, type scale)
  - index.css updated with refined component layer classes
  - Inter font loaded via <link> (confirm with dev first)
  - All existing .card / .btn-primary / .btn-ghost / .field classes updated in-place
  - No visual regressions on pages that weren't touched
---

# Phase 01 — Design Tokens & Global Theme

## Context Links
- File: `apps/frontend/tailwind.config.js`
- File: `apps/frontend/src/index.css`
- File: `apps/frontend/index.html`

## Overview

**Priority:** Critical — everything else builds on this.
**Status:** Pending

Refine the existing design token set without breaking backward compat. The current palette (brand blue + surface) is solid. We extend it with:
- A semantic `accent` color (emerald/green) for success/pass states
- `status` tokens (warning amber, danger red) unified from ad-hoc classes
- Tighter shadow system
- Updated component layer classes

## Key Insights

- Tailwind `extend` pattern already in place — safe to add without clobbering defaults
- `shadow-card` and `shadow-card-hover` are defined but `shadow-card-hover` is never applied — adopt it on interactive cards
- `brand-900` sidebar background is good; keep it
- Emoji icons in dashboard (`📝 🎯 ✅`) should be replaced with SVGs in Phase 3 — tokens won't change

## Changes

### `tailwind.config.js`

```js
// ADD inside theme.extend.colors:
accent: {
  50:  '#ecfdf5',
  100: '#d1fae5',
  500: '#10b981',  // emerald-500 — pass badge, correct answer highlight
  600: '#059669',  // emerald-600 — success buttons
  700: '#047857',
},
status: {
  warning: '#f59e0b',   // amber-500
  danger:  '#ef4444',   // red-500
  info:    '#3b82f6',   // same as brand-500
},
```

```js
// EXTEND boxShadow — replace current values with a 3-tier system:
card:       '0 1px 3px rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)',
'card-hover':'0 4px 16px rgb(0 0 0 / .08), 0 2px 6px -2px rgb(0 0 0 / .05)',
sidebar:    '2px 0 8px rgb(0 0 0 / .08)',
modal:      '0 20px 60px rgb(0 0 0 / .15)',
```

```js
// ADD fontSize for tighter type scale (optional — only if system fonts differ)
// Keep Inter; body text 14px base, headings use Tailwind's xl/2xl/3xl
```

### `index.css`

**@layer base:**
- Set `font-size: 15px` on `html` (down from default 16px) for denser info display
- Improve scrollbar thumb to `bg-gray-200 hover:bg-gray-300` (lighter, less intrusive)

**@layer components — update in-place:**

```css
/* .field — add height consistency */
.field {
  @apply h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
         text-gray-900 placeholder-gray-400 shadow-sm transition-colors
         focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20;
}

/* .btn-primary — add height, subtle ring on focus */
.btn-primary {
  @apply inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-600
         px-4 text-sm font-semibold text-white shadow-sm transition-all
         hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
         active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50;
}

/* .btn-ghost — match height */
.btn-ghost {
  @apply inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200
         bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-all
         hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500
         focus-visible:ring-offset-2 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50;
}

/* .card — keep + add overflow-hidden for child clipping */
.card {
  @apply overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card;
}

/* .card-title — bump to base size */
.card-title {
  @apply text-base font-semibold text-gray-800;
}

/* NEW: .badge — inline label pill */
.badge {
  @apply inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium;
}
.badge-blue   { @apply bg-brand-50 text-brand-700; }
.badge-green  { @apply bg-accent-50 text-accent-700; }
.badge-red    { @apply bg-red-50 text-red-700; }
.badge-amber  { @apply bg-amber-50 text-amber-700; }
.badge-gray   { @apply bg-gray-100 text-gray-600; }

/* NEW: .divider */
.divider { @apply border-t border-gray-100; }
```

**@layer utilities:**
```css
/* Keep existing sidebar width utilities unchanged */
.sidebar-w-open   { width: 15rem; }
.sidebar-w-closed { width: 4rem; }

/* NEW: content max-width center pattern */
.content-container { @apply mx-auto max-w-5xl; }
```

### `index.html`
Add Inter font link (confirm with dev — open question #1):
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

## Implementation Steps

1. Open `tailwind.config.js` — add `accent` + `status` color keys under `theme.extend.colors`
2. Update `boxShadow` values (3-tier)
3. Open `index.css`:
   - Update base layer (font-size 15px, scrollbar)
   - Update `.field`, `.btn-primary`, `.btn-ghost`, `.card`, `.card-title` in-place
   - Add `.badge` and its modifier classes
   - Add `.divider`, `.content-container` utilities
4. Add Inter `<link>` tags to `index.html` (after dev confirms)
5. Build: `npm run build` — confirm zero type errors

## Todo

- [ ] Add `accent` color tokens to tailwind.config.js
- [ ] Add `status` color tokens
- [ ] Update `boxShadow` system
- [ ] Update `@layer base` in index.css
- [ ] Update all component layer classes in-place
- [ ] Add new badge/divider/container utilities
- [ ] Add Inter font link to index.html (pending dev confirmation)
- [ ] Run `npm run build` — confirm no errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tailwind purge misses new classes | Low | Medium | All classes used in JSX or index.css @apply — always included |
| Font CDN blocked in prod env | Low | Low | System font fallback already defined in stack |
| `border-radius xl/2xl` conflict | None | None | Already defined, values stay same |
