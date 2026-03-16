---
spec_id: phase-06-exam-and-practice-flows
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Setup pages use FormField + Button + SectionCard
  - Exam session layout has a fixed header bar (timer + progress) separate from scrollable content
  - Question card is visually prominent with large readable text
  - Answer option buttons have clear selected/hover/correct/incorrect states (visual only — no logic)
  - Navigation row (Prev/Submit/Next) is sticky at the bottom on mobile
  - Result page has a prominent score circle + pass/fail badge + domain breakdown section
  - Practice session mirrors exam session visuals with "Practice Mode" labeling
---

# Phase 06 — Exam & Practice Flows

## Overview
**Priority:** High — core UX
**Status:** Pending
The exam and practice flows are where users spend the most time. These need to be the most polished screens — readable, focused, low-distraction.

## Exam Setup Page

### Changes
- Use `content-sm` utility class for centering
- Wrap form in `<SectionCard title="Configure Your Exam">`
- Use `<FormField>` for each select
- Use `<Button variant="primary" className="w-full">Start Exam →</Button>`
- Add brief description text under each field (e.g. "Full AWS CLF-C02 exam has 65 questions")

```tsx
<div className="content-sm space-y-6">
  <PageHeader title="New Exam" subtitle="Configure and start an AWS practice exam" />
  <SectionCard title="Session Settings">
    <form className="space-y-5">
      <FormField label="Question Count" htmlFor="count"
        hint="Full CLF-C02 exam = 65 questions">
        <select id="count" className="field">...</select>
      </FormField>
      <FormField label="Domain Filter" htmlFor="domain">
        <select id="domain" className="field">...</select>
      </FormField>
      <FormField label="Time Limit" htmlFor="time">
        <select id="time" className="field">...</select>
      </FormField>
      <Button type="submit" className="w-full">Start Exam →</Button>
    </form>
  </SectionCard>
</div>
```

## Exam Session Page

### Layout Structure (no logic change)
The session page needs a **focused, distraction-free layout**:

```
┌─────────────────────────────────────────┐  ← fixed sticky header
│  [←] Exam in Progress   Q 1/65  [⏱ 89:45] │
│  ████████░░░░░░░░░░░░░░░░ 12%           │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐  ← scrollable
│                                         │
│  Which of the following best describes  │
│  the AWS Shared Responsibility Model?   │
│                                         │
├─────────────────────────────────────────┤
│  ○  A. AWS manages all security         │
│  ○  B. Customer manages physical...     │
│  ○  C. Both share responsibility...     │
│  ○  D. Security is not required...      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐  ← sticky footer
│  [← Prev]   [🚩 Flag]   [Submit Exam]  [Next →] │
└─────────────────────────────────────────┘
```

### Sticky Header
```tsx
<div className="sticky top-0 z-10 bg-white border-b border-surface-border shadow-sm px-6 py-3">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-3">
      <button onClick={() => navigate(-1)} className="btn-ghost p-2">← </button>
      <span className="text-sm font-semibold text-gray-700">Exam in Progress</span>
      <span className="badge badge-blue">Q {current} / {total}</span>
    </div>
    <div className="font-mono text-sm font-semibold text-gray-700 rounded-lg border px-3 py-1.5">
      ⏱ 90:00
    </div>
  </div>
  {/* Progress bar */}
  <div className="h-1.5 w-full rounded-full bg-surface-subtle">
    <div className="h-1.5 rounded-full bg-brand-600 transition-all" style={{ width: '0%' }} />
  </div>
</div>
```

### Question Card
```tsx
<div className="content-md py-6 space-y-4">
  <SectionCard>
    <p className="text-base font-medium leading-relaxed text-gray-900">
      {/* Question text */}
    </p>
  </SectionCard>

  {/* Answer options */}
  <div className="space-y-2.5">
    {['A', 'B', 'C', 'D'].map((opt) => (
      <button
        key={opt}
        className={clsx(
          'w-full rounded-xl border px-5 py-3.5 text-left text-sm transition-all',
          'flex items-start gap-3',
          // default
          'border-surface-border bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50',
          // selected (visual only — no logic change)
          // 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500',
        )}
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold">
          {opt}
        </span>
        <span>{opt}. —</span>
      </button>
    ))}
  </div>
</div>
```

### Sticky Footer Navigation
```tsx
<div className="sticky bottom-0 border-t border-surface-border bg-white px-6 py-3">
  <div className="content-md flex items-center justify-between">
    <Button variant="ghost">← Previous</Button>
    <div className="flex gap-2">
      <Button variant="ghost" title="Flag for review">🚩 Flag</Button>
      <Button variant="danger" onClick={...}>Submit Exam</Button>
    </div>
    <Button variant="ghost">Next →</Button>
  </div>
</div>
```

**Note:** The outer `<main>` in AppShell has `overflow-y-auto`. The session page must use `flex flex-col` and `min-h-full` to push the sticky footer to viewport bottom. This requires AppShell's `<main>` to be a flex container: `className="flex-1 overflow-y-auto flex flex-col"`. **This is a minor AppShell change — coordinate with Phase 03.**

## Practice Session Page
Mirror exam session layout exactly. Only labeling difference: "Practice Mode" badge instead of "Exam in Progress", and answer options should have a visual "explanation" reveal area below (stub div, no logic).

## Exam Result Page

### Score Circle
```tsx
<div className="flex flex-col items-center py-8">
  <div className="relative h-40 w-40">
    {/* SVG circle progress (static for now) or just big number */}
    <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-8 border-brand-100">
      <span className="text-5xl font-bold text-brand-600">—%</span>
      <span className="text-xs text-gray-400 mt-1">Score</span>
    </div>
  </div>
  {/* Pass/Fail badge */}
  <span className="mt-4 badge badge-gray text-sm px-3 py-1">Result loads in Phase 2</span>
</div>
```

### Domain Breakdown
Use a visual progress-bar list (no chart lib needed):
```tsx
{/* each domain row */}
<div className="flex items-center gap-3">
  <span className="w-32 text-xs text-gray-600 truncate">Cloud Concepts</span>
  <div className="flex-1 h-2 rounded-full bg-surface-subtle">
    <div className="h-2 rounded-full bg-brand-500" style={{ width: '0%' }} />
  </div>
  <span className="text-xs font-medium text-gray-700 w-10 text-right">—%</span>
</div>
```

## Affected Files

| File | Change type |
|------|------------|
| `src/pages/exam/exam-setup-page.tsx` | **MODIFY** — FormField, Button, SectionCard |
| `src/pages/exam/exam-session-page.tsx` | **MODIFY** — sticky header/footer, question card, answer buttons |
| `src/pages/exam/exam-result-page.tsx` | **MODIFY** — score circle, domain breakdown bars, action buttons |
| `src/pages/practice/practice-setup-page.tsx` | **MODIFY** — same as exam-setup |
| `src/pages/practice/practice-session-page.tsx` | **MODIFY** — mirror exam-session |
| `src/layouts/app-shell.tsx` | **MODIFY** — add `flex flex-col` to `<main>` (minor, coordinate with Phase 03) |

## Risk
- **Medium.** The sticky header+footer pattern requires `<main>` to be `flex flex-col`. This is a minor AppShell change that could affect other pages — verify all pages still look correct after this change.
- Answer option visuals (selected/correct/incorrect states) are markup-only. Since the session is a stub, no behavior is accidentally broken.
