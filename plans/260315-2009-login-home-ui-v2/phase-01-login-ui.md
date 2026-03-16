---
spec_id: phase-01-login-ui
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - inputs dùng class `.field` thay vì inline Tailwind
  - submit button dùng class `.btn-primary`
  - error box có icon ⚠️ và padding đẹp hơn
  - password toggle (show/hide) hoạt động đúng
  - auth-layout header cân đối, spacing rõ ràng
  - typecheck pass, không có TS error
---

# Phase 01 — Login UI (Auth Layout + Login Form)

## Context Links
- Source: `apps/frontend/src/layouts/auth-layout.tsx`
- Source: `apps/frontend/src/pages/auth/login-page.tsx`
- Global CSS: `apps/frontend/src/index.css` (`.field`, `.btn-primary`)
- Tailwind config: `apps/frontend/tailwind.config.js`

## Overview

**Priority:** High (first thing users see)
**Status:** Pending
**Description:** Làm sạch login form và auth layout card. Không đổi auth logic, routes, hay form submit behavior.

## Current State Analysis

**`auth-layout.tsx` (17 lines):**
- Card: `rounded-2xl bg-white p-8 shadow-2xl` — tốt nhưng header spacing chưa optimal
- Brand header: ☁️ emoji + `text-2xl font-bold` title + `text-sm` subtitle
- Vấn đề: title và subtitle quá gần nhau, không có visual separator

**`login-page.tsx` (84 lines):**
- Inputs: inline Tailwind thay vì `.field` class đã có sẵn
- Button: inline Tailwind thay vì `.btn-primary`
- Error box: không có icon, padding nhỏ
- Không có password visibility toggle
- Label `text-sm font-medium text-gray-700` — ổn

## Requirements

### Functional (giữ nguyên)
- Form submit → `login(email, password)` → navigate to `/dashboard`
- `inlineError` state → hiển thị lỗi
- `loading` state → disable button + show "Signing in…"
- Link `/register` giữ nguyên

### UI Changes

**`auth-layout.tsx`:**
1. Header section: tăng `mb-8` → `mb-6`, thêm `space-y-1` trong header block
2. Brand icon: wrap trong colored circle badge (`bg-brand-100 text-brand-700 rounded-full p-3 inline-flex`)
3. Title: `text-2xl font-bold` → `text-2xl font-bold text-gray-900` (đã có, giữ)
4. Subtitle: `text-gray-500` → `text-gray-400 text-xs` (nhẹ hơn)

**`login-page.tsx`:**
1. **Inputs**: thay `className="w-full rounded-lg border ..."` → `className="field"` (tận dụng `.field` trong index.css)
2. **Submit button**: thay inline classes → `className="btn-primary w-full py-2.5"`
3. **Error box**: thêm icon `⚠️` inline, padding `px-4 py-3`, thêm `rounded-xl`
4. **Password field**: thêm `<div className="relative">` wrapper + toggle button (eye icon bằng SVG inline hoặc Unicode `👁`)
5. **Form spacing**: `space-y-4` → `space-y-5` cho thoáng hơn
6. **Label group**: dùng `<div className="space-y-1">` bao label + input

## Architecture

```
auth-layout.tsx
└── Card container (white, shadow-2xl)
    ├── Header (brand icon + title + subtitle)   ← MODIFY: icon badge, spacing
    └── <Outlet /> → login-page.tsx
        └── <form>
            ├── Error box (conditional)          ← MODIFY: add ⚠️ icon
            ├── Email field group                ← MODIFY: use .field
            ├── Password field group             ← MODIFY: use .field + toggle btn
            └── Submit button                    ← MODIFY: use .btn-primary
```

## Related Code Files

**Modify:**
- `apps/frontend/src/layouts/auth-layout.tsx`
- `apps/frontend/src/pages/auth/login-page.tsx`

**Read-only (reference):**
- `apps/frontend/src/index.css` — `.field`, `.btn-primary` definitions
- `apps/frontend/tailwind.config.js` — color tokens

## Implementation Steps

### Step 1 — `auth-layout.tsx`
1. Read file
2. Replace header block:
   - Wrap icon in `bg-brand-100 rounded-full p-3 inline-flex items-center justify-center mb-4`
   - Remove old `mb-8` từ outer div → thay bằng `mb-6 text-center`
   - Title: thêm `tracking-tight`
   - Subtitle: đổi thành `text-xs text-gray-400 mt-1`
3. Verify không break `<Outlet />`

### Step 2 — `login-page.tsx`
1. Read file
2. Thêm `showPassword` state: `const [showPassword, setShowPassword] = useState(false)`
3. **Error box**: wrap nội dung trong `flex items-start gap-2`, thêm `⚠️` span
4. **Email input group**: bọc `label + input` trong `<div className="space-y-1">`, đổi input className → `"field"`
5. **Password input group**:
   - Bọc trong `<div className="space-y-1">`
   - Bọc input trong `<div className="relative">`
   - Input: `className="field pr-10"`, `type={showPassword ? 'text' : 'password'}`
   - Thêm toggle button: `<button type="button" onClick={...} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">`
   - Toggle icon: `{showPassword ? '🙈' : '👁️'}` (hoặc SVG nhỏ)
6. **Submit button**: đổi className → `"btn-primary w-full py-2.5"`
7. **Register link**: cải thiện text spacing với `mt-1`

### Step 3 — Verify
```bash
cd apps/frontend && npx tsc --noEmit
```

## Todo List

- [ ] Modify `auth-layout.tsx` — icon badge + spacing
- [ ] Modify `login-page.tsx` — use `.field`, `.btn-primary`, error icon, password toggle
- [ ] Run `tsc --noEmit` để verify

## Success Criteria

- Login form nhìn sạch, aligned, professional
- Inputs có focus ring đẹp (từ `.field`)
- Password toggle hoạt động
- Error message có icon, dễ đọc
- Không có TypeScript error

## Risk Assessment

- **Low risk**: chỉ thay className, không đổi logic
- Password toggle: chỉ dùng React state `showPassword`, không cần thư viện

## Security Considerations

- Password toggle chỉ đổi `type` attribute trên input — không expose data
- Không lưu password vào localStorage hay state ngoài component

## Next Steps

→ Phase 02: Landing Page UI
