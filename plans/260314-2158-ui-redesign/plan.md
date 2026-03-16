# UI Redesign — AWS Exam App

**Plan dir:** `plans/260314-2158-ui-redesign/`
**Created:** 2026-03-14
**Status:** Pending approval

---

## Overview

Full UI redesign toward a modern SaaS-style dashboard look.
Stack is locked: **React 18 + TypeScript + Tailwind CSS 3 + React Router v6 + Zustand**.
No new heavy dependencies. All business logic, routing, and API contracts stay untouched.

---

## Phase Summary

| # | Phase | Scope | Effort |
|---|-------|-------|--------|
| 1 | [Design tokens & global theme](phase-01-design-tokens-theme.md) | `tailwind.config.js`, `index.css` | S |
| 2 | [Shell & navigation](phase-02-shell-navigation.md) | `app-shell`, `sidebar`, `navbar`, `auth-layout`, `admin-layout` | M |
| 3 | [Shared UI components](phase-03-shared-components.md) | `page-header`, `toast-container`, new `stat-card`, `badge` | S |
| 4 | [Core student screens](phase-04-student-screens.md) | `dashboard`, `exam-setup`, `exam-session`, `exam-result`, `practice-setup`, `practice-session` | L |
| 5 | [Secondary screens](phase-05-secondary-screens.md) | `history`, `analytics`, auth pages (login/register) | M |
| 6 | [Admin screens](phase-06-admin-screens.md) | `admin-dashboard`, `admin-users`, `admin-questions`, `admin-import` | M |
| 7 | [Polish & QA](phase-07-polish-qa.md) | Responsive audit, a11y, micro-interactions, empty states | M |

---

## Key Decisions

- **No new component library** (shadcn, MUI, etc.) — pure Tailwind utility classes keep bundle lean
- **Sidebar stays left** — dark brand sidebar is a strong existing pattern; redesign refines it, doesn't replace it
- **Mobile**: sidebar collapses to icon-only strip; on very small screens becomes a slide-over drawer
- **Accent color**: add `emerald` (green) for pass/success feedback alongside existing `brand` (blue)
- **Typography**: keep Inter (already loaded), add font-size scale tweaks

---

## Open Questions (confirm before implementing)

1. **Inter font loading** — Currently assumed via system fallback. Should we add a `<link>` to Google Fonts / self-host? (affects Phase 1)
2. **Mobile breakpoint for sidebar** — Should `< md` collapse to hidden + hamburger overlay, or stay icon-strip? (affects Phase 2)
3. **Charts library** — Analytics page has chart placeholders. `recharts` is the lightest option that works with Tailwind colors. OK to add (Phase 5)? Or keep placeholders?
4. **Exam session layout** — Full-screen (hide sidebar) during an active exam for focus mode? Or keep shell? (affects Phase 4)
5. **Dark mode** — It's configured but not active. Include dark-mode classes during this pass or leave for a future phase?
