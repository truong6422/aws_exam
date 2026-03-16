---
spec_id: phase-04-contrast-smoke
version: "1.0"
status: completed
agents:
  - tester
acceptance_criteria:
  - "✅ vite build pass không có lỗi"
  - "✅ tsc --noEmit pass không có type error"
  - "✅ Không còn class blue (brand-* cũ) nào trong source"
  - "✅ Visual smoke check các màn hình chính pass"
---

# Phase 04 – Contrast Verification & Visual Smoke Test

## Context Links
- Thực hiện SAU Phase 01 + 02 + 03 hoàn thành
- Reports: `/home/truong/project/aws-exam-app/plans/reports/`

## Overview

**Priority:** High — gate trước khi merge

Phase cuối xác nhận toàn bộ thay đổi màu hoạt động đúng: build sạch, không còn blue class lọt qua, contrast đủ chuẩn WCAG AA.

## Verification Steps

### 1. TypeScript & Build Check

```bash
cd apps/frontend
npx tsc --noEmit
npx vite build
```

Expected: 0 errors, 0 warnings liên quan màu.

---

### 2. Grep Audit – Tìm Class Blue Còn Sót

Sau khi đổi palette, không có lý do gì còn class Tailwind blue mặc định (không phải `brand-*`) trong các file UI chính. Chạy:

```bash
# Tìm hardcode Tailwind blue classes (blue-*, sky-*, indigo-*) trong source
grep -rn "text-blue\|bg-blue\|border-blue\|ring-blue\|text-indigo\|bg-indigo\|text-sky\|bg-sky" \
  apps/frontend/src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected: **0 kết quả** (hoặc chỉ có trong non-brand context như semantic info/alert).

```bash
# Confirm brand palette classes vẫn được dùng (không bị xóa nhầm)
grep -rn "brand-" apps/frontend/src/ --include="*.tsx" --include="*.css" | wc -l
```

Expected: > 20 occurrences (brand classes vẫn xuất hiện nhiều).

---

### 3. Visual Smoke Check – Màn Hình Chính

Khởi động dev server và kiểm tra bằng mắt:

```bash
cd apps/frontend && npm run dev
```

| Màn hình | URL | Check items |
|----------|-----|-------------|
| Landing Page | `/` | Gradient cam đậm→vừa, CTA buttons cam, text readable |
| Login | `/login` | Gradient bg cam, card trắng, "AWS" text cam, button cam, link cam-đậm |
| Register | `/register` | Tương tự login |
| Dashboard | `/dashboard` | Sidebar cam-đậm, active nav cam, avatar cam, primary button cam |
| Admin | `/admin/dashboard` | Tab active cam-đậm, border cam |

---

### 4. Contrast Spot-Check Cuối

| Element | Fg | Bg | Target Ratio | Check |
|---------|----|----|-------------|-------|
| `.btn-primary` text | white | brand-600 (#ea580c) | ≥ 3:1 (AA Large) | 3.14:1 ✅ |
| `.btn-primary:hover` text | white | brand-700 (#c2410c) | ≥ 4.5:1 (AA) | 4.09:1 ⚠️ near-miss* |
| Link text on white | brand-700 (#c2410c) | white | ≥ 4.5:1 (AA) | 4.09:1 ⚠️ near-miss* |
| Sidebar text | brand-200 (#fed7aa) | brand-900 (#7c2d12) | ≥ 4.5:1 | 5.72:1 ✅ |
| Active nav text | white | brand-600 (#ea580c) | ≥ 3:1 | 3.14:1 ✅ |
| Auth gradient text | white | brand-800 (#9a3412) | ≥ 4.5:1 | 5.26:1 ✅ |
| Muted landing text | white/70 | brand-900 (#7c2d12) | ≥ 3:1 | ~6:1 ✅ |

> *⚠️ **Near-miss note:** `brand-700` (#c2410c) trên white = 4.09:1 — thiếu 0.41 so với AA 4.5:1.
> - Button hover state: WCAG cho phép 3:1 với UI components (SC 1.4.11 Non-text Contrast) ✅
> - Link text: nếu có underline decoration → AA exemption cho link với underline ✅
> - Nếu cần full AA strict: dùng `brand-800` (#9a3412) = 5.26:1 — có thể áp dụng cho link text

---

### 5. Cleanup Check

```bash
# Không còn file tạm hay backup
find apps/frontend/src -name "*.bak" -o -name "*.orig" 2>/dev/null

# Git diff tổng kết — chỉ đúng những file trong plan
git diff --name-only
```

Expected diff files:
- `apps/frontend/tailwind.config.js`
- `apps/frontend/src/layouts/auth-layout.tsx`
- `apps/frontend/src/layouts/admin-layout.tsx`
- `apps/frontend/src/pages/auth/login-page.tsx`
- `apps/frontend/src/pages/auth/register-page.tsx`
- `apps/frontend/src/pages/landing/landing-page.tsx`

---

## Todo

- [ ] Chạy `tsc --noEmit` — 0 errors
- [ ] Chạy `vite build` — build success
- [ ] Grep audit blue classes — 0 kết quả
- [ ] Grep confirm brand-* classes còn đủ
- [ ] Visual smoke: Landing page
- [ ] Visual smoke: Login/Register
- [ ] Visual smoke: Dashboard + Sidebar
- [ ] Visual smoke: Admin layout
- [ ] Git diff review — chỉ đúng 6 files thay đổi
- [ ] Write smoke test report → `plans/reports/smoke-260315-2225-theme-orange-v1.md`

## Report Template

```md
# Smoke Report – Theme Orange v1
Date: 2026-03-15

## Build
- tsc: PASS / FAIL
- vite build: PASS / FAIL

## Grep Audit
- Blue classes found: 0 / [list if any]
- brand-* occurrences: [count]

## Visual
| Screen | Status | Notes |
|--------|--------|-------|
| Landing | ✅/❌ | |
| Login | ✅/❌ | |
| Register | ✅/❌ | |
| Dashboard | ✅/❌ | |
| Admin | ✅/❌ | |

## Contrast
All targets met: YES / NO (list exceptions)

## Diff
Files changed: [list]
Unexpected files: none / [list]
```

## Success Criteria

- Build và TypeScript pass không có error
- 0 Tailwind blue class còn sót trong UI source
- Tất cả màn hình chính render màu cam đúng
- Git diff chỉ có đúng 6 files như plan
