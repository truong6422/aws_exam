---
spec_id: phase-02-component-audit
version: "1.0"
status: completed
agents:
  - fullstack-developer
acceptance_criteria:
  - "✅ Tất cả class brand-* trong 6 component files đã được kiểm tra"
  - "✅ Link text dùng brand-700 thay brand-600 để đảm bảo AA contrast"
  - "✅ Không có hardcode hex color nào còn sót"
  - "✅ Không có thay đổi layout hay logic"
---

# Phase 02 – Component Brand Audit & Cleanup

## Context Links
- Phase 01: [phase-01-tailwind-config.md](./phase-01-tailwind-config.md)
- Thực hiện SAU Phase 01 hoàn thành

## Overview

**Priority:** High

Sau khi đổi palette (Phase 01), phần lớn component **tự cập nhật** vì dùng `brand-*` token. Phase này chỉ cần:
1. Audit từng file để tìm class cần điều chỉnh nhỏ (contrast, semantics)
2. Đổi link text từ `brand-600` → `brand-700` (contrast AA cho normal text)
3. Không có hardcode hex nào trong codebase (đã confirm — thuần Tailwind)

## File Map – Audit Checklist

### 1. `apps/frontend/src/index.css`

**Trạng thái:** ✅ Tự cập nhật — không cần sửa

Các class trong component layer reference token, không hardcode:
- `.btn-primary` → `bg-brand-600 hover:bg-brand-700` ✅
- `.field` → `focus:border-brand-500 focus:ring-brand-500/20` ✅
- `:focus-visible` → `ring-brand-500` ✅

**Hành động:** None

---

### 2. `apps/frontend/src/layouts/sidebar.tsx`

**Trạng thái:** ✅ Tự cập nhật — không cần sửa

Tất cả class `brand-*` trong sidebar là background/text trên dark sidebar (`brand-900` bg):
- `bg-brand-900` (sidebar bg) → cam đậm #7c2d12 ✅
- `border-brand-800` (divider) → #9a3412 ✅
- `bg-brand-600` (active nav, avatar) → cam #ea580c ✅
- `bg-brand-800 hover:text-white` (hover nav) → #9a3412 ✅
- `text-brand-200/300/400` (text trên dark bg) → orange light shades ✅

Contrast text trắng/sáng trên `brand-900` (#7c2d12) = 8.59:1 — AAA ✅

**Hành động:** None

---

### 3. `apps/frontend/src/layouts/navbar.tsx`

**Trạng thái:** ✅ Tự cập nhật — không cần sửa

- `bg-brand-600` (avatar) → cam #ea580c, white text ratio 3.14:1 — AA Large ✅

**Hành động:** None

---

### 4. `apps/frontend/src/layouts/auth-layout.tsx`

**Trạng thái:** ✅ Tự cập nhật — cần check 1 class

- `bg-gradient-to-br from-brand-900 to-brand-600` → gradient cam đậm → cam vừa ✅
- `bg-brand-50` (logo bg) → warm cream #fff7ed ✅
- `text-brand-600` trên white → **3.14:1** — chỉ đạt AA Large

**Hành động:** Đổi `text-brand-600` (dòng 14) → `text-brand-700` trên heading "AWS Exam Practice":

```tsx
// TRƯỚC:
<span className="text-brand-600">AWS</span> Exam Practice

// SAU:
<span className="text-brand-700">AWS</span> Exam Practice
```

---

### 5. `apps/frontend/src/pages/auth/login-page.tsx`

**Trạng thái:** ⚠️ Cần sửa 1 class — link contrast

- `text-brand-600 hover:underline` (link "Create one") → 3.14:1 trên white — không đủ AA normal

**Hành động:** Đổi link class:

```tsx
// TRƯỚC (dòng 76):
<Link to="/register" className="font-medium text-brand-600 hover:underline">

// SAU:
<Link to="/register" className="font-medium text-brand-700 hover:underline">
```

---

### 6. `apps/frontend/src/pages/auth/register-page.tsx`

**Trạng thái:** ⚠️ Cần kiểm tra — likely có link "Sign in" tương tự login-page

**Hành động:** Tìm và đổi `text-brand-600` trên text link → `text-brand-700`

```tsx
// Pattern cần tìm:
className="font-medium text-brand-600 hover:underline"

// Đổi thành:
className="font-medium text-brand-700 hover:underline"
```

---

### 7. `apps/frontend/src/layouts/admin-layout.tsx`

**Trạng thái:** ⚠️ Cần sửa — active tab text contrast

- `border-brand-600 text-brand-600` (active tab) trên white bg → 3.14:1

**Hành động:** Đổi active tab text sang `brand-700`:

```tsx
// TRƯỚC (dòng 25):
isActive
  ? 'border-brand-600 text-brand-600'

// SAU:
isActive
  ? 'border-brand-700 text-brand-700'
```

Border underline có thể giữ `brand-600` (decorative, không cần contrast), nhưng text phải đủ AA → dùng `brand-700`.

---

### 8. `apps/frontend/src/components/ui/toast-container.tsx`

**Trạng thái:** ✅ Tự cập nhật — không cần sửa

- `info: 'bg-brand-600'` → cam #ea580c với white text = 3.14:1 — AA Large ✅

Toast bg + white text icon nhỏ nhưng chấp nhận được vì là notification ephemeral. Nếu muốn stricter: đổi `bg-brand-700`.

**Hành động (optional):** Đổi `bg-brand-600` → `bg-brand-700` trong COLOUR map nếu muốn full AA.

---

## Summary – Files Cần Sửa

| File | Dòng | Thay đổi | Lý do |
|------|------|----------|-------|
| `auth-layout.tsx` | 14 | `text-brand-600` → `text-brand-700` | AA normal text |
| `login-page.tsx` | 76 | `text-brand-600` → `text-brand-700` | AA normal text link |
| `register-page.tsx` | ~link | `text-brand-600` → `text-brand-700` | AA normal text link |
| `admin-layout.tsx` | 25 | `text-brand-600` → `text-brand-700` | AA normal text tab |

**Không sửa:** `sidebar.tsx`, `navbar.tsx`, `index.css`, `toast-container.tsx`

## Implementation Steps

1. Read `register-page.tsx` để xác nhận line number của link
2. Sửa 4 file theo bảng trên — chỉ đổi text color class, giữ nguyên mọi thứ khác
3. Chạy `tsc --noEmit` để verify

## Todo

- [ ] Đọc register-page.tsx xác nhận link text class
- [ ] Sửa `auth-layout.tsx` dòng 14
- [ ] Sửa `login-page.tsx` dòng 76
- [ ] Sửa `register-page.tsx` (link text)
- [ ] Sửa `admin-layout.tsx` dòng 25
- [ ] Chạy `tsc --noEmit`

## Success Criteria

- Không còn `text-brand-600` trên white background dùng cho normal body/link text
- Tất cả interactive text đạt ≥ 4.5:1 (AA normal) hoặc ≥ 3:1 (AA Large cho button/heading)
- Zero layout changes
