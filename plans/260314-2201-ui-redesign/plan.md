# UI Redesign — AWS Exam App
**Plan ID:** 260314-2201-ui-redesign
**Status:** Pending
**Branch:** master

## Overview
Full UI redesign to a modern SaaS-style dashboard aesthetic — light theme, white + blue palette, clean typography, mobile-first responsiveness. Zero changes to business logic, routing, API contracts, or state stores.

## Tech Stack (no changes)
React 18 · TypeScript · Vite · Tailwind CSS v3 · React Router v6 · Zustand · clsx

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Design tokens & global styles | Pending | [phase-01](./phase-01-design-tokens-and-global-styles.md) |
| 2 | Reusable UI component library | Pending | [phase-02](./phase-02-reusable-ui-components.md) |
| 3 | App shell — sidebar & navbar | Pending | [phase-03](./phase-03-app-shell-sidebar-navbar.md) |
| 4 | Auth screens | Pending | [phase-04](./phase-04-auth-screens.md) |
| 5 | Dashboard & key user screens | Pending | [phase-05](./phase-05-dashboard-and-key-screens.md) |
| 6 | Exam & practice flows | Pending | [phase-06](./phase-06-exam-and-practice-flows.md) |
| 7 | Secondary screens & admin | Pending | [phase-07](./phase-07-secondary-screens-and-admin.md) |
| 8 | Polish, responsiveness & QA | Pending | [phase-08](./phase-08-polish-and-qa.md) |

## Key Dependencies
- Phase 1 must complete before all others (tokens are global)
- Phase 2 must complete before phases 4–7 (components used everywhere)
- Phase 3 before phases 5–7 (shell wraps all authenticated pages)
- Phases 4–7 can run in any order after 1–3

## Constraints
- Do NOT change API contracts, store interfaces, or routing structure
- Do NOT introduce a new frontend framework
- Introduce new npm deps only where clearly justified (e.g. a headless popover)
- Keep all files under 200 lines
