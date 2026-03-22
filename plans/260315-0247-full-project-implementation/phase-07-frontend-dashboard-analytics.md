---
spec_id: phase-07-frontend-dashboard-analytics
version: "1.0"
status: completed
blockedBy:
  - phase-04-backend-analytics
agents:
  - fullstack-developer
acceptance_criteria:
  - "Dashboard page shows recent 5 exam attempts with scores"
  - "Dashboard shows average score card and 'Start Exam' CTA"
  - "Analytics page displays weak domains chart per certification"
  - "Analytics page shows score trend for last 7 attempts"
  - "History page shows paginated exam attempt list"
  - "Empty states display helpful messages with CTA to start first exam"
  - "All data fetched from /api/v1/analytics/ endpoints"
---

# Phase 07 — Frontend: Dashboard & Analytics

## Overview

- **Priority**: P2 (User engagement — shows progress)
- **Depends on**: P4 (Backend analytics endpoints)
- **Blocks**: P9 (Integration Tests)
- **Description**: Wire dashboard, analytics, and history pages to real analytics API. Display exam history, score trends, and weak domain analysis.

## Related Code Files

### Modify
- `apps/frontend/src/pages/dashboard/dashboard-page.tsx` — recent attempts + stats
- `apps/frontend/src/pages/analytics/analytics-page.tsx` — weak domains + trend chart
- `apps/frontend/src/pages/history/history-page.tsx` — paginated exam list

### Create
- `apps/frontend/src/services/analytics-api.ts` — API client for analytics endpoints
- `apps/frontend/src/components/dashboard/score-card.tsx` — reusable stat card
- `apps/frontend/src/components/dashboard/recent-attempts-list.tsx` — recent 5 attempts
- `apps/frontend/src/components/analytics/weak-domains-chart.tsx` — bar chart
- `apps/frontend/src/components/analytics/score-trend-chart.tsx` — line/area chart
- `apps/frontend/src/components/shared/empty-state.tsx` — reusable empty state

### Delete
- None

## Implementation Steps

### Step 1: Create Analytics API Service

Create `services/analytics-api.ts`:

```typescript
export const analyticsApi = {
  getOverview: () => GET('/api/v1/analytics/overview/'),
  getWeakDomains: (certificationId: number) =>
    GET(`/api/v1/analytics/weak-domains/?certification_id=${certificationId}`),
  getHistory: (page?: number) =>
    GET(`/api/v1/analytics/history/?page=${page || 1}`),
}
```

Define TypeScript interfaces:
- `OverviewResponse` — matches backend OverviewSerializer
- `WeakDomainItem` — matches backend WeakDomainSerializer
- `HistoryItem` — matches backend HistoryItemSerializer

### Step 2: Create Shared Components

**`components/shared/empty-state.tsx`:**
- Props: `{ icon, title, description, actionLabel, actionHref }`
- Centered layout with icon, message, and optional CTA button
- Used across dashboard, analytics, history when no data

**`components/dashboard/score-card.tsx`:**
- Props: `{ label, value, suffix?, icon?, trend? }`
- Card with large value, label below, optional trend arrow
- Examples: "Avg Score: 74%", "Total Exams: 12", "Best Score: 89%"

### Step 3: Create Chart Components

**`components/analytics/weak-domains-chart.tsx`:**
- Props: `{ domains: WeakDomainItem[] }`
- Implementation options (pick one, simplest first):
  1. **CSS bars** (no library): horizontal bars with percentage width, colored by accuracy
  2. **Recharts** `<BarChart>`: if already in deps or needed for polish
- Each bar shows: domain name, accuracy %, colored green (>70%), yellow (50-70%), red (<50%)
- Sort weakest first (lowest accuracy at top)

**`components/analytics/score-trend-chart.tsx`:**
- Props: `{ trend: {date, score, certification_code}[] }`
- Simple line chart showing last 7 attempt scores
- X-axis: date, Y-axis: score percentage
- Passing score reference line (72% default)
- Implementation: CSS-only sparkline or Recharts `<LineChart>`

### Step 4: Wire Dashboard Page

Update `pages/dashboard/dashboard-page.tsx`:

1. On mount: fetch `analyticsApi.getOverview()`
2. Top section: 3 ScoreCards in a row
   - Total Exams: `overview.total_attempts`
   - Average Score: `overview.avg_score`%
   - Best Score: `overview.best_score`%
3. Middle section: "Start Exam" CTA button → navigates to `/exam/setup`
4. Bottom section: Recent 5 attempts list (from `overview.recent_trend`)
   - Each row: certification code, date, score badge (green if pass, red if fail)
   - "View All History" link → `/history`
5. Empty state: If `total_attempts === 0`, show EmptyState with "Take your first exam!" message

### Step 5: Wire Analytics Page

Update `pages/analytics/analytics-page.tsx`:

1. Certification selector at top (fetch from `examApi.getCertifications()`)
2. On cert selection: fetch `analyticsApi.getWeakDomains(certId)`
3. Left panel: WeakDomainsChart showing domain accuracy bars
4. Right panel: ScoreTrendChart showing last 7 attempts
5. Below: summary text — "Focus on: {weakest domain name}"
6. Empty state per section if no data

### Step 6: Wire History Page

Update `pages/history/history-page.tsx`:

1. On mount: fetch `analyticsApi.getHistory(page=1)`
2. Table/list layout:
   - Columns: Certification, Date, Score, Status, Actions
   - Score: colored badge (green ≥ pass %, red < pass %)
   - Status: "Submitted" / "Expired" badge
   - Actions: "Review" button → `/exam/{id}/result`
3. Pagination: DRF returns `{count, next, previous, results}`
   - Show page numbers or "Load More" button
   - "Previous" / "Next" navigation
4. Empty state: "No exam history yet"

### Step 7: Loading States

All pages should handle:
- **Loading**: Skeleton loaders or spinner while fetching
- **Error**: Error message with "Retry" button
- **Empty**: EmptyState component with helpful CTA

Use a simple `useQuery`-like pattern or `useState` + `useEffect` for data fetching.

## Security Considerations

- **User-scoped data**: Backend already filters by authenticated user. Frontend just displays.
- **No sensitive data in analytics**: Scores and attempt IDs are user's own data.
- **Pagination bounds**: Don't allow negative page numbers in URL manipulation.

## Acceptance Criteria

- Dashboard page shows recent 5 exam attempts with scores
- Dashboard shows average score card and "Start Exam" CTA
- Analytics page displays weak domains chart per certification
- Analytics page shows score trend for last 7 attempts
- History page shows paginated exam attempt list
- Empty states display helpful messages with CTA to start first exam
- All data fetched from /api/v1/analytics/ endpoints
