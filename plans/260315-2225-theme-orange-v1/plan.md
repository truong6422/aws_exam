# Plan: Theme – Orange Brand v1

**Date:** 2026-03-15
**Slug:** theme-orange-v1
**Branch:** master
**Status:** completed

---

## Objective

Chuyển màu brand chủ đạo từ **xanh dương (blue)** sang **cam (orange)** trên toàn bộ frontend, đảm bảo:
- Nhất quán tại 1 điểm cấu hình (Tailwind config)
- Không phá vỡ WCAG contrast (AA minimum)
- Không đổi layout, không đổi logic
- Không tạo file mới — chỉ sửa file hiện có

---

## Phases

| # | Phase | Status | File(s) |
|---|-------|--------|---------|
| 1 | Đổi brand palette trong Tailwind config | ✅ completed | `tailwind.config.js` |
| 2 | Audit & cleanup class `brand-*` trong components | ✅ completed | 6 files UI |
| 3 | Xử lý CTA đặc biệt trên Landing page | ✅ completed | `landing-page.tsx` |
| 4 | Verify contrast & visual smoke test | ✅ completed | — |

---

## Phase Detail Links

- [Phase 1 – Tailwind Config](./phase-01-tailwind-config.md)
- [Phase 2 – Component Brand Audit](./phase-02-component-audit.md)
- [Phase 3 – Landing Page CTA](./phase-03-landing-cta.md)
- [Phase 4 – Contrast & Smoke](./phase-04-contrast-smoke.md)

---

## Key Dependencies

- Tailwind CSS 3.4.11 — custom `brand` token trong `theme.extend.colors`
- React 18 + Vite — không có runtime theme provider
- Không có shadcn/ui, không có CSS variables — **toàn bộ màu qua Tailwind token**
- `index.css` có component layer (`.btn-primary`, `.field`) dùng `brand-*` → tự cập nhật khi config đổi
