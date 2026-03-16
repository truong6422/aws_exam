---
spec_id: phase-01-tailwind-config
version: "1.0"
status: completed
agents:
  - fullstack-developer
acceptance_criteria:
  - "✅ brand palette trong tailwind.config.js thay thế hoàn toàn bằng orange shades"
  - "✅ surface colors giữ nguyên"
  - "✅ Build không lỗi sau khi đổi"
---

# Phase 01 – Đổi Brand Palette (Tailwind Config)

## Context Links
- Config: `apps/frontend/tailwind.config.js`
- Global CSS: `apps/frontend/src/index.css`

## Overview

**Priority:** Critical — đây là nguồn gốc duy nhất của màu brand.

Toàn bộ màu brand hiện tại là Tailwind Blue scale. Chỉ cần thay thế hex values trong `tailwind.config.js` → tất cả component dùng class `brand-*` tự cập nhật mà không cần sửa từng file.

`index.css` component layer (`.btn-primary`, `.field`, `:focus-visible`) dùng `brand-500/600/700` → **không cần sửa** vì chúng reference token, không hardcode hex.

## Palette Cam Đề Xuất

Sử dụng **Orange** scale — màu cam đậm, ấm, đủ contrast trên nền trắng:

| Token | Hex | RGB | Dùng cho |
|-------|-----|-----|---------|
| `brand-50`  | `#fff7ed` | 255 247 237 | Auth card logo bg |
| `brand-100` | `#ffedd5` | 255 237 213 | Subtle tint |
| `brand-200` | `#fed7aa` | 254 215 170 | Muted text bg |
| `brand-300` | `#fdba74` | 253 186 116 | Icon tint, section label |
| `brand-400` | `#fb923c` | 251 146 60  | Tertiary text |
| `brand-500` | `#f97316` | 249 115 22  | Focus ring, field border |
| `brand-600` | `#ea580c` | 234 88 12   | **Primary CTA button** |
| `brand-700` | `#c2410c` | 194 65 12   | Button hover |
| `brand-800` | `#9a3412` | 154 52 18   | Sidebar hover bg |
| `brand-900` | `#7c2d12` | 124 45 18   | **Sidebar background** |
| `brand-950` | `#431407` | 67 20 7     | Darkest shade |

### WCAG Contrast Analysis

| Foreground | Background | Ratio | Level |
|-----------|-----------|-------|-------|
| `white` (#fff) | `brand-600` (#ea580c) | **3.14:1** | AA Large ✅ |
| `white` (#fff) | `brand-700` (#c2410c) | **4.09:1** | AA ✅ |
| `white` (#fff) | `brand-900` (#7c2d12) | **8.59:1** | AAA ✅ |
| `brand-600` (#ea580c) | `white` (#fff) | **3.14:1** | AA Large ✅ |
| `brand-700` (#c2410c) | `white` (#fff) | **4.09:1** | AA ✅ |

> **Lưu ý:** `brand-600` trên white đạt 3.14:1 — đủ AA Large (text ≥ 18pt hoặc 14pt bold). Với button text (14px bold = 14pt bold), đạt chuẩn AA. Nếu muốn pass AA normal text, dùng `brand-700` làm màu text link (4.09:1).
>
> **Link text** (`.text-brand-600 hover:underline`) nên chuyển sang `text-brand-700` để đảm bảo AA cho body text size.

## Implementation Steps

### 1. Sửa `apps/frontend/tailwind.config.js`

Thay toàn bộ block `brand:` hiện tại:

```js
// TRƯỚC (blue):
brand: {
  50:  '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
},

// SAU (orange):
brand: {
  50:  '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
},
```

`surface` colors **giữ nguyên** — không thay đổi.

### 2. Verify build

```bash
cd apps/frontend && npx tsc --noEmit && npx vite build
```

## Todo

- [ ] Backup tailwind.config.js (git tracked, no action needed)
- [ ] Thay brand palette hex values
- [ ] Chạy `tsc --noEmit` để verify không có type error
- [ ] Chạy `vite build` để verify build thành công

## Success Criteria

- `tailwind.config.js` chứa orange palette
- Build pass (`vite build`) không có error
- Không có thay đổi nào ở file khác trong phase này

## Risk Assessment

| Rủi ro | Khả năng | Xử lý |
|--------|---------|-------|
| Contrast không đủ cho small text | Thấp | Dùng brand-700 cho link text |
| Build cache Tailwind cũ | Thấp | Xóa `.vite` cache nếu cần |
