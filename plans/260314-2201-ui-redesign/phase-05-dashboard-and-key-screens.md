---
spec_id: phase-05-dashboard-and-key-screens
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Dashboard uses StatCard component for all 4 stat tiles
  - Dashboard has a CTA banner or hero section with clear "Start Exam" / "Practice" actions
  - History page has a properly styled table with alternating rows and filter bar
  - Analytics page has styled placeholder chart areas with correct aspect ratios
  - All pages use SectionCard for titled content sections
  - All pages use EmptyState component for zero-data states
---

# Phase 05 — Dashboard & Key User Screens

## Overview
**Priority:** High
**Status:** Pending
Redesign the three main user-facing screens: Dashboard, History, Analytics. These are the most-visited pages post-login.

## Dashboard Page

### Current Issues
- Stat cards use emoji icons (📝🎯✅📚) — looks low-quality
- Quick action buttons are small inline links — low visual hierarchy
- "Recent Activity" is a bare placeholder div

### Redesigned Layout
```
┌─────────────────────────────────────────┐
│  Welcome back, Name!                    │
│  Sunday, 14 March 2026                 │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │  📋 Ready for your next exam?       ││
│  │  [Start Exam →]  [Practice Mode →]  ││
│  └─────────────────────────────────────┘│
├────────┬────────┬────────┬──────────────┤
│Exams   │Avg     │Pass    │Practice      │
│Taken   │Score   │Rate    │Sets          │
│  —     │  —%    │  —%    │  —           │
├─────────────────────────────────────────┤
│  Recent Activity                        │
│  [empty state with CTA]                 │
└─────────────────────────────────────────┘
```

### Stat Cards
Replace inline divs with `<StatCard>` component. Add an SVG icon (from sidebar icon set) instead of emoji.

### Hero CTA Banner
```tsx
<SectionCard className="bg-gradient-to-r from-brand-600 to-brand-700 border-none text-white">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-white">Ready to practice?</h2>
      <p className="text-sm text-brand-100 mt-0.5">You haven't taken an exam yet.</p>
    </div>
    <div className="flex gap-2">
      <LinkButton to="/exam/setup" variant="ghost" className="text-white border-white/40 hover:bg-white/10">
        Start Exam
      </LinkButton>
      <LinkButton to="/practice/setup" variant="ghost" className="bg-white text-brand-700 hover:bg-brand-50">
        Practice Mode
      </LinkButton>
    </div>
  </div>
</SectionCard>
```

### Recent Activity Section
```tsx
<SectionCard title="Recent Activity" action={<Link to="/history">View all →</Link>}>
  <EmptyState
    icon={<IconHistory />}
    title="No activity yet"
    description="Take your first exam to see results here."
    action={<LinkButton to="/exam/setup">Start Exam</LinkButton>}
  />
</SectionCard>
```

## History Page

### Redesigned Layout
```
PageHeader (title + "Export" button stub in actions)
Filter bar: [Type dropdown] [Date input] [Search input]
Table card:
  thead: Date | Mode | Score | Questions | Duration | Actions
  tbody: empty state row (EmptyState component)
```

### Table Styles
```tsx
<table className="w-full text-sm">
  <thead className="border-b border-surface-border bg-surface-subtle">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
        Date
      </th>
      ...
    </tr>
  </thead>
  <tbody className="divide-y divide-surface-border">
    {/* rows */}
  </tbody>
</table>
```

### Filter Bar
Replace raw selects with styled selects using `.field` class + a clear visual grouping:
```tsx
<div className="flex flex-wrap gap-2">
  <select className="field w-auto">...</select>
  <input type="date" className="field w-auto" />
</div>
```

## Analytics Page

### Redesigned Layout (improved placeholder)
```
PageHeader
Grid: [Score Trend (col-span-2)] [Domain Radar]
      [Weak Areas]               [Study Streak]
```

Chart placeholder areas should look intentional:
```tsx
<div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-surface-muted text-sm text-gray-400">
  <IconChart className="h-8 w-8 text-gray-300" />
  Chart data available after first exam
</div>
```

Study Streak card — use `StatCard` with the streak value.

## Affected Files

| File | Change type |
|------|------------|
| `src/pages/dashboard/dashboard-page.tsx` | **MODIFY** — StatCard, SectionCard, EmptyState, CTA banner |
| `src/pages/history/history-page.tsx` | **MODIFY** — SectionCard table wrapper, styled filter bar, EmptyState |
| `src/pages/analytics/analytics-page.tsx` | **MODIFY** — SectionCard, improved placeholder areas, StatCard for streak |

## Implementation Steps
1. Update `dashboard-page.tsx`: replace inline stat divs → StatCard, add CTA banner, update recent activity → SectionCard + EmptyState
2. Update `history-page.tsx`: wrap table in SectionCard, refine filter bar, styled table header, EmptyState in tbody
3. Update `analytics-page.tsx`: wrap each section in SectionCard, styled chart placeholder divs, StatCard for streak

## Risk
- Low. All state/API logic untouched. Only markup and component composition changes.
- Depends on Phase 02 components.
