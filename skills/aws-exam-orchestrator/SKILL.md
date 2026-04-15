---
name: aws-exam-orchestrator
description: >-
  Orchestrate Claude workflows for the aws-exam-app project (AWS exam practice web app).
  Use this skill when managing multi-step backend/frontend feature work (login, Exam
  Mode, Practice Mode, analytics) via Claude CLI. The skill listens to simple
  textual commands and optional heartbeat/system events, plans work with /plan,
  reviews plans, then drives /cook, /test, and /code-review phases step-by-step
  instead of stuffing everything into one prompt.
---

# AWS Exam Orchestrator Skill

## Scope

This skill is dedicated to the project:

- **Project path:** `/home/truong/project/aws-exam-app`
- **Tech stack:**
  - Backend: Django + DRF + PostgreSQL + Redis + Celery
  - Frontend: React + Vite + TailwindCSS + Zustand
- **Main features:**
  - Auth/Login (đã có, dùng để tham chiếu)
  - **Exam Mode** – thi thử giống AWS
  - **Practice Mode** – luyện tập có giải thích
  - History + Analytics

Use this skill **only** when working on this project.

## Goals

Instead of the user manually telling Claude each step, this skill defines a
clear orchestration pattern:

- Use **`/plan`** to get a detailed plan from Claude for a specific feature.
- The agent (Nô lệ) **reads and reviews the plan** (not the human).
- Only when the plan is reasonable, allow Claude to **`/cook`** (implement).
- After cook, drive **`/test`** and **`/code-review`**.
- Keep work small and incremental (Phase 1, Phase 2, …) instead of one giant
  prompt.

## Triggers

This skill should be used when:

- Working on any of these tasks in `aws-exam-app`:
  - `login`, `exam-mode-be`, `exam-mode-fe`, `practice-mode-be`,
    `practice-mode-fe`, `analytics`, `admin-import`.
- You see a message or command like:
  - `aws-exam plan exam-mode`
  - `aws-exam cook exam-mode backend`
  - `aws-exam status`
- A system/heartbeat event indicates ongoing work for this project, e.g.:
  - `heartbeat:aws-exam-app`

When in doubt: if the task is about **coordinating Claude** for this project,
this skill applies.

## Core Workflow

All work should follow this pattern:

1. **PLAN phase (`/plan`)**
   - Ask Claude to propose a step-by-step plan for a **single feature**.
   - Examples of features:
     - Exam Mode backend (models + endpoints + basic tests)
     - Exam Mode frontend (flow + UI + API wiring)
     - Practice Mode backend
     - Practice Mode frontend
   - Constraints for `/plan` prompts:
     - Must **not** change any files.
     - Must list phases (Phase 1, 2, …) and affected paths.
     - Must include a short test strategy.

2. **REVIEW phase (agent-only)**
   - The agent (Nô lệ) reads the plan:
     - Check against user spec.
     - Check against current architecture (Django, DRF, React/Vite structure).
   - If the plan is unclear, too large, or risky:
     - Ask Claude to **revise the plan**, highlighting concrete issues.
   - Do **not** let Claude cook until the plan is:
     - Scoped (can be done in <= 1–2 `claude --print` runs).
     - Aligned with the project’s README/CLAUDE.md.

3. **COOK phase (`/cook`)**
   - Only for the **approved plan** and a **single phase**.
   - Use `claude --permission-mode bypassPermissions --print` with a prompt:
     - Reference the specific feature + phase from the plan.
     - Restrict the scope (backend-only or frontend-only for that run).
   - After cook, Claude must print a report:
     - Files created/modified.
     - Any migrations.
     - How to run tests/dev server.

4. **TEST phase (`/test`)**
   - Use dedicated prompts to run and, if needed, fix tests.
   - Backend:
     - `pytest` for specific apps (exams, questions, analytics,…).
   - Frontend:
     - `npm run build` or targeted tests when introduced.
   - If tests fail:
     - Use `/fix`-style prompts with the failing logs.

5. **CODE-REVIEW phase (`/code-review`)**
   - Ask Claude to review its own changes:
     - Highlight complexity, naming, duplication.
     - Suggest small improvements without changing behavior.
   - Optionally run a final `/cook` with “refactor only” scope.

6. **STATUS / REPORT phase**
   - On request (`aws-exam status`) or at logical checkpoints:
     - Summarize which tasks are:
       - `planned`, `in-progress`, `testing`, `done`, `error`.
     - Include:
       - Key endpoints implemented (for backend).
       - Key pages/routes implemented (for frontend).
       - How to manually test in browser/Postman.

## State & Tracking (lightweight)

To keep track of ongoing tasks, use a small JSON file in the project, e.g.:

- `plans/aws-exam-orchestrator-state.json`

This file can store, for each task id:

- `id` – e.g. `exam-mode-be-v1`
- `feature` – e.g. `exam-mode-be`
- `phase` – one of `plan`, `waiting-review`, `cook`, `test`, `done`, `error`
- `projectPath` – always `/home/truong/project/aws-exam-app`
- `summary` – short human-readable description
- `lastUpdate` – timestamp string

The agent does **not** need to implement a complex scheduler inside this
skill; it only needs enough structure to:

- Remember what is being worked on.
- Decide which prompt to send to Claude next.
- Provide clear status when asked.

## Prompt Patterns

Use these prompt patterns when calling Claude from this skill.

### 1. PLAN prompt (backend example: Exam Mode)

"""
/plan Implement Phase 1 of Exam Mode backend for aws-exam-app.

Context:
- Project path: /home/truong/project/aws-exam-app
- Tech: Django + DRF + PostgreSQL.
- Features to support:
  - Start exam for a given certification (e.g. SAA-C03).
  - Randomly select N questions across domains according to weights.
  - Track ExamAttempt and ExamAttemptAnswer.
  - Submit exam, compute score, store result.

Requirements for this /plan:
- Do NOT change any files yet.
- Propose phases (Phase 1, Phase 2, …) with clear scope.
- List django apps/files you will touch.
- Include a brief test strategy (which pytest tests to add).
"""

### 2. COOK prompt (backend example: Exam Mode Phase 1)

"""
/cook Implement Phase 1 of the approved Exam Mode backend plan.

Scope:
- Only backend code under apps/backend/.
- Create/extend models, serializers, views, and urls for ExamAttempt and
  ExamAttemptAnswer as described in the plan.
- Add minimal tests to confirm basic flows.

Constraints:
- Do not touch frontend or docker in this step.
- After implementing, print a report of files changed and how to run tests.
"""

### 3. PLAN/COOK prompts can be mirrored for frontend

Use similar patterns, but constrain scope to `apps/frontend/` and describe
pages/routes/components to update.

## When NOT to Use This Skill

- For one-off tiny fixes (e.g. change a label text, adjust a single color),
  calling full `/plan` may be overkill. In those cases, a direct `/cook` with
  a very small prompt is fine.
- For projects **other than** `/home/truong/project/aws-exam-app`.
- For shell-level maintenance not related to Claude workflows (e.g.,
  `openclaw gateway restart`).

---

Use this skill as the mental model and instruction set for orchestrating
Claude on the aws-exam-app project. All substantial feature work should flow
through the `/plan → review → /cook → /test → /code-review` pattern described
above.
