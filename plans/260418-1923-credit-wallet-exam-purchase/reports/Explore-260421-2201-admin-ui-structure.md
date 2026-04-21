# Admin Interface Exploration Report

**Date:** 2026-04-21  
**Project:** AWS Exam App  
**Focus:** Admin UI structure, framework, design system, navigation, and responsive state

---

## 1. Frontend Framework

**Framework:** React 18.3.1 + TypeScript 5.5.3  
**Build Tool:** Vite 5.4.2  
**Routing:** React Router DOM 6.26.2  
**State Management:** Zustand 4.5.5  

**Key Dependencies:**
- **i18n:** i18next 26.0.5 + react-i18next 17.0.4 (internationalization)
- **Error Tracking:** Sentry 8.55.0
- **UI Utilities:** clsx 2.1.1

---

## 2. CSS Framework & Design System

**CSS Framework:** Tailwind CSS 3.4.11 (with PostCSS 8.4.44)

**Design System:** Custom Apple-inspired dark theme (NOT Bootstrap, NOT Material UI)

### CSS Architecture
- **Main stylesheet:** `/src/index.css`
- **Approach:** Tailwind + custom CSS classes (hybrid)
- **Preprocessor:** PostCSS with Autoprefixer

### Apple Design System Implementation
Located in `/src/index.css` with CSS variables:

**Color Palette:**
- Primary: `#0071e3` (Apple Blue) - accent only
- Dark backgrounds: `#000000`, `#1d1d1f`, `#272729`, `#262628`
- Text: `#ffffff`, various opacity levels (rgba)
- Semantic: Success `#1d9b5e`, Error `#e0453c`, Warning `#f5a623`

**Typography:**
- Display font: SF Pro Display (h1, h2, h3)
- Body font: SF Pro Text (default)
- Fallback: Helvetica Neue, Arial, sans-serif

**Button Classes:**
- `.btn-primary` - Apple Blue solid (17px, 400 weight)
- `.btn-secondary` - Dark fill
- `.btn-pill` - Transparent with border (14px)
- `.btn-ghost` - White outline on dark bg

**Utilities:**
- `.label-caption` - 12px, 400 weight, gray text
- `.spinner-small` - 20px animated spinner
- `.hover-card` - Transform + background shift

**Key CSS Pattern:** Inline `style` props (NOT className-driven)

---

## 3. Admin Pages & Routes

### Route Structure
**Base Path:** `/admin` (protected by `AdminRoute` guard - checks `user.is_staff`)

**Navigation Layer:** `AdminLayout` with horizontal tab navigation (Apple-style)

### Main Admin Pages

| Page | Route | File Path | Purpose |
|------|-------|-----------|---------|
| Dashboard | `/admin/dashboard` | `admin-dashboard-page.tsx` | Stats, unlock rate, quick actions |
| Users | `/admin/users` | `admin-users-page.tsx` | User management, search, pagination |
| Exams/Sets | `/admin/exams` | `admin-exams-page.tsx` | Lock/unlock exam sets, pricing, bulk edit |
| Import | `/admin/import` | `admin-import-page.tsx` | JSON file upload for questions |
| Chat | `/admin/chat` | `admin-chat-page.tsx` | Admin-user messaging interface |
| Wallet | `/admin/wallet` | `admin-wallet-page.tsx` | Top-up requests, approval/rejection |
| Settings | `/admin/settings` | `admin-settings-page.tsx` | Telegram, Zalo, bank config |
| Questions | `/admin/questions` | `admin-questions-page.tsx` | Browse certification question bank |

### Tab Navigation (AdminLayout)
Located: `/src/layouts/admin-layout.tsx`

Three tabs in horizontal layout:
- Exams → `/admin/exams`
- Users → `/admin/users`
- Import → `/admin/import`

Uses React Router `NavLink` with Apple-style underline (2px solid `#0071e3` when active)

---

## 4. Navigation & Sidebar Structure

### Main Sidebar
**File:** `/src/layouts/sidebar.tsx`  
**Position:** Fixed left, dark background (`#000`)

**Features:**
- Collapsible (60px collapsed, 240px expanded)
- Logo: "TruonglbCloud" (expanded) / "A" (collapsed)
- Smooth transitions on toggle

**Navigation Items for Users:**
- Dashboard, Exam, Practice, History, Analytics, Chat

**Admin Section (conditionally shown if `user.is_staff`):**
- Admin, Exam, Chat, Settings, Users, Import

**SVG Icons:** Inline custom SVG (16x16) for each nav item

**User Info Section:**
- Displays `user.name` or email
- Logout button / Login link

### Sidebar Link Component
- Active state: Blue highlight (`#2997ff`) + background tint
- Truncates text when collapsed
- Uses `clsx` + inline styles

### Top Navbar
**File:** `/src/layouts/navbar.tsx`  
**Position:** Sticky, top-0, z-30  
**Background:** Glass effect (saturate 180%, blur 20px) over black

**Elements:**
- Hamburger toggle (3-line icon)
- Notification center (if authenticated)
- Language switcher
- User name + avatar circle (Apple Blue bg)

---

## 5. Admin Component Architecture

### Admin-Specific Components
**Location:** `/src/components/admin/`

| Component | File | Purpose |
|-----------|------|---------|
| ImportDropzone | `import-dropzone.tsx` | Drag-drop JSON upload area |
| ImportResultPanel | `import-result-panel.tsx` | Shows import success/errors |
| QuestionFilters | `question-filters.tsx` | Cert dropdown + search input |

### Reusable UI Components
**Location:** `/src/components/ui/`

| Component | File | Purpose |
|-----------|------|---------|
| PageHeader | `page-header.tsx` | Title + subtitle (28px, SF Pro Display) |
| ToastContainer | `toast-container.tsx` | Toast notifications |

---

## 6. Admin Page Patterns

### Common Layout Pattern
All admin pages follow this structure:
```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
  <PageHeader title={...} subtitle={...} />
  {/* Content */}
</div>
```

### Dashboard Stats
- **Card Grid:** `gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))'`
- **Colors:** Dark panel `#272729`, large 36px stat numbers
- **Unlock Rate:** Conic gradient circle (green `#1d9b5e` for success)

### Tables
- **Background:** `#272729` with border
- **Headers:** UPPERCASE, small caps, 11px, 0.5 opacity
- **Cells:** 13px, row hover effect
- **Pagination:** Bottom nav with "Trước" / "Tiếp" buttons (Vietnamese)

### Bulk Actions
- **Fixed Bottom Bar:** Position fixed, 32px from bottom, centered
- **Modal:** `position: fixed`, full screen overlay, `backdropFilter: blur(10px)`
- **Animations:** None visible (but CSS has `@keyframes` for spin/pulse)

### Price Editing (Exams Page)
- **Inline Edit:** Input field + confirm/cancel buttons
- **Status Badge:** Green if free (`#34c759`), Orange if paid (`#ff9f0a`)
- **Lock/Unlock:** Color-coded green/red buttons

---

## 7. Mobile & Responsive Design Analysis

### Current Responsive State: **MINIMAL**

**Issues Found:**
1. **No `@media` queries** in admin pages
2. **No responsive breakpoints** (no Tailwind `sm:`, `md:`, `lg:` classes)
3. **Fixed widths:** Many elements use `width: '300px'`, `maxWidth: '400px'`
4. **Sidebar:** Hard-coded 240px expanded, 60px collapsed (no mobile adaptation)
5. **Tables:** Overflow not handled; horizontal scroll would break on mobile
6. **Chat Page:** 300px sidebar won't fit on phones

### Responsive Elements Found
- **Tailwind classes used:**
  - `flex`, `flex-col`, `flex-1`, `h-screen` in app-shell
  - `flex h-12`, `items-center` in navbar
  - `h-7 w-7` for avatar circle
  
- **Flexbox layouts:** Most pages use `display: 'flex', flexDirection: 'column'`
- **Gap spacing:** Consistent use of gap for spacing (good)

### CSS Media Query Support
**Tailwind config:** Located at `/apps/frontend/tailwind.config.js`
- Default breakpoints available but NOT USED in admin code
- Only custom fonts extended in theme

### Mobile Concerns for Admin UI
1. **Sidebar toggle exists** (hamburger button) but sidebar doesn't hide on mobile
2. **Grid layouts** (`gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))'`) are responsive in nature
3. **Tables overflow:** No horizontal scroll, no truncation strategy
4. **Modal widths:** `maxWidth: '400px'` is reasonable, but some may overflow on small screens
5. **Button layouts:** Mostly row-based; no wrap handling on narrow screens

---

## 8. Admin API Service

**File:** `/src/services/admin-api.ts`

**Key Endpoints:**
- `getDashboardStats()` - Stats cards data
- `getUsers()` - Paginated user list (page_size: 20)
- `getExamSets()` - Exam sets per certification
- `updateExamSet()` - Lock/unlock, update price
- `bulkUpdateExamSets()` - Batch updates
- `importQuestions()` - Upload questions JSON
- `getChatSessions()` - Chat user list
- `getChatMessages()` - Message history
- `sendChatMessage()` - Send admin message
- `getTopUpRequests()` - Wallet requests
- `approveTopUp()`, `rejectTopUp()` - Wallet actions
- `getSystemConfig()`, `updateSystemConfig()` - Settings

---

## 9. Styling Approach Summary

### Inline Styles vs. Classes
- **~95% inline styles** using `style={{...}}`
- **~5% Tailwind classes** for layout (flex, h-screen, etc.)
- **Consistent:** All admin pages follow same pattern

### Color Consistency
- Dark backgrounds: `#272729`, `#1d1d1f`, `#262628`
- Text: `#fff`, `rgba(255,255,255,0.5-0.8)` for hierarchy
- Accents: Blue `#0071e3`, Green `#1d9b5e`, Red `#e0453c`

### Border & Shadow
- Borders: `1px solid rgba(255,255,255,0.08-0.15)`
- Shadows: `0 20px 40px rgba(0,0,0,0.4)` on modals
- Radius: `8px`, `12px`, `16px`, `20px` (consistent scale)

### Spacing Scale
- Gap/padding: `8px`, `12px`, `16px`, `20px`, `24px`, `32px`
- No random values; follows scale

---

## 10. File Structure Overview

```
apps/frontend/src/
├── pages/admin/
│   ├── admin-dashboard-page.tsx         [~130 lines, stats + UI]
│   ├── admin-users-page.tsx             [~160 lines, table + search]
│   ├── admin-exams-page.tsx             [~470 lines, bulk edit, modals]
│   ├── admin-questions-page.tsx         [~130 lines, browse questions]
│   ├── admin-import-page.tsx            [~130 lines, file upload]
│   ├── admin-chat-page.tsx              [~200 lines, messaging]
│   ├── admin-wallet-page.tsx            [~350 lines, approvals]
│   └── admin-settings-page.tsx          [~190 lines, config forms]
├── layouts/
│   ├── admin-layout.tsx                 [~40 lines, tab nav]
│   ├── sidebar.tsx                      [~260 lines, main nav]
│   ├── navbar.tsx                       [~72 lines, top bar]
│   └── app-shell.tsx                    [~35 lines, root layout]
├── components/admin/
│   ├── import-dropzone.tsx              [~110 lines]
│   ├── import-result-panel.tsx          [similar]
│   └── question-filters.tsx             [~100 lines]
├── components/ui/
│   ├── page-header.tsx                  [~40 lines]
│   └── toast-container.tsx              [...]
├── services/
│   ├── admin-api.ts                     [API client]
│   └── ...
├── stores/
│   ├── ui-store.ts                      [Sidebar toggle, toasts]
│   ├── auth-store.ts                    [User + is_staff flag]
│   └── ...
├── router/
│   ├── admin-route.tsx                  [Guard: is_staff check]
│   ├── routes.tsx                       [All routes]
│   └── protected-route.tsx              [Auth guard]
├── index.css                            [Tailwind + Apple CSS vars]
├── main.tsx                             [Entry, Sentry init]
└── i18n/
    └── config.ts                        [i18next setup]
```

---

## 11. Key Observations

### Strengths
1. **Consistent Design:** Apple dark theme applied uniformly
2. **Modular:** Each admin page is self-contained
3. **Internationalization:** Full i18n support (Vietnamese + English)
4. **Type-Safe:** TypeScript throughout
5. **Accessible Icons:** SVG-based, aria-hidden where appropriate
6. **Guard Protection:** Admin routes check `user.is_staff`

### Gaps & Recommendations
1. **Mobile Responsiveness:** NOT IMPLEMENTED
   - Sidebar doesn't collapse on mobile
   - Tables need overflow handling
   - Fixed widths should use `max-width` + breakpoints
   
2. **Media Queries:** Zero custom media queries despite Tailwind support
   
3. **Accessibility:** 
   - Missing `role` attributes on some divs
   - Modal lacks focus management
   - Language dynamic but no ARIA labels for lang switcher
   
4. **Performance:**
   - No code splitting per admin page
   - No lazy loading visible
   - Chat/wallet pages poll APIs every 5-15s
   
5. **Testing:** Only exam-related tests visible; admin pages lack unit tests

---

## 12. Current Mobile State

**Status:** NOT MOBILE-READY

**Breakpoints Available (Tailwind defaults):**
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

**Used in Admin Code:**
- NONE (0 uses of Tailwind breakpoints)

**Adaptive Elements:**
- Flexbox layouts (natural flow)
- Grid with `minmax()` (scales columns)
- Auto-fit/auto-fill (responsive column count)
- Hamburger menu exists but non-functional for mobile UX

**Required for Mobile:**
1. Sidebar → Bottom sheet or overlay on <640px
2. Tables → Vertical card layout on mobile
3. Input fields → Stack vertically
4. Buttons → Full-width on mobile
5. Modals → Full-screen on mobile, max-width on desktop

---

## 13. Design Tokens & Theme

### From `index.css` (CSS Variables)
```css
--ap-black: #000000
--ap-blue: #0071e3
--ap-surface-1: #272729  (panels)
--ap-surface-2: #262628  (cards)
--ap-success: #1d9b5e    (green)
--ap-error: #e0453c      (red)
--ap-warning: #f5a623    (orange)
```

### Font Metrics
- Base: 17px, 1.47 line-height, -0.374px letter-spacing
- H1/H2/H3: SF Pro Display (headings ≥ 20px)
- Caption: 12px, 400 weight
- Button: 17px, 400 weight (no weight variation on base)

---

## Summary Table

| Aspect | Status | Details |
|--------|--------|---------|
| **Framework** | React 18 + TS | Vite, React Router, Zustand |
| **CSS** | Tailwind + custom | Apple dark theme, inline styles |
| **Design System** | Apple-inspired | Custom CSS vars, buttons, colors |
| **Navigation** | Sidebar + tabs | Collapsible sidebar, tab nav in admin |
| **Admin Pages** | 8 pages | Dashboard, Users, Exams, Import, Chat, Wallet, Settings, Questions |
| **Responsiveness** | None | No media queries, fixed layouts |
| **Mobile CSS** | Not implemented | Tailwind available, not used |
| **Accessibility** | Partial | SVG icons, i18n, but no ARIA labels |
| **Component Reuse** | Good | PageHeader, buttons, filters shared |
| **i18n** | Full | Vietnamese + English |

---

**Generated:** 2026-04-21  
**Scope:** Admin UI structure exploration  
**Status:** Report Complete
