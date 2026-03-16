---
spec_id: phase-07-frontend-dashboard-analytics
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Dashboard stats wired to real /api/analytics/summary/ data
  - History page shows real session list with pagination
  - Analytics page shows domain breakdown chart + trend
  - Loading/empty states handled
  - API layer functions written and typed
---

# Phase 07 — Frontend: Dashboard & Analytics (API-wired)

**Priority:** Medium
**Depends on:** Phase 00 (UI Redesign), Phase 04 (Analytics API)
**Blocks:** Phase 09 (Integration Tests)

## Overview

Wire the dashboard, history, and analytics page stubs to the real analytics API. UI components come from Phase 00. This phase adds data fetching, charting, and state management.

## Key Insights

- Dashboard is the first screen after login — must load fast
- Stat cards (total answered, accuracy %, sessions, streak) come from `/api/analytics/summary/`
- History page is paginated session list from `/api/analytics/history/`
- Analytics page shows domain breakdown (bar chart) + score trend (line chart)
- Charts: use **Recharts** (already commonly used with Tailwind React projects; add as dependency)
- Empty states are critical: new users have no data — show "Take your first exam" CTA

## Requirements

### API Client Functions (`lib/api/analytics.ts`)

```typescript
getSummary(): Promise<AnalyticsSummary>
getDomainBreakdown(): Promise<DomainScore[]>
getHistory(page?: number): Promise<PaginatedResponse<SessionHistoryItem>>
getTrends(): Promise<TrendPoint[]>
```

### TypeScript Types (`types/analytics.ts`)

```typescript
interface AnalyticsSummary {
  total_questions_answered: number
  total_correct: number
  accuracy_pct: number
  total_sessions: number
  current_streak_days: number
  top_domains: DomainScore[]
}

interface DomainScore {
  domain: string
  domain_slug: string
  questions_seen: number
  correct_count: number
  accuracy_pct: number
}

interface SessionHistoryItem {
  id: string
  mode: 'exam' | 'practice'
  score_pct: number
  passed: boolean | null
  question_count: number
  domain_name: string
  started_at: string
}

interface TrendPoint {
  session_index: number
  score_pct: number
  passed: boolean
  date: string
}
```

### Page Logic

**`DashboardPage`**
- Fetch `getSummary()` on mount
- Render: 4 stat cards (answered, accuracy, sessions, streak)
- Recent sessions mini-list (last 5 from summary or history)
- CTA banner: "Start Exam" / "Practice by Domain"
- Empty state: new user with zero sessions

**`HistoryPage`**
- Paginated list of `SessionHistoryItem`
- Filter by mode (exam/practice)
- Each row: date, mode badge, domain, score bar, pass/fail badge
- Click row → navigate to `/exam/{sessionId}/result`

**`AnalyticsPage`**
- Domain breakdown: bar chart (Recharts `BarChart`) with accuracy_pct per domain
- Score trend: line chart (Recharts `LineChart`) of last 30 sessions
- Domain table: sortable, shows questions_seen + accuracy
- Empty state when no sessions yet

### Recharts Dependency

Add to `package.json`:
```
"recharts": "^2.12.0"
```
Keep chart components isolated in `components/charts/` to avoid polluting page files.

## Architecture

```
apps/frontend/src/
├── lib/api/
│   └── analytics.ts
├── types/
│   └── analytics.ts
├── components/charts/
│   ├── domain-bar-chart.tsx       # Recharts BarChart wrapper
│   └── score-trend-chart.tsx      # Recharts LineChart wrapper
└── pages/
    ├── dashboard/
    │   └── dashboard-page.tsx
    ├── history/
    │   └── history-page.tsx
    └── analytics/
        └── analytics-page.tsx
```

## Related Code Files

**Modify:**
- `src/pages/dashboard/dashboard-page.tsx`
- `src/pages/history/history-page.tsx`
- `src/pages/analytics/analytics-page.tsx`

**Create:**
- `src/lib/api/analytics.ts`
- `src/types/analytics.ts`
- `src/components/charts/domain-bar-chart.tsx`
- `src/components/charts/score-trend-chart.tsx`

## Implementation Steps

1. Add `recharts` dependency
2. Define types in `types/analytics.ts`
3. Write `lib/api/analytics.ts`
4. Write `components/charts/domain-bar-chart.tsx` (Recharts, Tailwind colors)
5. Write `components/charts/score-trend-chart.tsx`
6. Implement `DashboardPage`: fetch summary, render stat cards + recent sessions + CTA
7. Implement `HistoryPage`: paginated list with filter
8. Implement `AnalyticsPage`: charts + domain table
9. Handle loading skeletons and empty states on all pages

## Success Criteria

- Dashboard loads real stats within 500ms (cached in Zustand or React Query if adopted)
- History pagination works
- Charts render with real data
- Empty states shown for new users
- No TypeScript errors

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Recharts bundle size | 🟡 Medium | Import only needed components (tree-shakeable) |
| Chart re-renders on resize | 🟢 Low | Use `ResponsiveContainer` from Recharts |
| Stale dashboard data | 🟢 Low | Refetch on navigation to dashboard |
