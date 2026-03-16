---
spec_id: phase-07-secondary-screens-and-admin
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Admin layout uses a horizontal pill-style tab navigation (not underline)
  - Admin dashboard uses StatCard components
  - Admin Users/Questions/Import pages have consistent SectionCard + table/form structure
  - 404 page is visually polished with a branded illustration area and navigation link
  - All admin pages follow same spacing and card patterns as user pages
---

# Phase 07 — Secondary Screens & Admin

## Overview
**Priority:** Medium
**Status:** Pending
Polish the admin panel and edge-case screens (404). These are lower-traffic but must be consistent.

## Admin Layout (AdminLayout)

### Current
Horizontal tab navigation with underline active state.

### Redesigned
Replace underline tabs with a **pill-style tab bar** inside a card container:

```tsx
<nav className="flex gap-1 rounded-xl bg-surface-subtle p-1 border border-surface-border">
  {TABS.map(tab => (
    <NavLink
      key={tab.to}
      to={tab.to}
      className={({ isActive }) => clsx(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-white text-brand-700 shadow-card'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60',
      )}
    >
      <tab.Icon className="h-4 w-4" />
      {tab.label}
    </NavLink>
  ))}
</nav>
```

Add top-level `PageHeader` to the admin layout so individual admin pages don't need their own:
```tsx
<div className="space-y-4">
  <PageHeader title="Admin" subtitle="Manage users, questions, and data" />
  <nav>...</nav>
  <Outlet />
</div>
```

## Admin Dashboard Page

### Changes
- Replace inline stat divs → `<StatCard>` components
- Wrap Recent Sessions table in `<SectionCard title="Recent Sessions">`
- Use same table style as History page

```tsx
<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
  <StatCard label="Total Users" value="—" icon={<IconUsers />} />
  <StatCard label="Total Questions" value="—" icon={<IconQuestion />} />
  <StatCard label="Sessions Today" value="—" icon={<IconClipboard />} />
  <StatCard label="Pass Rate" value="—%" icon={<IconChart />} />
</div>
```

## Admin Users Page

### Structure (stub redesign)
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-base font-semibold text-gray-900">Users</h2>
      <p className="text-sm text-gray-500">Manage user accounts and roles</p>
    </div>
    <Button variant="primary" leftIcon={<IconPlus />}>Invite User</Button>
  </div>

  <SectionCard>
    <div className="mb-3">
      <input type="search" className="field max-w-xs" placeholder="Search users…" />
    </div>
    <table className="w-full text-sm">
      <thead className="border-b border-surface-border bg-surface-subtle">
        <tr>
          <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th>
        </tr>
      </thead>
      <tbody>
        <EmptyState title="No users yet" />
      </tbody>
    </table>
  </SectionCard>
</div>
```

## Admin Questions Page

### Structure (stub redesign)
Same pattern as Users: header + search bar + table in SectionCard.
Add a badge per question for difficulty/domain category.

## Admin Import Page

### Structure (stub redesign)
```tsx
<SectionCard title="Import Questions">
  <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-surface-muted py-12">
    <IconUpload className="h-10 w-10 text-gray-300" />
    <div className="text-center">
      <p className="text-sm font-medium text-gray-700">Drop a JSON or CSV file</p>
      <p className="text-xs text-gray-400 mt-1">or click to browse</p>
    </div>
    <Button variant="ghost">Browse Files</Button>
  </div>
</SectionCard>
```

## 404 Not Found Page

### Current: unknown (stub)
### Redesigned:
```tsx
// No layout wrapper — standalone centered page
<div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted p-6 text-center">
  <div className="text-7xl font-black text-brand-100 select-none">404</div>
  <h1 className="mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
  <p className="mt-2 text-sm text-gray-500 max-w-xs">
    The page you're looking for doesn't exist or has been moved.
  </p>
  <div className="mt-6 flex gap-3">
    <LinkButton to="/dashboard" variant="primary">Back to Dashboard</LinkButton>
    <Button variant="ghost" onClick={() => window.history.back()}>Go Back</Button>
  </div>
</div>
```

## Affected Files

| File | Change type |
|------|------------|
| `src/layouts/admin-layout.tsx` | **MODIFY** — pill tabs, add PageHeader |
| `src/pages/admin/admin-dashboard-page.tsx` | **MODIFY** — StatCard, SectionCard for table |
| `src/pages/admin/admin-users-page.tsx` | **MODIFY** — structured stub with search + table |
| `src/pages/admin/admin-questions-page.tsx` | **MODIFY** — structured stub with search + table |
| `src/pages/admin/admin-import-page.tsx` | **MODIFY** — file drop zone UI |
| `src/pages/not-found-page.tsx` | **MODIFY** — polished 404 page |

## Implementation Steps
1. Update `admin-layout.tsx`: pill-nav tabs + PageHeader
2. Update `admin-dashboard-page.tsx`: StatCard grid + SectionCard table
3. Update `admin-users-page.tsx`, `admin-questions-page.tsx`, `admin-import-page.tsx`: consistent structure
4. Update `not-found-page.tsx`: branded 404

## Risk
- Low. All admin pages are stubs with no real data/logic.
