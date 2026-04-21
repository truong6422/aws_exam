---
phase: "03"
title: "Dashboard & Remaining Admin Pages"
status: ready
priority: medium
blockedBy: []
files_owned:
  - apps/frontend/src/pages/admin/admin-dashboard-page.tsx
  - apps/frontend/src/pages/admin/admin-import-page.tsx
  - apps/frontend/src/pages/admin/admin-settings-page.tsx
  - apps/frontend/src/pages/admin/admin-questions-page.tsx
  - apps/frontend/src/pages/admin/admin-chat-page.tsx
---

# Phase 03 — Dashboard & Remaining Admin Pages

## Goal

Polish remaining admin pages for mobile. Most fixes here are simpler — the layout foundation (Phase 1) resolves the biggest issues, and tables (Phase 2) handle data-heavy pages. This phase handles dashboard layout quirks and the remaining lighter pages.

## Task Breakdown

### Task 3.1 — Admin Dashboard Page

**File:** `apps/frontend/src/pages/admin/admin-dashboard-page.tsx`

**Current state:** Uses `gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))'` — this is already somewhat responsive but cramped on narrow screens.

**Changes:**

1. **Stat cards grid:** Already uses auto-fill — no change needed. 180px min fits 2 per row on 375px. ✅

2. **Exam Sets section (pie chart + legend):** Currently `display: flex, gap: '40px'` — chart and legend are side by side. On mobile this is cramped (120px chart + 40px gap + legend text).

   ```tsx
   // Before:
   <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
     <div style={{ width: '120px', height: '120px', ... }} />  {/* pie chart */}
     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
       ...legend...
     </div>
   </div>
   
   // After: flex-col on mobile, flex-row on md+
   <div className="flex flex-col gap-4 md:flex-row md:gap-10 md:items-center">
     <div style={{ width: '120px', height: '120px', borderRadius: '50%', flexShrink: 0, ... }} />
     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
       ...legend...
     </div>
   </div>
   ```

3. **Quick actions section:** `flexWrap: 'wrap'` already applied — no change needed. ✅

---

### Task 3.2 — Admin Import Page

**File:** `apps/frontend/src/pages/admin/admin-import-page.tsx`

Read the file first. Expected issues:
- Import dropzone may have fixed width
- Result panel may have fixed width

**Expected changes:**
```tsx
// ImportDropzone and ImportResultPanel containers:
// Add: width: '100%', maxWidth: '640px' pattern
// Or: className="w-full max-w-2xl"
```

The `ImportDropzone` component (`apps/frontend/src/components/admin/import-dropzone.tsx`) may also need `width: '100%'` instead of fixed pixel width.

Read both files and apply:
1. `width: '100%'` on container divs with fixed pixel widths
2. `maxWidth: '640px'` or similar to maintain readable line length on desktop

---

### Task 3.3 — Admin Settings Page

**File:** `apps/frontend/src/pages/admin/admin-settings-page.tsx`

Read the file first. Expected issues:
- Form fields likely have fixed widths (e.g., `width: '400px'`)
- Section cards may have fixed widths

**Expected changes:**
```tsx
// Form inputs: fixed width → full width with max-width
style={{ width: '100%', maxWidth: '400px', ... }}

// Or via className:
className="w-full md:max-w-md"
```

---

### Task 3.4 — Admin Questions Page

**File:** `apps/frontend/src/pages/admin/admin-questions-page.tsx`

**Current header:**
```tsx
<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
  <PageHeader ... />
  <button className="btn-primary" style={{ flexShrink: 0, marginTop: '4px' }}>
    + Edit
  </button>
</div>
```

**Fix:** Same pattern as admin-users header — stack on mobile:
```tsx
<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
  <PageHeader ... />
  <button className="btn-primary md:flex-shrink-0 md:mt-1">
    + Edit
  </button>
</div>
```

The certification list below (if it renders cards or rows) — read the file to check if additional overflow handling needed.

---

### Task 3.5 — Admin Chat Page

**File:** `apps/frontend/src/pages/admin/admin-chat-page.tsx`

Read the file. Chat UI typically has:
- Message list (should be full width — likely fine)
- Input bar (may have fixed width)

Apply `width: '100%'` to any fixed-width containers. Chat is likely the simplest fix in this phase.

---

## Acceptance Criteria — Phase 3

- [ ] Dashboard: Pie chart + legend stacks vertically on mobile (column layout), side by side on md+
- [ ] Dashboard: Stat cards still display in grid (2 per row minimum on 375px) ✅ (already works)
- [ ] Import page: Dropzone fills container width on mobile
- [ ] Settings page: Form fields use full width on mobile
- [ ] Questions page: Header (title + button) stacks on mobile
- [ ] Chat page: Full width on mobile, no horizontal overflow
- [ ] All pages: No horizontal overflow of the `<body>` on 375px viewport

## Notes

- Read each file before editing — don't assume the fix; verify the current structure
- Admin wallet page (`admin-wallet-page.tsx`) is disabled via `WALLET_FEATURE` flag — skip
- If any page has custom modals/dialogs: apply the same pattern as bulk modal in Phase 2 (`width: '90vw', maxWidth: '560px'`)
