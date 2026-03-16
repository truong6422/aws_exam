---
spec_id: phase-02-landing-page-ui
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Hero section có visual hierarchy rõ ràng hơn (icon, title, subtitle, CTA)
  - CTA buttons có kích thước, spacing, hover state chuẩn
  - Sign-in link dễ thấy nhưng không lấn át CTA chính
  - Responsive tốt trên mobile
  - Không thay đổi routes, links
---

# Phase 02 — Landing Page UI

## Context Links
- File: `apps/frontend/src/pages/landing/landing-page.tsx`
- Routes: `/` → `LandingPage` (public, no auth)
- Links trong page: `/practice/setup`, `/exam/setup`, `/login`

---

## Overview

**Priority:** Medium
**Status:** Pending

Landing page hiện tại đã có structure tốt (full-screen gradient hero + 2 CTA). Cần tinh chỉnh:
- Visual weight của các elements
- CTA buttons sizing và hover transition
- Tagline và description text

---

## Current State Analysis

```tsx
// landing-page.tsx (43 dòng)
<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-6 text-center">
  {/* Hero */}
  <div className="max-w-lg">
    <span className="text-6xl" aria-hidden="true">☁️</span>
    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">AWS Exam Lab</h1>
    <p className="mt-3 text-lg text-brand-100 sm:text-xl">
      Practice questions & simulate real exams to ace your AWS certification.
    </p>
  </div>
  {/* CTA buttons */}
  <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
    <Link to="/practice/setup" className="rounded-xl border-2 border-white px-8 py-3 ...">🎯 Start Practice</Link>
    <Link to="/exam/setup" className="rounded-xl bg-white px-8 py-3 ...">📝 Start Exam</Link>
  </div>
  {/* Sign-in link */}
  <p className="mt-10 text-sm text-brand-200">
    Already have an account? <Link to="/login" ...>Sign in</Link>
  </p>
</div>
```

**Vấn đề:**
1. Emoji ☁️ `text-6xl` — không scalable, khác theme so với auth layout
2. Hai CTA buttons có visual weight gần bằng nhau — không rõ primary vs secondary
3. `border-2 border-white` cho outline button trông hơi thô
4. `mt-10` gaps đều nhau — thiếu rhythm
5. Hero max-width `max-w-lg` đủ rộng nhưng không có visual separator
6. Không có subtle background pattern hoặc decoration

---

## Requirements

### Functional (KHÔNG đổi)
- Links: `/practice/setup`, `/exam/setup`, `/login` — giữ nguyên
- Không thêm auth check hay redirect logic

### UI Improvements

1. **Logo/Icon area**: Thay emoji → SVG cloud icon trong circle với opacity overlay
2. **Title**: Giữ `text-4xl/5xl font-extrabold` — chỉ điều chỉnh `letter-spacing`
3. **Subtitle**: Cải thiện `text-brand-100` → `text-white/80` cho consistency
4. **CTA hierarchy**:
   - "Start Exam" = primary (bg-white, filled) → to `/exam/setup`
   - "Start Practice" = secondary (outline) → to `/practice/setup`
   - Đổi thứ tự: primary trước, secondary sau
5. **CTA sizing**: `py-3 px-8` giữ nguyên, thêm `shadow-lg` cho primary
6. **Sign-in link**: Cải thiện thành subtle divider + link rõ hơn
7. **Background**: Thêm subtle radial glow hoặc dot pattern (pure CSS/Tailwind, no image)

---

## Implementation Steps

### Step 1 — Icon + Hero section

```tsx
{/* Replace emoji with SVG in styled circle */}
<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
  <svg className="h-10 w-10 text-white" ...cloud SVG... />
</div>

<h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
  AWS Exam Lab
</h1>
<p className="mt-4 max-w-md text-lg text-white/75 sm:text-xl">
  Practice questions &amp; simulate real exams to ace your AWS certification.
</p>
```

### Step 2 — CTA Buttons (đổi thứ tự và visual weight)

```tsx
<div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-4">
  {/* PRIMARY — Start Exam */}
  <Link
    to="/exam/setup"
    className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50 hover:shadow-xl active:scale-[.98]"
  >
    Start Exam
  </Link>
  {/* SECONDARY — Start Practice */}
  <Link
    to="/practice/setup"
    className="rounded-xl border border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-[.98]"
  >
    Start Practice
  </Link>
</div>
```

**Lưu ý:** Bỏ emoji prefix trong button text — cleaner look. Nếu muốn giữ icon, dùng SVG thay emoji.

### Step 3 — Sign-in link

```tsx
<div className="mt-12 flex items-center gap-3 text-sm text-white/50">
  <div className="h-px w-16 bg-white/20" />
  <span>Already have an account?</span>
  <div className="h-px w-16 bg-white/20" />
</div>
<Link to="/login" className="mt-2 text-sm font-medium text-white/80 hover:text-white hover:underline">
  Sign in →
</Link>
```

### Step 4 — Background enhancement (optional, low effort)

```tsx
{/* Subtle radial glow at center */}
// Thêm vào wrapper div: relative overflow-hidden
// Thêm absolute element:
<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_theme(colors.brand.600/0.4)_0%,_transparent_70%)]" />
```

---

## Related Code Files

**Modify:**
- `apps/frontend/src/pages/landing/landing-page.tsx`

**Do NOT modify:**
- Router, any store

---

## Todo List

- [ ] Update hero icon: SVG trong styled circle thay emoji
- [ ] Update CTA buttons: đổi thứ tự, cải thiện visual weight
- [ ] Update sign-in link: divider + cleaner link
- [ ] (Optional) Thêm subtle radial background decoration
- [ ] Visual check responsive mobile (flex-col) và desktop (flex-row)

---

## Success Criteria

- Hero có visual hierarchy rõ: Icon → Title (largest) → Subtitle → CTA → Sign-in
- CTA primary (Start Exam) nổi bật hơn secondary (Start Practice)
- Không có emoji trong button text
- Layout giữ nguyên cấu trúc, chỉ thay đổi visual
- Sign-in link subtler nhưng vẫn accessible

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Đổi thứ tự CTA confuse user | Low | Primary exam action nên ở đầu — đây là app thi |
| backdrop-blur không support một số browser cũ | Low | Graceful fallback với `bg-white/10` |
