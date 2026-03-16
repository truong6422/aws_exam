---
spec_id: phase-02-landing-page-ui
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Nội dung/chức năng giữ nguyên (hero text, 2 CTAs, sign-in link)
  - Visual hierarchy rõ ràng hơn giữa headline, subtitle, CTAs
  - Button styling nhất quán và đẹp hơn
  - Spacing các section hợp lý
  - typecheck pass
---

# Phase 02 — Landing Page UI

## Context Links
- Source: `apps/frontend/src/pages/landing/landing-page.tsx`
- Tailwind config: `apps/frontend/tailwind.config.js`
- Brand colors: `brand-50..950`, `surface.*`

## Overview

**Priority:** High
**Status:** Pending
**Description:** Cải thiện visual hierarchy, typography, spacing, và button styling cho landing page. Giữ nguyên toàn bộ nội dung và routing.

## Current State Analysis

```tsx
// landing-page.tsx (43 lines) — hiện tại:
<div className="flex min-h-screen flex-col items-center justify-center
                bg-gradient-to-br from-brand-900 to-brand-600 p-6 text-center">
  <div className="max-w-lg">
    <span className="text-6xl">☁️</span>
    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
      AWS Exam Lab
    </h1>
    <p className="mt-3 text-lg text-brand-100 sm:text-xl">
      Practice questions & simulate real exams...
    </p>
  </div>
  <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
    <Link ... outline btn>🎯 Start Practice</Link>
    <Link ... solid white btn>📝 Start Exam</Link>
  </div>
  <p className="mt-10 text-sm text-brand-200">
    Already have an account? <Link ...>Sign in</Link>
  </p>
</div>
```

**Vấn đề cụ thể:**
1. Icon ☁️ `text-6xl` — quá lớn, không có container/glow effect
2. Gap giữa icon → title → subtitle quá đều nhau (`mt-4`, `mt-3`) — không có hierarchy rõ
3. CTA buttons: outline button màu trắng trên nền đậm — đủ đọc nhưng thiếu depth
4. Sign-in link `mt-10` — quá xa, cảm giác bị orphan
5. Không có visual separator giữa hero và CTA buttons

## Requirements

### Functional (giữ nguyên hoàn toàn)
- `Link to="/practice/setup"` — không thay đổi
- `Link to="/exam/setup"` — không thay đổi
- `Link to="/login"` — không thay đổi
- Text content: "AWS Exam Lab", subtitle, "Already have an account?", "Sign in"

### UI Changes

**Hero section:**
1. Icon: giảm xuống `text-5xl`, thêm `bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 inline-block mb-2` — tạo pill badge effect
2. Title: giữ `text-4xl sm:text-5xl font-extrabold`, thêm `leading-tight`
3. Subtitle: `text-brand-100 → text-brand-200/90`, `text-lg sm:text-xl` → giữ nhưng thêm `leading-relaxed max-w-sm mx-auto`
4. Hero wrapper: `max-w-lg` → `max-w-xl`, tăng visual breathing room

**CTA buttons:**
1. "Start Practice" (outline): `border-2 border-white text-white` + `hover:bg-white hover:text-brand-700` — thêm `shadow-lg` và `active:scale-[.98] transition-all duration-150`
2. "Start Exam" (solid white): giữ `bg-white text-brand-700` + thêm `shadow-lg hover:shadow-xl active:scale-[.98] transition-all duration-150`
3. Cả hai button: `py-3 px-8 → py-3.5 px-9` (thêm chút padding)
4. CTA wrapper: `mt-10` → `mt-12`, gap giữ nguyên

**Sign-in link:**
1. `mt-10` → `mt-8` (gần hơn với CTAs)
2. Wrap trong pill: `bg-white/10 rounded-full px-5 py-2 text-sm` để tạo "glass" effect nhẹ
3. Text `text-brand-200` → `text-white/70`, link `text-white underline` → `text-white font-semibold underline-offset-2`

## Architecture

```
landing-page.tsx
└── Full-screen gradient container
    ├── Hero block (max-w-xl)
    │   ├── ☁️ icon badge (pill/glass)     ← MODIFY: add glass bg
    │   ├── <h1> title                      ← MODIFY: leading-tight
    │   └── <p> subtitle                    ← MODIFY: leading-relaxed, max-w-sm
    ├── CTA buttons (flex row/col)
    │   ├── Start Practice (outline)        ← MODIFY: shadow, scale, padding
    │   └── Start Exam (solid white)        ← MODIFY: shadow, scale, padding
    └── Sign-in link                        ← MODIFY: glass pill, reduced mt
```

## Related Code Files

**Modify:**
- `apps/frontend/src/pages/landing/landing-page.tsx`

## Implementation Steps

1. Read `landing-page.tsx`
2. Update icon span: thêm wrapper `<span className="inline-block bg-white/10 rounded-2xl px-5 py-3 text-5xl">`
3. Update `<h1>`: thêm `leading-tight`
4. Update `<p>` subtitle: thêm `leading-relaxed max-w-sm mx-auto`, đổi `text-brand-100` → `text-brand-100/90`
5. Update hero div: `max-w-lg` → `max-w-xl`
6. Update CTA wrapper: `mt-10` → `mt-12`
7. Update "Start Practice" Link: thêm `shadow-lg active:scale-[.98] transition-all duration-150 py-3.5 px-9`
8. Update "Start Exam" Link: thêm `shadow-lg hover:shadow-xl active:scale-[.98] transition-all duration-150 py-3.5 px-9`
9. Update sign-in `<p>`: `mt-10` → `mt-8`, wrap trong `<span className="bg-white/10 rounded-full px-5 py-2 inline-block">`
10. Run `npx tsc --noEmit`

## Todo List

- [ ] Update hero icon — glass pill wrapper
- [ ] Update title/subtitle — leading, max-w
- [ ] Update CTA buttons — shadow, scale, padding
- [ ] Update sign-in link — glass pill, spacing
- [ ] Run typecheck

## Success Criteria

- Visual hierarchy rõ: icon → title lớn → subtitle nhỏ → CTAs → sign-in
- CTAs có depth (shadow, scale on active)
- Sign-in link không bị orphan
- Không break routing, không đổi content

## Risk Assessment

- **Very low risk**: chỉ className changes, không dynamic logic
- `bg-white/10` và `backdrop-blur-sm` cần Tailwind 3+ (đã có v3.4.11)

## Next Steps

→ Phase 03: Dashboard Page UI
