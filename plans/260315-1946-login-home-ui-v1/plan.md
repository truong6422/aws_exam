# Plan: Login & Home UI Refresh (v1)

**Created:** 2026-03-15
**Branch:** master
**Scope:** UI-only — no business logic, no new features, no route changes

---

## Overview

Làm sạch và nâng cấp UI cho 2 màn hình:
1. **Login** (`/login`) — cải thiện auth card, form inputs, error state
2. **Home** — gồm cả **Landing page** (`/`) và **Dashboard** (`/dashboard`)

Không đổi behavior, auth flow, routing, hay store logic.

---

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Auth Layout + Login Form | pending | [phase-01-auth-login-ui.md](phase-01-auth-login-ui.md) |
| 2 | Landing Page UI | pending | [phase-02-landing-page-ui.md](phase-02-landing-page-ui.md) |
| 3 | Dashboard Page UI | pending | [phase-03-dashboard-ui.md](phase-03-dashboard-ui.md) |
| 4 | Shared UI Components | pending | [phase-04-shared-ui-components.md](phase-04-shared-ui-components.md) |
| 5 | Tests | pending | [phase-05-tests.md](phase-05-tests.md) |

---

## Key Dependencies

- Tailwind CSS 3.4 + custom tokens (`tailwind.config.js`)
- Global CSS classes: `.field`, `.btn-primary`, `.btn-ghost`, `.card` (`index.css`)
- Brand palette: `brand-600 (#2563eb)`, `brand-900 (#1e3a8a)`
- No new npm packages — dùng những gì đang có

---

## Files In Scope

```
apps/frontend/src/
├── layouts/auth-layout.tsx          ← Phase 1
├── pages/auth/login-page.tsx        ← Phase 1
├── pages/landing/landing-page.tsx   ← Phase 2
├── pages/dashboard/dashboard-page.tsx ← Phase 3
├── layouts/navbar.tsx               ← Phase 3 (minor)
├── layouts/app-shell.tsx            ← Phase 3 (minor)
├── components/ui/page-header.tsx    ← Phase 4 (enhance)
└── index.css                        ← Phase 4 (add utility classes nếu cần)
```

## Files NOT In Scope

```
stores/*, router/*, lib/api-client.ts, layouts/sidebar.tsx (functional, giữ nguyên)
```
