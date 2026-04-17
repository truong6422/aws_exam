---
id: 260416-2019-practice-community-features
title: Practice Mode Community Features
status: ready-to-cook
created: 2026-04-16
scope: medium
---

# Practice Mode Community Features

## Problem Statement

Practice Mode currently supports instant feedback but lacks community discussion.
Users cannot explain why an answer is correct, share knowledge, report wrong answers,
or bookmark difficult questions for later review. Navigation is also strictly sequential
with no way to jump between questions.

## Chosen Direction

Add four community features to Practice Mode only (no-timer mode):

1. **Community Comments** — Per-question public comments, visible only after "Show Answer".
   Optional `referenced_answer` FK so user can tag which answer option they're commenting about.
   Upvotes (one per user). No nesting — single-level replies only.
2. **Answer Report** — Flag a question answer as incorrect. One report per user per question.
   Reviewed in Django Admin. No user-facing resolution needed.
3. **Bookmark** — Toggle bookmark on any question. Persisted per-user. Visible in Practice setup
   as a "Bookmarked Only" filter.
4. **Free Navigation** — Replace sequential-only flow with a question grid (like Exam Mode).
   Question grid shows answered / unanswered / bookmarked state per cell.

## In Scope

- `Comment` model (question FK, author FK, optional referenced_answer FK, body, upvotes M2M)
- `AnswerReport` model (question FK, reporter FK, reason text, status field)
- `Bookmark` model (user FK, question FK, unique_together)
- Backend REST APIs: comment CRUD, upvote toggle, report create, bookmark toggle
- Django Admin for AnswerReport review
- Frontend: `CommentSection`, `CommentForm`, `CommentItem` components in practice session
- Frontend: `AnswerReportModal` component
- Frontend: Bookmark button in practice session (toggle + visual state)
- Frontend: Free navigation question grid for Practice Mode
- `practiceApi` additions in `exam-api.ts` for new endpoints
- `exam-store.ts` additions: `bookmarked: number[]`, `toggleBookmark` action

## Out of Scope

- Comments in Exam Mode (timer mode)
- Comment moderation UI beyond Django Admin
- Notifications
- Comment editing or deletion by users
- Nested/threaded replies (single-level only)

## Architecture Decisions

- New models go in `apps/backend/apps/questions/` (Comment, AnswerReport belong to Question domain; Bookmark is user+question junction)
- All new models inherit `TimestampedModel` (= `ModelMixin` with soft-delete + audit)
- `Answer` model is plain `models.Model` — `referenced_answer` FK on Comment references it as a nullable FK
- Comments API: `/api/v1/questions/{question_id}/comments/` (list + create) and `/api/v1/questions/comments/{id}/upvote/`
- Bookmark API: `/api/v1/questions/{question_id}/bookmark/` (POST = toggle, returns `bookmarked: bool`)
- Report API: `/api/v1/questions/{question_id}/report/` (POST = create or 409 if duplicate)
- Practice start: `startExam` already returns questions; bookmark state fetched separately as `GET /api/v1/questions/bookmarks/` (returns list of question IDs)
- Free navigation: reuse `QuestionNavigationGrid` component from `apps/frontend/src/components/exam/` with practice-specific cell coloring (answered + bookmarked)

## Test Strategy

**Backend (Django APITestCase):**
- `CommentAPITest`: create comment (authenticated), list comments (any auth), upvote toggle (idempotent), create duplicate report → 409
- `BookmarkAPITest`: toggle on/off, list bookmarks returns correct IDs
- `AnswerReportAPITest`: create report, duplicate returns 409

**Frontend (Vitest + RTL):**
- `CommentSection`: renders nothing before reveal, renders comment list after reveal
- `CommentForm`: submit disabled when empty, calls API on submit
- Bookmark button: toggles visual state on click

## Phases

| Phase | Scope | Files Owned |
|-------|-------|-------------|
| [01 Backend](phase-01-backend-models-apis.md) | Models, migrations, APIs, admin | `apps/backend/apps/questions/` |
| [02 Frontend Components](phase-02-frontend-components.md) | Comment + Report + Bookmark UI | `apps/frontend/src/components/practice/` |
| [03 Practice Session UI](phase-03-practice-session-ui.md) | Free nav, integrate components into session page | `apps/frontend/src/pages/practice/`, `apps/frontend/src/stores/exam-store.ts`, `apps/frontend/src/services/exam-api.ts` |

## Success Criteria

- [ ] After clicking "Show Answer", comment section appears with form + community comments
- [ ] Submitting a comment before reveal is blocked (form hidden)
- [ ] Upvote button on each comment, count increments on click (one per user)
- [ ] "Report wrong answer" button opens modal, submits report; duplicate shows warning
- [ ] Bookmark button on question card toggles bookmark; icon shows filled/unfilled
- [ ] Practice setup has "Bookmarked Only" checkbox filter
- [ ] Free navigation grid shows all questions; clicking jumps to that question
- [ ] Grid cells show answered (blue dot) and bookmarked (star) state
- [ ] All existing practice mode tests still pass
