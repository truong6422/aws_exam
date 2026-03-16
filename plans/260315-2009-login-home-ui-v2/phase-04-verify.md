---
spec_id: phase-04-verify
version: "1.0"
status: pending
agents:
  - tester
acceptance_criteria:
  - "`tsc --noEmit` exits 0 — không có TypeScript errors"
  - "`eslint` exits 0 — không có lint errors/warnings"
  - "`vite build` exits 0 — bundle compile thành công"
---

# Phase 04 — Verify (Lint + Typecheck + Build)

## Context Links
- Package scripts: `apps/frontend/package.json`
- ESLint config: `apps/frontend/eslint.config.js` (hoặc `.eslintrc`)
- tsconfig: `apps/frontend/tsconfig.json`

## Overview

**Priority:** High (gate trước khi merge)
**Status:** Pending
**Description:** Project không có Vitest/Jest — verify bằng 3 bước: typecheck → lint → build. Tất cả phải pass trước khi coi implementation hoàn tất.

## Why No Unit Tests

```json
// package.json — không có test framework
"scripts": {
  "dev":       "vite",
  "build":     "tsc -b && vite build",
  "lint":      "eslint . --ext ts,tsx ...",
  "preview":   "vite preview",
  "typecheck": "tsc --noEmit"
}
// devDependencies: không có vitest, jest, @testing-library/*
```

Vì đây là pure UI changes (className, layout) không có business logic mới, verify bằng compiler + linter là đủ đảm bảo correctness.

## Verify Steps

### Step 1 — TypeScript Check
```bash
cd /home/truong/project/aws-exam-app/apps/frontend
npx tsc --noEmit
```
**Pass criteria:** exit 0, không output error

**Common failures to watch:**
- `showPassword` state type inference — phải là `boolean`
- SVG inline hoặc toggle button không có `type="button"` (React form submit leak)
- `clsx` import nếu thêm vào — đã có trong deps

### Step 2 — Lint
```bash
cd /home/truong/project/aws-exam-app/apps/frontend
npx eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
```
**Pass criteria:** exit 0, zero warnings

**Common failures to watch:**
- Unused imports (nếu xóa 1 className import hay helper)
- `aria-label` thiếu trên toggle button (accessibility rule)
- `key` prop trên mapped elements (đã có trong STAT_CARDS map)

### Step 3 — Build
```bash
cd /home/truong/project/aws-exam-app/apps/frontend
npm run build
```
**Pass criteria:** exit 0, dist/ được tạo thành công

**Common failures to watch:**
- Tailwind class nằm trong dynamic string → Purge xóa mất (avoid dynamic className concatenation)
- Import path typo sau khi edit

## Fix Protocol

Nếu bất kỳ step nào fail:
1. **Typecheck fail** → fix TypeScript errors trong file tương ứng, re-run
2. **Lint fail** → fix lint issues (thêm `aria-label`, xóa unused import, v.v.), re-run
3. **Build fail** → check Vite output, fix import/className issue, re-run
4. KHÔNG bỏ qua lỗi bằng `// eslint-disable` hay `@ts-ignore` trừ khi có lý do rõ ràng

## Todo List

- [ ] Run `npx tsc --noEmit` — fix nếu fail
- [ ] Run `npx eslint . --ext ts,tsx --max-warnings 0` — fix nếu fail
- [ ] Run `npm run build` — fix nếu fail
- [ ] Report kết quả

## Success Criteria

Tất cả 3 commands exit code 0. Implementation ready.

## Notes

- Không cần chạy `npm run dev` hay manual visual test — đó là việc của developer review sau
- Nếu muốn visual test nhanh: `npm run preview` sau khi build
