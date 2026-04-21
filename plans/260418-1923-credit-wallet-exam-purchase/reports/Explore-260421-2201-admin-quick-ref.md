# Admin UI Quick Reference

## Framework Stack
- **React 18.3.1** | TypeScript 5.5.3 | Vite 5.4.2
- **Styling:** Tailwind 3.4.11 + custom inline styles (Apple dark theme)
- **State:** Zustand | Routing: React Router 6.26.2
- **i18n:** i18next (Vietnamese + English)

---

## Admin Routes Structure
```
/admin (protected: user.is_staff required)
├── /dashboard      → Admin Dashboard (stats, unlock rate)
├── /users          → User Management (search, pagination)
├── /exams          → Exam Sets (lock/unlock, pricing, bulk edit)
├── /questions      → Question Bank Browse
├── /import         → JSON Question Upload
├── /chat           → Admin-User Chat
├── /wallet         → Top-up Requests (approve/reject)
└── /settings       → System Config (Telegram, Zalo, Bank)
```

---

## File Paths (Admin-Related)

### Pages
```
/apps/frontend/src/pages/admin/
  admin-dashboard-page.tsx     (130 lines)
  admin-users-page.tsx         (160 lines)
  admin-exams-page.tsx         (470 lines) ← Most complex
  admin-questions-page.tsx     (130 lines)
  admin-import-page.tsx        (130 lines)
  admin-chat-page.tsx          (200 lines)
  admin-wallet-page.tsx        (350 lines)
  admin-settings-page.tsx      (190 lines)
```

### Layouts & Navigation
```
/apps/frontend/src/layouts/
  admin-layout.tsx             (40 lines) - Tab navigation
  sidebar.tsx                  (260 lines) - Main nav
  navbar.tsx                   (72 lines) - Top bar
  app-shell.tsx                (35 lines) - Root wrapper
```

### Components
```
/apps/frontend/src/components/admin/
  import-dropzone.tsx          - Drag-drop JSON upload
  import-result-panel.tsx      - Upload results display
  question-filters.tsx         - Filter controls

/apps/frontend/src/components/ui/
  page-header.tsx              - Title + subtitle (shared)
  toast-container.tsx          - Notifications
```

### Router & Guards
```
/apps/frontend/src/router/
  admin-route.tsx              - Guard: checks user.is_staff
  routes.tsx                   - All route definitions
  protected-route.tsx          - Auth check
```

### Styling
```
/apps/frontend/src/index.css   - Tailwind + CSS variables
/apps/frontend/tailwind.config.js
```

---

## Design System

### Colors (CSS Variables in index.css)
```
Backgrounds:
  --ap-black:     #000000
  --ap-near-black: #1d1d1f
  --ap-surface-1: #272729  (panels, cards)

Accent:
  --ap-blue:      #0071e3  (Apple Blue - ONLY accent)
  --ap-blue-bright: #2997ff

Semantic:
  --ap-success:   #1d9b5e  (green)
  --ap-error:     #e0453c  (red)
  --ap-warning:   #f5a623  (orange)
```

### Button Classes
```css
.btn-primary      Apple Blue solid, 17px
.btn-secondary    Dark fill
.btn-pill         Transparent with border
.btn-ghost        White outline on dark bg
```

### Typography
```
Heading Font: SF Pro Display (h1, h2, h3)
Body Font:    SF Pro Text
Fallback:     Helvetica Neue, Arial, sans-serif

Sizes:
  - 28px (PageHeader h1)
  - 17px (body, buttons)
  - 14px (secondary text)
  - 13px (labels)
  - 12px (captions)
  - 11px (table headers)
```

### Spacing Scale
```
8px, 12px, 16px, 20px, 24px, 32px
(all gaps, paddings, margins follow this scale)
```

---

## Inline Styles Pattern

**~95% of styling is inline `style={{...}}`**

Common pattern:
```tsx
style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  padding: '20px 24px',
  background: '#272729',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
}}
```

---

## Navigation Structure

### Sidebar (Fixed Left)
- **Expanded:** 240px | **Collapsed:** 60px
- **Logo:** "TruonglbCloud" (expanded) / "A" (collapsed)
- **User items:** Dashboard, Exam, Practice, History, Analytics, Chat
- **Admin section** (if is_staff):
  - Admin, Exam, Chat, Settings, Users, Import

### Top Navbar
- **Height:** 48px (h-12)
- **Sticky:** top-0, z-30
- **Elements:** Hamburger | Notifications | Language | User name + Avatar

### Tab Navigation (Admin Pages)
- **Location:** Under PageHeader
- **Tabs:** Exams | Users | Import
- **Style:** Horizontal, underline active state (2px solid #0071e3)

---

## Admin Pages Overview

### Dashboard
- **Stats Grid:** 4 cards (certifications, questions, users, total time)
- **Unlock Rate:** Conic gradient circle + legend
- **Quick Actions:** Import, Manage Exams, Manage Users

### Users
- **Table:** Name | Email | Role | Stats | Joined
- **Search:** 220px input (top right)
- **Pagination:** 20 rows per page
- **Columns:** Time spent, questions done, comments count

### Exams/Sets
- **Sections:** One per certification
- **Table per section:** Checkbox | Name | Questions | Price | Status | Actions
- **Inline Edit:** Price field editable
- **Buttons:** Lock/Unlock (green/red toggle)
- **Bulk Actions:** Bottom fixed bar + modal
- **Feature:** Free Incomplete Sets button

### Import
- **Dropzone:** Drag-drop JSON upload
- **Max width:** 560px (centered)
- **Upload info:** Shows cert code, domain, question count
- **Result panel:** Success/error messages

### Chat
- **Layout:** 300px sidebar (user list) + flex chat window
- **User list:** Scrollable, unread badge
- **Chat:** Bubble messages (admin: blue, user: dark)
- **Input:** Bottom form with send button
- **Poll:** Updates every 5-15s

### Wallet (Top-up Requests)
- **Filter tabs:** All | Pending | Approved | Rejected
- **Search:** By username/email
- **Table:** User | Transaction | Credits | VND | Status | Date | Actions
- **Actions:** Approve | Reject (with note modal)

### Settings
- **Sections:** Telegram config + Finance config
- **Telegram:** Username, Zalo phone, Bot token, Admin chat ID
- **Finance:** VND per credit, Bank account info
- **Max width:** 800px

### Questions
- **Browser:** List certification cards
- **Filter:** Certification dropdown + search
- **Card info:** Code, name, question count, time limit, passing score

---

## Responsive State: NOT IMPLEMENTED

### Current Issues
- No `@media` queries in admin code
- No Tailwind breakpoints used (`sm:`, `md:`, `lg:`)
- Fixed widths: 300px, 400px, 560px, 800px
- Sidebar: Hard-coded sizes (no mobile collapse)
- Tables: Overflow not handled
- Chat sidebar: 300px (won't fit phones)

### Available Breakpoints (Tailwind)
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Adaptive Elements Found
- Flexbox layouts (natural flow)
- Grid with `minmax()` 
- Auto-fit/auto-fill columns
- Hamburger button (but sidebar doesn't hide on mobile)

---

## Key Takeaways

1. **Framework:** React 18 + TypeScript, NOT Vue
2. **CSS:** Tailwind + inline styles (Apple theme), NOT Bootstrap
3. **Design:** Custom Apple dark theme, NOT Material UI
4. **Navigation:** Sidebar (collapsible) + tabs in admin
5. **Admin Pages:** 8 pages under `/admin`, all protected
6. **Mobile:** ZERO media queries, NOT mobile-ready
7. **Style Approach:** ~95% inline `style={{}}`, ~5% Tailwind classes
8. **i18n:** Full Vietnamese + English support
9. **Components:** Reusable PageHeader, buttons, filters
10. **State:** Zustand for UI (sidebar, toasts), AuthStore for user

---

## Next Steps for Mobile

1. Add media queries for <640px breakpoint
2. Hide/drawer sidebar on mobile
3. Convert tables to card layout on mobile
4. Stack buttons vertically on mobile
5. Use Tailwind breakpoints (`md:`, `lg:`)
6. Test on actual devices

