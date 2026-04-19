# Brainstorm v02

- Generated: `2026-04-18T12:23:27+00:00`
- Source: `brainstorm`
## Topic

- credit-wallet-exam-purchase

## Session Summary

- Wallet + CreditTransaction + TopUpRequest (manual Telegram approval) + UserExamUnlock (per-user). ExamSet +price_credits. SystemConfig for telegram/bank/exchange-rate. Access logic: is_locked=hard-block, price_credits=0 free, >0 needs UserExamUnlock. Apps: wallet/, questions/ extended, config/. API: /wallet/, /wallet/topup/, /questions/sets/{id}/purchase/, /admin/topup-requests/. Frontend: wallet page + exam price badges. Django Admin + React Admin both.

## Architecture Direction

- Favor additive changes and reuse existing workflow artifacts.
- Keep plan-status as the only progress source of truth.
- Lock design direction before planning implementation details.

## UI Direction

- Run ui-ux-pro-max before frontend-design during brainstorm/planning.
- Lock sitemap, screen inventory, and interaction contract before detailed visual styling.
- Capture empty/loading/error/success/disabled states in the plan.

## Information Architecture

- Identify the dominant navigation model before visual exploration.
- Group functionality by user goals, not by implementation layers.

## Sitemap

- List core routes, nested views, and cross-screen entry points.
- Include overlays as first-class surfaces when they carry meaningful tasks.

## Screen Inventory

- Inventory pages, tabs, panes, modals, drawers, sheets, and notification surfaces.
- Mark which surfaces are persistent, contextual, or transient.

## Primary User Flows

- Map the happy path, empty-start path, and recovery path for each critical task.
- Call out state transitions that move users between screens or overlays.

## Interaction Contract

- Define how buttons, forms, tables, filters, modals, drawers, toasts, banners, and notifications behave.
- Make ownership between blocks explicit: which surface triggers, updates, confirms, or dismisses another.

## Concept Options

- Prepare 2-3 viable design directions with trade-offs before finalizing a single aesthetic.
- Ask for user sign-off when direction materially changes hierarchy, density, or brand tone.

## Dependencies

- Decision handoff must be current before /plan.
- Readiness must pass before /cook.

## Test Strategy

- Document unit/integration/regression coverage and any UI validation before implementation.

## Decision Gates

- Sitemap approved or assumptions explicitly recorded.
- Primary flows and interaction contract documented before final visual system.
- Chosen design direction approved or marked as a blocking decision gate.

## Decision Checkpoints

- Problem statement refined
- Chosen direction clarified
- Acceptance criteria drafted
- Risks and trade-offs captured
