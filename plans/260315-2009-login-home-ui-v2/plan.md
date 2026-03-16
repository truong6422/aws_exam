# Plan: Login & Home UI Refresh (v2)

**Created:** 2026-03-15
**Branch:** master
**Scope:** UI-only — no business logic, no new features, no route changes
**Supersedes:** `plans/260315-1946-login-home-ui-v1/`

---

## Overview

Cải thiện UI cho 2 màn hình chính:
1. **Login** (`/login`) via `auth-layout.tsx` + `login-page.tsx`
2. **Home** — **Landing page** (`/`) + **Dashboard** (`/dashboard`)

Không đổi behavior, auth flow, routing, store logic, hay nội dung/chức năng.

---

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Login UI (auth layout + form) | pending | [phase-01-login-ui.md](phase-01-login-ui.md) |
| 2 | Landing Page UI | pending | [phase-02-landing-page-ui.md](phase-02-landing-page-ui.md) |
| 3 | Dashboard Page UI | pending | [phase-03-dashboard-ui.md](phase-03-dashboard-ui.md) |
| 4 | Verify (lint + typecheck + build) | pending | [phase-04-verify.md](phase-04-verify.md) |

---

## Key Constraints

- **No new npm packages** — chỉ dùng React state, Tailwind, clsx
- **No new features** — không thêm feature section, social proof, analytics widget
- **Reuse existing CSS classes** — `.field`, `.btn-primary`, `.btn-ghost`, `.card`, `.card-title` đã có trong `index.css`
- **No test framework** — project chưa có Vitest/Jest; verify = typecheck + lint + build

---

## Files In Scope

```
apps/frontend/src/
├── layouts/auth-layout.tsx            ← Phase 1
├── pages/auth/login-page.tsx          ← Phase 1
├── pages/landing/landing-page.tsx     ← Phase 2
├── pages/dashboard/dashboard-page.tsx ← Phase 3
└── (index.css nếu cần thêm util nhỏ) ← Phase 1/3
```

## Files NOT In Scope

```
stores/*, router/*, lib/*, layouts/sidebar.tsx, layouts/app-shell.tsx,
layouts/navbar.tsx, components/ui/*, pages/exam/*, pages/practice/*
```

---

## Key Dependencies

- Tailwind CSS 3.4 + custom tokens (`tailwind.config.js`)
- Brand palette: `brand-600 (#2563eb)`, `brand-900 (#1e3a8a)`, `brand-100`
- Global CSS classes: `.field`, `.btn-primary`, `.btn-ghost`, `.card`, `.card-title`
- No new npm packages
