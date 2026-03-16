---
spec_id: phase-05-tests
version: "1.0"
status: pending
agents:
  - tester
acceptance_criteria:
  - Vitest + React Testing Library được cài đặt
  - Test login form: render, submit, error state
  - Test auth layout: renders children
  - Test dashboard: render với mock user, stat cards, quick actions
  - Test landing: render, CTA links đúng href
  - Tất cả tests pass
---

# Phase 05 — Tests

## Context Links
- Test framework hiện tại: ❌ Không có frontend tests
- Backend tests: `apps/backend/apps/accounts/tests/test_auth.py`
- Package.json: `apps/frontend/package.json`

---

## Overview

**Priority:** Medium
**Status:** Pending
**Dependency:** Phases 01-04 hoàn thành

Dự án hiện KHÔNG có frontend test framework. Cần setup Vitest + React Testing Library trước, sau đó viết tests cho các components vừa được UI refresh.

---

## Setup Requirements

### Packages cần cài

```bash
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**Lý do chọn Vitest thay Jest:**
- Vite-based project → Vitest tích hợp native, không cần config thêm
- ESM-first, TypeScript native
- API tương thích Jest

### Config files cần tạo/update

**`vite.config.ts`** — thêm test config:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    css: false,  // skip CSS processing trong tests
  },
  resolve: {
    alias: { '@': '/apps/frontend/src' }
  }
})
```

**`src/test-setup.ts`** — setup file:
```ts
import '@testing-library/jest-dom'
```

**`tsconfig.json`** — thêm types:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

---

## Test Scope

### Test 1 — `auth-layout.test.tsx`

```
File: apps/frontend/src/layouts/auth-layout.test.tsx
```

**Cases:**
- `renders children via Outlet` — mock `<Outlet>` từ react-router-dom
- `renders brand heading "AWS Exam App"`
- `renders tagline "Practice makes perfect"`

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom'
import AuthLayout from './auth-layout'

describe('AuthLayout', () => {
  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<div data-testid="child">child content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

  it('renders brand heading', () => {
    renderWithRouter()
    expect(screen.getByText('AWS Exam App')).toBeInTheDocument()
  })

  it('renders children', () => {
    renderWithRouter()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
```

---

### Test 2 — `login-page.test.tsx`

```
File: apps/frontend/src/pages/auth/login-page.test.tsx
```

**Cases:**
- `renders email and password inputs`
- `renders Sign In button`
- `shows loading state on submit`
- `shows error message on failed login`
- `navigates to /dashboard on successful login`
- `renders Register link`

**Mock strategy:**
```tsx
// Mock stores
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector) => selector({
    login: vi.fn(),
  }))
}))

vi.mock('@/stores/ui-store', () => ({
  useUiStore: vi.fn((selector) => selector({
    addToast: vi.fn(),
  }))
}))

// Mock react-router navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
```

**Key tests:**
```tsx
it('shows error message when login fails', async () => {
  const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
  // setup mock với mockLogin
  // render + fill email/password + submit
  // expect error message in document
})

it('redirects to /dashboard on success', async () => {
  const mockLogin = vi.fn().mockResolvedValue(undefined)
  // setup + submit
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
})
```

---

### Test 3 — `landing-page.test.tsx`

```
File: apps/frontend/src/pages/landing/landing-page.test.tsx
```

**Cases:**
- `renders main heading "AWS Exam Lab"`
- `renders Start Exam link pointing to /exam/setup`
- `renders Start Practice link pointing to /practice/setup`
- `renders Sign in link pointing to /login`

```tsx
it('renders exam CTA with correct href', () => {
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  const examLink = screen.getByRole('link', { name: /start exam/i })
  expect(examLink).toHaveAttribute('href', '/exam/setup')
})
```

---

### Test 4 — `dashboard-page.test.tsx`

```
File: apps/frontend/src/pages/dashboard/dashboard-page.test.tsx
```

**Cases:**
- `renders greeting with user name`
- `renders 4 stat cards`
- `renders Start Exam quick action`
- `renders Practice Mode quick action`
- `renders Recent Activity section`
- `renders empty state when no activity`

**Mock strategy:**
```tsx
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector) => selector({
    currentUser: { id: 1, email: 'test@example.com', name: 'Test User', roles: ['student'] }
  }))
}))
```

---

### Test 5 — `page-header.test.tsx`

```
File: apps/frontend/src/components/ui/page-header.test.tsx
```

**Cases:**
- `renders title`
- `renders subtitle when provided`
- `does not render subtitle when omitted`
- `applies hero variant styles`

---

## Package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## File Structure sau khi xong

```
apps/frontend/src/
├── test-setup.ts                              (new)
├── layouts/
│   ├── auth-layout.tsx
│   └── auth-layout.test.tsx                  (new)
├── pages/
│   ├── auth/
│   │   ├── login-page.tsx
│   │   └── login-page.test.tsx               (new)
│   ├── landing/
│   │   ├── landing-page.tsx
│   │   └── landing-page.test.tsx             (new)
│   └── dashboard/
│       ├── dashboard-page.tsx
│       └── dashboard-page.test.tsx           (new)
└── components/ui/
    ├── page-header.tsx
    └── page-header.test.tsx                  (new)
```

---

## Related Code Files

**Create:**
- `apps/frontend/src/test-setup.ts`
- `apps/frontend/src/layouts/auth-layout.test.tsx`
- `apps/frontend/src/pages/auth/login-page.test.tsx`
- `apps/frontend/src/pages/landing/landing-page.test.tsx`
- `apps/frontend/src/pages/dashboard/dashboard-page.test.tsx`
- `apps/frontend/src/components/ui/page-header.test.tsx`

**Modify:**
- `apps/frontend/vite.config.ts` (thêm test config)
- `apps/frontend/package.json` (thêm devDependencies + scripts)
- `apps/frontend/tsconfig.json` (thêm vitest types)

---

## Todo List

- [ ] Install: `vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`
- [ ] Update `vite.config.ts` với test config
- [ ] Tạo `src/test-setup.ts`
- [ ] Update `tsconfig.json` với vitest types
- [ ] Viết `auth-layout.test.tsx`
- [ ] Viết `login-page.test.tsx` (mock stores + navigate)
- [ ] Viết `landing-page.test.tsx`
- [ ] Viết `dashboard-page.test.tsx` (mock auth store)
- [ ] Viết `page-header.test.tsx`
- [ ] Run `npm test` → tất cả pass

---

## Success Criteria

- `npm test` chạy thành công, không có test fail
- Coverage cho login form: submit, error, loading, redirect
- Coverage cho landing: renders, link hrefs đúng
- Coverage cho dashboard: user greeting, stat cards, quick actions
- Không mock quá mức — test behavior thực, không test implementation detail

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Zustand mock phức tạp với selector pattern | Medium | Mock pattern `vi.fn((selector) => selector({...}))` đã proven |
| React Router Link render trong test | Low | Wrap với `<MemoryRouter>` |
| CSS class tests không reliable | Low | Test behavior/content, không test className |
| Vite alias `@/` không resolve trong test | Medium | Config `resolve.alias` trong `vite.config.ts` test section |
