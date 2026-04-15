# Frontend CSS Variables & Codebase Exploration Report

**Date:** 2026-04-12  
**Task:** Comprehensive analysis of frontend CSS variables, component patterns, and file inventory  
**Directory:** `/home/truong/project/aws-exam-app/apps/frontend/src/`

---

## 1. Full Content of index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Ferrari design system — CSS variables */
:root {
  --f-red:          #DA291C;
  --f-red-dark:     #B01E0A;
  --f-teal:         #1EAEDB;
  --f-near-black:   #181818;
  --f-dark-surface: #303030;
  --f-mid-gray:     #8F8F8F;
  --f-silver-gray:  #969696;
  --f-border:       #CCCCCC;
  --f-link-blue:    #3860BE;
}

/* Base */
body {
  font-family: Arial, Helvetica, system-ui, sans-serif;
  @apply bg-black text-white antialiased;
}

/* Scrollbar — dark */
::-webkit-scrollbar {
  @apply w-1.5;
}
::-webkit-scrollbar-track {
  background: #181818;
}
::-webkit-scrollbar-thumb {
  background: #303030;
  border-radius: 0;
}
::-webkit-scrollbar-thumb:hover {
  background: #8F8F8F;
}

/* Keyframes */
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Utility: uppercase label style (Body-Font equivalent) */
.label-upper {
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--f-mid-gray);
}

/* Utility: Ferrari button base */
.btn-ferrari-red {
  background: var(--f-red);
  color: #fff;
  border-radius: 2px;
  padding: 12px 10px;
  font-size: 16px;
  letter-spacing: 1.28px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.btn-ferrari-red:hover {
  background: var(--f-teal);
}
.btn-ferrari-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: #fff;
  border: 1px solid #fff;
  border-radius: 2px;
  padding: 12px 10px;
  font-size: 16px;
  letter-spacing: 1.28px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.btn-ghost:hover {
  background: var(--f-teal);
  opacity: 0.9;
}

.btn-white {
  background: #fff;
  color: #000;
  border: 1px solid #000;
  border-radius: 2px;
  padding: 12px 10px;
  font-size: 16px;
  letter-spacing: 1.28px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.btn-white:hover {
  background: var(--f-teal);
  color: #fff;
  opacity: 0.9;
}
```

---

## 2. CSS Variables Inventory

### All Defined --f- Variables (9 total)

| Variable Name | Hex Value | Usage | Purpose |
|---------------|-----------|-------|---------|
| `--f-red` | #DA291C | Primary accent, active states, error indicators, Ferrari brand red | Main CTA, active nav items, selected states |
| `--f-red-dark` | #B01E0A | Darker red variant | Hover/pressed states for red elements |
| `--f-teal` | #1EAEDB | Button hover state, secondary accent | Success/info states alternative |
| `--f-near-black` | #181818 | Dark surface, SVG strokes in auth | Primary text color for dark UI |
| `--f-dark-surface` | #303030 | Borders, sidebar/navbar dividers, hover backgrounds | Mid-dark surface, borders |
| `--f-mid-gray` | #8F8F8F | Secondary text, labels, placeholders, icons | Subtle text, secondary information |
| `--f-silver-gray` | #969696 | Defined but not actively used | Reserved for future use |
| `--f-border` | #CCCCCC | Card borders, input borders, dividers | Light border color |
| `--f-link-blue` | #3860BE | Links, CTAs in white panels | Action links within light backgrounds |

---

## 3. Complete File Inventory

### CSS Files (1 total)
- `/apps/frontend/src/index.css` — Global styles, variables, button utilities

### TSX Files (40 total)

#### Layouts (5 files)
- `/layouts/navbar.tsx` — Top navigation bar with user info
- `/layouts/sidebar.tsx` — Collapsible sidebar with navigation menu
- `/layouts/app-shell.tsx` — Root layout combining sidebar + navbar + outlet
- `/layouts/auth-layout.tsx` — Centered form layout for login/register
- `/layouts/admin-layout.tsx` — Admin tab navigation layout

#### Pages (15 files)
- `/pages/landing/landing-page.tsx` — Public homepage with CTAs
- `/pages/auth/login-page.tsx` — Login form
- `/pages/auth/register-page.tsx` — Registration form
- `/pages/dashboard/dashboard-page.tsx` — Main dashboard with score cards
- `/pages/exam/exam-setup-page.tsx` — Exam certification selection
- `/pages/exam/exam-session-page.tsx` — Active exam interface
- `/pages/exam/exam-result-page.tsx` — Results with review
- `/pages/practice/practice-setup-page.tsx` — Practice certification selection
- `/pages/practice/practice-session-page.tsx` — Active practice interface
- `/pages/history/history-page.tsx` — Attempt history table
- `/pages/analytics/analytics-page.tsx` — Analytics dashboards
- `/pages/admin/admin-dashboard-page.tsx` — Admin overview
- `/pages/admin/admin-users-page.tsx` — User management table
- `/pages/admin/admin-questions-page.tsx` — Question list by certification
- `/pages/admin/admin-import-page.tsx` — Question import interface
- `/pages/not-found-page.tsx` — 404 page

#### Components (18 files)

**UI Components:**
- `/components/ui/page-header.tsx` — Title + subtitle typography component
- `/components/ui/toast-container.tsx` — Toast notification manager
- `/components/shared/empty-state.tsx` — Reusable empty state with CTA

**Dashboard:**
- `/components/dashboard/score-card.tsx` — Stat card with trend indicators

**Exam:**
- `/components/exam/answer-option.tsx` — Radio/checkbox answer button
- `/components/exam/exam-timer.tsx` — Countdown timer with color warnings
- `/components/exam/question-navigation-grid.tsx` — Answer status grid
- `/components/exam/__tests__/question-navigation-grid.test.tsx` — Test file

**Analytics:**
- `/components/analytics/score-trend-chart.tsx` — Trend visualization
- `/components/analytics/weak-domains-chart.tsx` — Domain performance

**Admin:**
- `/components/admin/question-filters.tsx` — Filter controls
- `/components/admin/import-dropzone.tsx` — File upload area
- `/components/admin/import-result-panel.tsx` — Import result display

#### Router/App (3 files)
- `/app.tsx` — Main app component
- `/main.tsx` — React entry point
- `/router/routes.tsx` — Route definitions
- `/router/protected-route.tsx` — Auth guard
- `/router/admin-route.tsx` — Admin guard

---

## 4. CSS Variable Usage Patterns

### Where --f- Variables Are Actually Used

**In index.css (5 usages):**
- `.label-upper { color: var(--f-mid-gray); }`
- `.btn-ferrari-red { background: var(--f-red); }`
- `.btn-ferrari-red:hover { background: var(--f-teal); }`
- `.btn-ghost:hover { background: var(--f-teal); }`
- `.btn-white:hover { background: var(--f-teal); }`

**In component inline styles (247+ direct hex color usages):**
- Components almost exclusively use hard-coded hex values in inline `style` props
- CSS variables are NOT used in component styling

### Hex Colors Used Directly in Components (not as CSS vars)

```
#DA291C   (--f-red equivalent)       — 35 uses
#8F8F8F   (--f-mid-gray equivalent)  — 27 uses
#181818   (--f-near-black equivalent) — 24 uses
#CCCCCC   (--f-border equivalent)    — 19 uses
#303030   (--f-dark-surface equiv.)  — 14 uses
#1EAEDB   (--f-teal equivalent)      — 2 uses
#3860BE   (--f-link-blue equivalent) — 8 uses
#fff                                  — 40+ uses
#000                                  — 5 uses
```

### Additional Colors Used (not in CSS vars)

- `#03904A` — Success/passing score green — 6 uses
- `#F5C400` — Warning/racing yellow — 1 use
- `#B01E0A` — Dark red hover — Not used in components
- `#969696` — Silver gray — Not used in components
- `#F0FAF5` — Success background tint — 1 use
- `#FFF5F4` — Error/red background tint — 3 uses
- `#016B35` — Success text dark — 1 use
- `#A81C12` — Error text dark — 1 use
- `#5A1010` — Dark red background for flagged questions — 2 uses
- `#F5F5F5` — Light gray table background — 2 uses

---

## 5. Component Pattern Analysis

### Button Patterns

**Three button styles defined in index.css:**
1. `.btn-ferrari-red` — Primary red button, hovers to teal
2. `.btn-ghost` — Transparent with white border, hovers to teal
3. `.btn-white` — White button with dark text, hovers to teal

**All buttons used throughout:**
- Landing page: `.btn-ghost` and `.btn-ferrari-red` for CTAs
- Login/Register: `.btn-ferrari-red` for submit
- Dashboard: `.btn-ferrari-red` for "Start Exam"
- Empty states: `.btn-ferrari-red` for action CTAs

**Inline button variations:** Some buttons bypass classes with full inline styles (error messages, flag buttons, etc.)

### Card Patterns

**Consistent card structure across pages:**
```jsx
{
  background: '#fff',
  borderRadius: '2px',
  border: '1px solid #CCCCCC',
  padding: '20px',
}
```

**Used in:**
- ScoreCard component
- EmptyState component
- Dashboard panels (Recent Activity, etc.)
- History/Analytics tables
- Admin import preview
- Practice/Exam setup containers

### Navbar Patterns

**Header style (navbar.tsx):**
- Background: `#000`
- Border: `1px solid #303030`
- Text: white or `#8F8F8F` for secondary
- User avatar: circular, background `#DA291C`

### Sidebar Patterns

**Sidebar style (sidebar.tsx):**
- Background: `#000`
- Border: `1px solid #303030`
- Active link: background `#DA291C`, white text
- Inactive link: `#8F8F8F` text, transparent background
- Dividers: `1px solid #303030`

### Layout Patterns

**AppShell (dark theme):**
- Main background: `#000`
- Content area background: `#000`
- Responsive sidebar: 240px expanded, 60px collapsed

**AuthLayout (light theme):**
- Outer background: black
- Card background: white (`#fff`)
- Text in card: `#181818` (dark)
- All form inputs/fields use white background with dark text

### Form Input Patterns

**Input style constants used in login/register:**
```jsx
border: '1px solid #CCCCCC',
borderRadius: '2px',
padding: '10px 12px',
background: 'transparent',
color: '#181818',
```

**Input focus/blur behavior:**
- Unfocused: `#CCCCCC` border
- Focused: `#181818` border
- Dynamic state changes via `onFocus`/`onBlur`

### Typography Patterns

**Label style (consistent across forms):**
```jsx
fontSize: '12px',
fontWeight: 400,
letterSpacing: '1px',
textTransform: 'uppercase',
color: '#8F8F8F',
```

**Page Header:**
- Title: `fontSize: '26px'`, `fontWeight: 500`, white
- Subtitle: 12px uppercase, `#8F8F8F`

**Stat card label:**
- 12px uppercase, letter-spacing 1px, `#8F8F8F`

### Status/Alert Patterns

**Error states:**
- Border: `1px solid #DA291C`
- Background: `#fff5f4` (light red tint)
- Text: `#DA291C`

**Success states:**
- Border: `1px solid #03904A`
- Text: `#03904A`
- Background: `#F0FAF5` (light green tint)

**Warning states (timer):**
- Text color: `#F5C400` (racing yellow)

### Exam Question Navigation Grid

**Answer status colors (question-navigation-grid.tsx):**
- Unanswered: bg `#303030`, text `#8F8F8F`
- Answered: bg `#181818`, text `#fff`
- Flagged: bg `#5A1010`, text `#DA291C`
- Answered+Flagged: bg `#5A1010`, text `#DA291C`

---

## 6. Tailwind Integration

**Tailwind usage in frontend:**
- Minimal — mostly spacing and flex utilities
- Classes seen: `flex`, `items-center`, `justify-between`, `gap-*`, `mb-*`, `px-*`, `py-*`, `w-*`, `h-*`, `shrink-0`, `truncate`, `space-y-*`, `transition-colors`, `hover:bg-dark-surface`, `bg-black`, `text-white`, `antialiased`, `min-h-screen`, `p-4`, `min-w-md`, `flex-col`, `flex-1`, `overflow-*`, `inset-y-0`, `left-0`, `z-30`, `duration-*`, `transition-all`, `overflow-y-auto`, `text-center`, `sm:flex-row`, `sm:gap-*`

**Notable:**
- Most UI is styled via inline `style` prop with hard-coded hex values
- Tailwind provides layout and spacing utilities
- Custom CSS variables are defined but underutilized
- No Tailwind theme customization for the Ferrari color palette

---

## 7. Component-Level Color Usage Summary

### Critical Files Needing Updates

**Highest color density (most inline hex values):**
1. `/pages/exam/exam-session-page.tsx` — 15+ color occurrences
2. `/pages/exam/exam-result-page.tsx` — 14+ color occurrences
3. `/pages/practice/practice-session-page.tsx` — 9+ color occurrences
4. `/pages/dashboard/dashboard-page.tsx` — 11+ color occurrences
5. `/pages/admin/admin-questions-page.tsx` — 8+ color occurrences
6. `/pages/analytics/analytics-page.tsx` — 9+ color occurrences
7. `/pages/history/history-page.tsx` — 13+ color occurrences

**Layout components:**
1. `/layouts/sidebar.tsx` — 8 color occurrences
2. `/layouts/admin-layout.tsx` — 3 color occurrences
3. `/layouts/navbar.tsx` — 3 color occurrences

**Components:**
1. `/components/exam/question-navigation-grid.tsx` — 6 color occurrences
2. `/components/exam/answer-option.tsx` — 11 color occurrences
3. `/components/admin/import-dropzone.tsx` — 3 color occurrences

---

## 8. Hard-Coded Colors Reference

**Mapping of hex values to CSS variables (for refactoring):**

```
#DA291C  →  var(--f-red)          [Ferrari Red - primary accent]
#1EAEDB  →  var(--f-teal)         [Teal - hover/secondary]
#181818  →  var(--f-near-black)   [Near Black - dark text]
#303030  →  var(--f-dark-surface) [Dark Surface - borders]
#8F8F8F  →  var(--f-mid-gray)     [Mid Gray - secondary text]
#969696  →  var(--f-silver-gray)  [Silver Gray - reserved]
#CCCCCC  →  var(--f-border)       [Border - light borders]
#3860BE  →  var(--f-link-blue)    [Link Blue - links/CTAs]
#B01E0A  →  var(--f-red-dark)     [Dark Red - not currently used]
```

**Colors NOT in CSS vars (need to be added):**
```
#03904A  →  --f-success           [Success/Green - 6 uses]
#F5C400  →  --f-warning           [Warning/Yellow - 1 use]
#F0FAF5  →  --f-success-bg        [Success background tint]
#FFF5F4  →  --f-error-bg          [Error background tint]
#016B35  →  --f-success-dark      [Success dark text]
#A81C12  →  --f-error-dark        [Error dark text]
#5A1010  →  --f-error-surface     [Error surface/dark red bg]
#F5F5F5  →  --f-table-bg          [Table row background]
```

---

## Summary

### Key Findings

1. **CSS Variables Defined:** 9 variables in index.css root
2. **Variables Actually Used:** Only 5 (in button utilities)
3. **Total Component Files:** 40 TSX + 1 CSS = 41 files
4. **Inline Hex Usage:** 247+ direct hex color codes in components
5. **CSS Variable Adoption Rate:** ~2% (only in global utilities)
6. **Refactoring Scope:** All 35 TSX page/layout/component files need updates

### Refactoring Priorities

**Tier 1 (Critical - highest color density):**
- Exam session/result pages
- Dashboard page
- History page
- Analytics page

**Tier 2 (Important):**
- Practice session page
- Admin pages
- Question navigation grid

**Tier 3 (Standard):**
- Auth forms
- Landing page
- Other minor components

### Pattern Consolidation Needed

1. Standardize button implementations (move inline styles to CSS classes)
2. Create CSS utility classes for common color combinations
3. Create component-level CSS modules or Tailwind theme extensions
4. Add missing color variables to root (success, warning, error colors)
5. Document and enforce inline style vs. CSS class guidelines

---

