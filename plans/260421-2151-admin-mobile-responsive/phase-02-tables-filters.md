---
phase: "02"
title: "Tables, Filters & Tab Navigation"
status: ready
priority: high
blockedBy: []
files_owned:
  - apps/frontend/src/pages/admin/admin-users-page.tsx
  - apps/frontend/src/pages/admin/admin-exams-page.tsx
  - apps/frontend/src/layouts/admin-layout.tsx
  - apps/frontend/src/components/admin/question-filters.tsx
---

# Phase 02 — Tables, Filters & Tab Navigation

## Goal

Make data tables horizontally scrollable on mobile and fix the admin tab navigation overflow.

## Strategy

**Tables → `overflow-x-auto` wrapper pattern** (not card view):
- Wrapping table in `overflow-x-auto` div is low-risk (no data lost, no logic change)
- Add `min-w-[640px]` on `<table>` to ensure columns maintain readable width
- Horizontal scroll indicator works well for admin power users on mobile

**Why not card view?** The stats column in admin-users table has 3 nested lines — card view would require significant restructuring. Scroll is simpler and maintains all data visibility.

## Task Breakdown

### Task 2.1 — Admin Users Page

**File:** `apps/frontend/src/pages/admin/admin-users-page.tsx`

**Changes:**

1. **Header (PageHeader + search):** Stack vertically on mobile
   ```tsx
   // Before: flex row, space-between — overflows on small screens
   <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
   
   // After: flex-col on mobile, flex-row on md+
   <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
   ```

2. **Search input:** Full width on mobile
   ```tsx
   // Remove fixed width 220px, use responsive class
   <input
     className="w-full md:w-[220px]"
     style={{
       padding: '8px 12px',
       borderRadius: '8px',
       border: '1px solid rgba(255,255,255,0.12)',
       background: 'rgba(255,255,255,0.06)',
       color: '#fff',
       fontSize: '13px',
       outline: 'none',
     }}
   />
   ```

3. **Table wrapper:** Add overflow-x-auto
   ```tsx
   // Before: <div style={{ background: '#272729', borderRadius: '12px', overflow: 'hidden' }}>
   // After:
   <div style={{ background: '#272729', borderRadius: '12px', overflow: 'hidden' }}>
     <div className="overflow-x-auto">
       <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '13px' }}>
         ...
       </table>
     </div>
     {/* Pagination outside scroll container */}
     ...pagination...
   </div>
   ```

4. **Pagination:** Stack on very small screens
   ```tsx
   <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
     style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
   >
   ```

---

### Task 2.2 — Admin Exams Page

**File:** `apps/frontend/src/pages/admin/admin-exams-page.tsx`

**Changes:**

1. **Each certification section table:** Wrap in `overflow-x-auto`
   ```tsx
   <div className="overflow-x-auto">
     <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
       ...
     </table>
   </div>
   ```

2. **Bulk action modal:** Make mobile-friendly
   ```tsx
   // Modal overlay — already fixed positioning, but inner dialog needs width adjustment
   // Find the modal dialog div (fixed width ~560px) and change to:
   <div style={{
     background: '#272729',
     borderRadius: '12px',
     padding: '24px',
     width: '90vw',         // was fixed px
     maxWidth: '560px',     // cap at 560px on desktop
     maxHeight: '85vh',
     overflowY: 'auto',
   }}>
   ```

3. **Bulk edit toolbar** (selected count + actions): flex-wrap on mobile
   ```tsx
   // If toolbar exists: add flexWrap: 'wrap', gap: '8px'
   ```

---

### Task 2.3 — Admin Layout Tab Navigation

**File:** `apps/frontend/src/layouts/admin-layout.tsx`

**Problem:** Tabs are `display: flex` with no overflow — wrapping or clipping on narrow screens.

**Fix:** Make tab container horizontally scrollable:
```tsx
// Before:
<nav style={{ display: 'flex', gap: '0', marginBottom: '-1px' }}>

// After:
<nav
  className="flex overflow-x-auto"
  style={{
    gap: '0',
    marginBottom: '-1px',
    scrollbarWidth: 'none',  // hide scrollbar (Firefox)
    msOverflowStyle: 'none', // hide scrollbar (IE)
  }}
>
```

Add to `index.css` for WebKit scrollbar hide on tab nav:
```css
.tab-nav-scroll::-webkit-scrollbar { display: none; }
```

Add `className="tab-nav-scroll"` to nav element, or use inline style approach.

Each `NavLink` tab — add `flexShrink: 0` to prevent tabs from shrinking:
```tsx
style={({ isActive }) => ({
  flexShrink: 0,  // ADD THIS
  display: 'inline-block',
  padding: '10px 20px',
  // ... rest unchanged
})}
```

---

### Task 2.4 — Question Filters Component

**File:** `apps/frontend/src/components/admin/question-filters.tsx`

First, read the current file to understand its layout, then apply flex-wrap:

```tsx
// Filters container: add flex-wrap so filters stack on small screens
// Typical fix: change from flex row to flex-wrap row
// e.g.: className="flex flex-wrap gap-2 md:gap-3"
```

---

## Acceptance Criteria — Phase 2

- [ ] Admin users table: horizontal scroll on 375px, all 5 columns visible via scroll
- [ ] Admin users header: stacked vertically on mobile (search full width below title)
- [ ] Admin exams tables: horizontal scroll on mobile
- [ ] Bulk modal: fits within 90vw on mobile, scrollable if content overflows
- [ ] Admin layout tabs (Exams | Users | Import): scroll horizontally on mobile, no wrapping
- [ ] Question filters: wrap to next line on mobile instead of overflowing
- [ ] No visual regression on desktop (≥768px)
