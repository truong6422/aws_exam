---
spec_id: phase-04-auth-screens
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Auth layout uses a modern split-panel or centered card pattern (not gradient-only)
  - Login and register forms use FormField component from phase 02
  - Forms show inline error state with proper styling
  - Submit button uses Button component with loading state
  - Auth layout is fully responsive (single column on mobile)
  - No changes to login/register business logic or store calls
---

# Phase 04 — Auth Screens

## Overview
**Priority:** Medium
**Status:** Pending
Redesign login and register pages. Current auth layout uses a full-screen gradient background with a centered white card. The redesign keeps the clean card structure but modernizes the visual treatment.

## AuthLayout Redesign

### Option A: Split-Panel (recommended for desktop, collapses on mobile)
```
┌──────────────┬──────────────┐
│              │              │
│  Brand panel │   Form card  │
│  (left 40%)  │  (right 60%) │
│              │              │
└──────────────┴──────────────┘
```
- Left panel: `bg-brand-600` with white logo, tagline, and subtle AWS domain badges
- Right panel: `bg-white` with the form
- On mobile (< md): left panel hidden, form takes full screen with white background

### Option B: Centered card (simpler, safer)
Keep current approach but improve:
- Background: `bg-surface-muted` (light gray) instead of dark gradient
- Card: larger, more breathable padding, subtle shadow-modal
- Logo: replace emoji with styled SVG cloud + "AWS Exam App" text

**Recommendation: Option A** — it's a distinctive improvement for a SaaS app and the layout code is straightforward. But if the dev prefers minimal changes, Option B is acceptable.

## Login Page Changes

### Visual (no logic changes)
- Replace raw `<input>` with `<FormField>` + `<input className="field" />`
- Replace submit `<button>` with `<Button variant="primary" loading={loading} />`
- Replace inline error `<div>` with a styled `ErrorAlert` inline component (2 lines, no new file needed)
- Add "Remember me" checkbox visually (state is display-only — no behavior change needed)
- Style the "No account? Register" link with better visual weight

### Markup Structure
```tsx
<form className="space-y-5" onSubmit={handleSubmit}>
  {inlineError && <ErrorAlert message={inlineError} />}

  <FormField label="Email" htmlFor="email">
    <input id="email" type="email" className="field" ... />
  </FormField>

  <FormField label="Password" htmlFor="password">
    <input id="password" type="password" className="field" ... />
  </FormField>

  <div className="flex items-center justify-between text-sm">
    <label className="flex items-center gap-2 text-gray-600">
      <input type="checkbox" className="rounded border-gray-300" />
      Remember me
    </label>
    {/* Future: forgot password link */}
  </div>

  <Button type="submit" variant="primary" loading={loading} className="w-full">
    Sign In
  </Button>

  <p className="text-center text-sm text-gray-500">
    No account?{' '}
    <Link to="/register" className="font-semibold text-brand-600 hover:underline">
      Create one
    </Link>
  </p>
</form>
```

## Register Page Changes
Mirror the login improvements. Typical register form has: Name, Email, Password, Confirm Password fields + submit.
(Current register-page.tsx is a stub — apply FormField + Button there too.)

## Affected Files

| File | Change type |
|------|------------|
| `src/layouts/auth-layout.tsx` | **MODIFY** — split-panel layout (Option A) |
| `src/pages/auth/login-page.tsx` | **MODIFY** — use FormField, Button; visual only |
| `src/pages/auth/register-page.tsx` | **MODIFY** — apply same pattern |

## Implementation Steps
1. Update `auth-layout.tsx` with split-panel structure
2. Update `login-page.tsx`: swap raw inputs → FormField, button → Button component
3. Update `register-page.tsx`: same pattern
4. Verify login flow still works end-to-end (no logic change, just markup refactor)

## Risk
- Low. Logic (handleSubmit, store calls, navigation) is untouched.
- Depends on Phase 02 (FormField, Button components).

## Open Question
- **Q3:** Split panel (Option A) or improved centered card (Option B)? See above.
