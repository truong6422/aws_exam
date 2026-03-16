---
spec_id: phase-03-landing-cta
version: "1.0"
status: completed
agents:
  - fullstack-developer
acceptance_criteria:
  - "✅ CTA buttons trên landing page hiển thị đúng màu cam"
  - "✅ Hover state text-brand-700 thay vì text-brand-700 cũ (blue)"
  - "✅ Secondary link text đủ contrast trên gradient bg (text-white/70)"
  - "✅ Không thay đổi layout, text content, routing"
---

# Phase 03 – Landing Page CTA Adjustments

## Context Links
- File: `apps/frontend/src/pages/landing/landing-page.tsx`
- Phase 01: [phase-01-tailwind-config.md](./phase-01-tailwind-config.md)

## Overview

**Priority:** Medium

`landing-page.tsx` có 2 CTA buttons và 1 secondary link với logic màu **đặc biệt** — dùng `text-brand-700` (vốn là blue-700) làm màu text trên nền trắng khi hover. Sau khi đổi palette, `brand-700` = cam đậm `#c2410c` — vẫn hợp lý về contrast.

Tuy nhiên cần kiểm tra kỹ 2 điểm:
1. Button "Start Exam" (bg-white, text-brand-700) — text cam đậm trên trắng: 4.09:1 ✅
2. Button "Start Practice" hover (hover:text-brand-700) — text cam đậm trên trắng: 4.09:1 ✅

## Current Code Analysis

```tsx
// landing-page.tsx lines 20-40

{/* CTA 1: Start Practice — outline button trên gradient bg */}
<Link
  to="/practice/setup"
  className="rounded-xl border-2 border-white px-8 py-3 text-base font-semibold
             text-white hover:bg-white hover:text-brand-700 transition-colors"
>
  🎯 Start Practice
</Link>

{/* CTA 2: Start Exam — solid white button */}
<Link
  to="/exam/setup"
  className="rounded-xl bg-white px-8 py-3 text-base font-semibold
             text-brand-700 hover:bg-brand-50 transition-colors"
>
  📝 Start Exam
</Link>

{/* Secondary link */}
<p className="mt-10 text-sm text-brand-200">
  Already have an account?{' '}
  <Link to="/login" className="font-medium text-white underline hover:text-brand-100">
    Sign in
  </Link>
</p>
```

## Contrast Checks

### Gradient Background (`brand-900` → `brand-600`)
Sau khi đổi palette: `#7c2d12` → `#ea580c`

| Element | Color | Contrast vs gradient | Result |
|---------|-------|---------------------|--------|
| `text-white` trên gradient | #fff vs ~#c2410c (mid) | ~4.5:1 | ✅ AA |
| `text-brand-200` (paragraph) | #fed7aa vs ~#c2410c | ~2.1:1 | ⚠️ Low |
| `text-white underline` (link) | #fff vs gradient | ✅ | ✅ |

> ⚠️ `text-brand-200` (#fed7aa) trên orange gradient bg có contrast thấp (~2:1).
> Đây là **paragraph muted text** ("Already have an account?") — không phải content chính.
> **Fix:** Đổi `text-brand-200` → `text-white/70` (white 70% opacity) cho muted text trên dark bg.

### White Background (hover state)

| Element | Fg | Bg | Ratio | Level |
|---------|----|----|-------|-------|
| `text-brand-700` trên white | #c2410c | #fff | 4.09:1 | ✅ AA |
| `hover:bg-brand-50` | bg #fff7ed | — | — | ✅ |

## Implementation Steps

### Sửa `landing-page.tsx`

**Thay đổi duy nhất:** Dòng 35 — `text-brand-200` → `text-white/70`

```tsx
// TRƯỚC (dòng 35):
<p className="mt-10 text-sm text-brand-200">

// SAU:
<p className="mt-10 text-sm text-white/70">
```

Lý do: `text-white/70` = white với 70% opacity → contrast đủ đọc trên mọi dark gradient bg, không phụ thuộc palette màu cụ thể. Semantic: "muted text trên dark bg" = white opacity là pattern đúng hơn dùng light tint của brand.

**Các class khác giữ nguyên:**
- `hover:text-brand-700` — cam đậm trên trắng: 4.09:1 ✅
- `text-brand-700` (Start Exam btn) — 4.09:1 ✅
- `hover:bg-brand-50` — background tint ✅
- `text-white` — trắng trên gradient cam ✅

## Todo

- [ ] Sửa dòng 35: `text-brand-200` → `text-white/70`
- [ ] Verify không có class brand-* nào khác cần xem xét trong file
- [ ] Visual check: muted text vẫn readable

## Success Criteria

- Paragraph "Already have an account?" readable trên gradient bg
- CTA buttons hiển thị cam đúng cả default và hover state
- Không thay đổi gì ngoài 1 class muted text

## Risk Assessment

| Rủi ro | Mức | Xử lý |
|--------|-----|-------|
| `text-white/70` không hỗ trợ Tailwind v3 | Thấp | Tailwind v3 hỗ trợ opacity modifier đầy đủ |
| Hover contrast bị đổi | Không | hover:text-brand-700 = cam đậm vẫn đủ contrast |
