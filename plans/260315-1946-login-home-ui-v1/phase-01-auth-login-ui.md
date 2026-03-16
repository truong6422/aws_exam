---
spec_id: phase-01-auth-login-ui
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - AuthLayout card có shadow rõ hơn, logo/brand section được cải thiện
  - Input fields dùng `.field` class thống nhất
  - Button dùng `.btn-primary` class thống nhất
  - Error state có icon + màu rõ ràng
  - Spacing/alignment nhất quán, dễ đọc trên mobile và desktop
  - Không thay đổi form submit, auth store, navigation logic
---

# Phase 01 — Auth Layout + Login Form UI

## Context Links
- File layout: `apps/frontend/src/layouts/auth-layout.tsx`
- File form: `apps/frontend/src/pages/auth/login-page.tsx`
- Global CSS: `apps/frontend/src/index.css`
- Auth store (KHÔNG đổi): `apps/frontend/src/stores/auth-store.ts`

---

## Overview

**Priority:** High — đây là màn hình đầu tiên người dùng nhìn thấy
**Status:** Pending

Cải thiện auth card và login form. Giữ nguyên toàn bộ behavior, chỉ thay đổi markup/class Tailwind.

---

## Current State Analysis

### `auth-layout.tsx` (18 dòng)
```tsx
// Gradient background → centered card (max-w-md) → cloud emoji + title
<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
  <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
    <div className="mb-8 text-center">
      <span className="text-4xl">☁️</span>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">AWS Exam App</h1>
      <p className="mt-1 text-sm text-gray-500">Practice makes perfect</p>
    </div>
    <Outlet />
  </div>
</div>
```
**Vấn đề:**
- Logo chỉ là emoji ☁️, thiếu visual identity
- Card padding `p-8` ổn nhưng brand header section (`mb-8`) quá đơn điệu
- Không có separator giữa header và form

### `login-page.tsx` (85 dòng)
```tsx
// Form với inline classes — KHÔNG dùng .field, .btn-primary global class
<input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
<button className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed" />
```
**Vấn đề:**
- Không tái dùng `.field`, `.btn-primary` đã định nghĩa trong `index.css`
- Error box thiếu icon, trông flat
- `focus:ring-1` không nhất quán với global `focus:ring-2` trong `:focus-visible`
- Button width: cần `w-full` explicit trên `.btn-primary`
- Thiếu padding rõ ràng giữa các section trong form

---

## Requirements

### Functional (KHÔNG đổi)
- `handleSubmit`, `login()`, `navigate('/dashboard')` — giữ nguyên
- `inlineError` state, `loading` state — giữ nguyên
- `Link` to `/register` — giữ nguyên

### UI Improvements

**`auth-layout.tsx`:**
1. Thêm accent bar màu brand ở top của card (visual anchor)
2. Cải thiện logo area: SVG cloud icon thay cho emoji, kèm brand name rõ hơn
3. Tăng contrast giữa tagline và title
4. Giữ `max-w-md`, `rounded-2xl`, gradient background

**`login-page.tsx`:**
1. Thay inline classes → dùng `.field` cho inputs
2. Thay inline classes → dùng `.btn-primary w-full` cho submit button
3. Error box: thêm icon ⚠️ / SVG trước message, padding rộng hơn
4. Label: tăng `font-medium` lên `font-semibold` nhỏ, thêm `text-gray-800`
5. Thêm `mt-1` gap rõ hơn giữa label và input
6. Register link section: cải thiện contrast màu

---

## Implementation Steps

### Step 1 — `auth-layout.tsx`

```tsx
// Thêm accent bar: <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-brand-600" />
// Thay emoji bằng SVG icon với bg circle
// Cải thiện typography của tagline
```

**Chi tiết markup:**
```tsx
<div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
  {/* Top accent */}
  <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-700" />

  <div className="p-8">
    {/* Brand header */}
    <div className="mb-8 text-center">
      {/* SVG cloud icon trong circle */}
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <svg className="h-8 w-8 text-brand-600" ...cloud path... />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">AWS Exam App</h1>
      <p className="mt-1 text-sm text-gray-500">Practice makes perfect</p>
    </div>
    <Outlet />
  </div>
</div>
```

### Step 2 — `login-page.tsx`

```tsx
// Labels: text-sm font-semibold text-gray-800
// Inputs: className="field"
// Error box: flex items-start gap-2 + warning icon SVG
// Submit button: className="btn-primary w-full"
// Register link: mt-6 pt-4 border-t border-gray-100
```

**Chi tiết error box:**
```tsx
{inlineError && (
  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" ...warning icon... />
    <span>{inlineError}</span>
  </div>
)}
```

**Chi tiết password field (tùy chọn — show/hide toggle):**
- Thêm eye icon toggle để show/hide password — state `showPassword`
- Wrapper `relative`, button `absolute right-2.5 top-1/2 -translate-y-1/2`

### Step 3 — Verify không ảnh hưởng `register-page.tsx`
- Check xem register page có cần apply cùng pattern không (nên apply đồng bộ)
- Nếu có: cùng PR apply `.field`, `.btn-primary` cho register form

---

## Related Code Files

**Modify:**
- `apps/frontend/src/layouts/auth-layout.tsx`
- `apps/frontend/src/pages/auth/login-page.tsx`
- `apps/frontend/src/pages/auth/register-page.tsx` (sync pattern)

**Do NOT modify:**
- `stores/auth-store.ts`
- `router/protected-route.tsx`
- `lib/api-client.ts`

---

## Todo List

- [ ] Read `register-page.tsx` để sync cùng pattern
- [ ] Update `auth-layout.tsx`: accent bar + SVG icon
- [ ] Update `login-page.tsx`: dùng `.field`, `.btn-primary`, cải thiện error box
- [ ] Update `register-page.tsx`: sync cùng pattern login
- [ ] Visual check: gradient background + card shadow + form đủ contrast
- [ ] Check mobile (max-w-md + p-4 wrapper) — không bị overflow

---

## Success Criteria

- Card trông modern, có visual hierarchy rõ ràng (logo → title → form → link)
- Form inputs dùng `.field` class nhất quán với codebase
- Error message dễ đọc, có icon
- Submit button nhất quán với `.btn-primary` toàn app
- Behavior 100% không thay đổi (form submit, redirect, error display)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `.field` class không đủ specificity override | Low | `.field` dùng `@apply` → sẽ work |
| SVG cloud icon không match với icon trong sidebar | Low | Tái dùng `IconCloud` từ `sidebar.tsx` hoặc copy SVG path |
| show/hide password toggle làm phức tạp | Low | Optional, skip nếu làm tăng scope |
