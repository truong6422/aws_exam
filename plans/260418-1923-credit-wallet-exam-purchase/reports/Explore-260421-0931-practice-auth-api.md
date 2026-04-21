# Codebase Exploration Report: Practice Screen, Pagination, Auth Guards & APIs

**Date:** 2026-04-21 | **Scope:** Practice flow (luyện tập), pagination, authentication, and API endpoints

---

## 1. Practice Screen Components

### Frontend: Practice Page Structure

#### **Setup Page** (`apps/frontend/src/pages/practice/practice-setup-page.tsx`)
- Displays list of certifications as cards (SAA prioritized)
- Fetches all certifications via `examApi.getCertifications()` (public endpoint)
- On card click: navigates to `/practice?certification_id={certId}`
- **Lines 20-147:** Main component with loading state

#### **Session/Questions Page** (`apps/frontend/src/pages/practice/practice-session-page.tsx`)
- **Lines 189-298:** Main component that displays 5 questions per page
- **Key Features:**
  - Renders `PracticeQuestionItem` component for each question (5 per page)
  - Supports single and multiple choice questions
  - Individual answer reveal (not batch/full-page reveal)
  - Comments section (collapsible)
  - Bookmark button (auth-only)
  - Error reporting (auth-only)

#### **Question Item Component** (`PracticeQuestionItem` within same file)
- **Lines 29-185:** Question card with:
  - Question text and options
  - Manual answer selection (checkbox/radio)
  - `Check Answer` button → reveals correct answers + opens comments
  - `Hide Result` button → hides answers
  - Bookmark button (if authenticated)
  - Report button (if authenticated + after reveal)
  - Comment section (if opened)

---

## 2. Pagination Implementation

### Frontend Pagination Logic (`practice-session-page.tsx`)

**Page State:**
- Line 198: `currentPage = Number(searchParams.get('page')) || 1`
- Line 197: `certId = Number(searchParams.get('certification_id')) || undefined`

**API Call** (Line 205-218):
```typescript
const resp = await practiceApi.getQuestions(certId, currentPage)
setQuestions(resp.data)  // Array of 5 ReviewQuestion objects
setTotalPages(resp.links.total_pages)
setTotalCount(resp.links.count)  // Total questions across all pages
```

**Page Navigation** (Lines 228-233):
```typescript
const handlePageChange = (newPage: number) => {
  setSearchParams({
    certification_id: certId?.toString() || '',
    page: newPage.toString()
  })
}
```

**Pagination Controls** (Lines 264-288):
- Previous button (disabled if page = 1)
- Current page counter display: `page X of Y`
- Next button (disabled if page = totalPages)

### Backend Pagination (`apps/backend/apps/questions/views.py`)

**Page Size Configuration** (Lines 23-25):
```python
class PracticeQuestionPagination(CustomPageNumberPagination):
    page_size = 5
    max_page_size = 5
```
- **Fixed page size: 5 questions per page**
- Max page size cannot exceed 5 (prevents abuse)

**API Endpoint** (Lines 83-125):
- **Route:** `GET /api/v1/questions/practice/`
- **Query Params:**
  - `certification_id` (optional): filter by certification
  - `page` (optional, default 1): page number
- **Response Format** (from frontend types, line 155-164 in exam-api.ts):
  ```typescript
  {
    links: {
      prev: string | null,
      next: string | null,
      current_page: number,
      total_pages: number,
      count: number  // total questions
    },
    data: ReviewQuestion[]  // 5 questions
  }
  ```

---

## 3. Authentication Guards

### Frontend Route Guards

#### **ProtectedRoute** (`apps/frontend/src/router/protected-route.tsx`)
- **Lines 1-8:** Guards routes requiring authentication
- **Logic:** 
  - Checks `useAuthStore((s) => s.isAuthenticated)`
  - If not authenticated: redirects to `/login`
  - If authenticated: renders `<Outlet />` (child routes)

#### **AdminRoute** (`apps/frontend/src/router/admin-route.tsx`)
- **Lines 1-8:** Guards admin-only routes
- **Logic:**
  - Checks `user?.is_staff` from auth store
  - If not staff: redirects to `/dashboard`
  - If staff: renders `<Outlet />` (admin routes)

#### **Route Configuration** (`apps/frontend/src/router/routes.tsx`)
```
Practice routes (PUBLIC):
  ✓ /practice/setup          → PracticeSetupPage
  ✓ /practice                → PracticeSessionPage (no guard)
  ✓ /practice/:sessionId     → PracticeSessionPage (no guard)

Protected routes:
  /dashboard                 → [ProtectedRoute]
  /analytics, /history, /wallet, /chat
  /exam/setup, /exam/:id, /exam/:id/result
  /admin/*                   → [ProtectedRoute] → [AdminRoute]
```
**Key:** Practice pages are **publicly accessible**, but bookmark/comments/report require auth.

### Backend Permission Classes

**Base Settings** (`apps/backend/config/settings/base.py`, Lines 172-178):
```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.accounts.authentication.RedisJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}
```
- **Default:** All API endpoints require authentication
- **Overridden per-endpoint:** Views explicitly set `permission_classes`

#### **Practice Questions Endpoint** (`views.py`, Lines 83-125):
```python
class PracticeQuestionListView(generics.ListAPIView):
    serializer_class = PracticeQuestionSerializer
    permission_classes = [AllowAny]  # ← Public read access
    pagination_class = PracticeQuestionPagination
```
- **Public access** to question listing
- **Filters by unlocked sets:**
  - Staff users: see all sets
  - Authenticated users: see free + purchased sets
  - Guests: see free + incomplete sets (< 65 questions)

#### **Comment Endpoints** (Lines 127-144):
```python
class CommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
```
- Read comments: **public**
- Post comments: **authenticated only**

#### **Bookmark/Upvote/Report Endpoints** (Lines 146-210):
```python
class CommentUpvoteView(APIView):
    permission_classes = [IsAuthenticated]

class BookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

class AnswerReportCreateView(APIView):
    permission_classes = [IsAuthenticated]
```
- All require **authentication**

### Authentication Mechanism

#### **JWT with Redis Blacklist** (`apps/backend/apps/accounts/authentication.py`)
```python
class RedisJWTAuthentication(ApiJWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        jti = token.get("jti")
        if jti and cache.get(f"token:blacklist:{jti}"):
            raise InvalidToken("Token has been revoked")
        return user, token
```
- Extends Core JWT authentication
- On every request: checks Redis cache for `token:blacklist:{jti}`
- Rejected if JTI is blacklisted (after logout)

#### **Frontend Token Management** (`apps/frontend/src/lib/api-client.ts`)

**Token Storage** (Lines 11-31):
- Tokens stored in localStorage under key `'aws-exam-auth'`
- `getStoredToken()`: retrieves access token
- `getStoredRefreshToken()`: retrieves refresh token

**Request Interceptor** (Lines 94-150):
```typescript
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getStoredToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // ... make request
}
```

**Automatic Token Refresh** (Lines 114-150):
- On 401 response:
  - If already refreshing: queue request + wait for new token
  - Otherwise: refresh token via `/api/v1/auth/token/refresh/`
  - Backend returns new access token (+ optionally new refresh token if `ROTATE_REFRESH_TOKENS=True`)
  - Retry original request with new token
  - If refresh fails: clear localStorage, redirect to `/login`

#### **Auth Endpoints** (`apps/backend/apps/accounts/urls.py`)
```
POST   /api/v1/auth/login/              → LoginView (rate-limited 10/min)
POST   /api/v1/auth/register/           → RegisterView
POST   /api/v1/auth/logout/             → LogoutView (blacklists JTI)
POST   /api/v1/auth/token/refresh/      → BlacklistCheckTokenRefreshView
GET    /api/v1/auth/me/                 → CurrentUserView
POST   /api/v1/auth/change-password/    → ChangePasswordView
```

#### **Auth Store** (`apps/frontend/src/stores/auth-store.ts`)
- Persists to localStorage with key `'aws-exam-auth'`
- Stores: `token`, `refreshToken`, `user`, `isAuthenticated`
- Actions: `setTokens()`, `setUser()`, `logout()`

---

## 4. Question API Endpoints

### Public Endpoints

#### **Practice Questions** (Page Size: 5)
```
GET /api/v1/questions/practice/?certification_id={id}&page={n}
```
- **Permission:** AllowAny
- **Page Size:** Fixed at 5 questions per page
- **Response:** Paginated `ReviewQuestion` objects with:
  - `id`, `text`, `explanation`, `question_type`
  - `answers[]` with `id`, `text`, `is_correct`
  - `comment_count`

#### **Certifications List**
```
GET /api/v1/questions/certifications/
```
- **Permission:** AllowAny
- **Response:** Array of `Certification` objects

#### **Exam Sets by Certification**
```
GET /api/v1/questions/certifications/{cert_id}/sets/
```
- **Permission:** AllowAny
- **Response:** Filtered exam sets (based on user auth status + purchases)

### Protected Endpoints (Authenticated Only)

#### **Bookmarks**
```
GET    /api/v1/questions/bookmarks/                    → List question IDs
POST   /api/v1/questions/{question_id}/bookmark/       → Toggle bookmark
```
- **Permission:** IsAuthenticated
- **Response:** `{ question_ids: number[] }` or `{ bookmarked: boolean }`

#### **Comments**
```
GET    /api/v1/questions/{question_id}/comments/       → List comments (AllowAny to read)
POST   /api/v1/questions/{question_id}/comments/       → Create comment (IsAuthenticated)
POST   /api/v1/questions/comments/{comment_id}/upvote/ → Toggle upvote (IsAuthenticated)
```

#### **Answer Reports**
```
POST   /api/v1/questions/{question_id}/report/         → Report incorrect answer
```
- **Permission:** IsAuthenticated
- **Constraint:** One report per user/question (409 Conflict if duplicate)

---

## 5. Key File Paths

### Frontend
| File | Lines | Purpose |
|------|-------|---------|
| `/apps/frontend/src/router/routes.tsx` | 1-105 | Route configuration + route guards |
| `/apps/frontend/src/router/protected-route.tsx` | 1-8 | Auth-required route guard |
| `/apps/frontend/src/router/admin-route.tsx` | 1-8 | Staff-only route guard |
| `/apps/frontend/src/pages/practice/practice-setup-page.tsx` | 1-147 | Certification selector |
| `/apps/frontend/src/pages/practice/practice-session-page.tsx` | 1-298 | Main practice questions + pagination |
| `/apps/frontend/src/services/exam-api.ts` | 1-233 | All API calls (questions, exams, bookmarks, comments) |
| `/apps/frontend/src/lib/api-client.ts` | 1-197 | HTTP client with JWT + auto-refresh + blacklist check |
| `/apps/frontend/src/stores/auth-store.ts` | 1-43 | Auth state (tokens, user, isAuthenticated) |

### Backend
| File | Lines | Purpose |
|------|-------|---------|
| `/apps/backend/config/urls.py` | 1-89 | Root URL routes (all v1 prefixed under `/api/v1/`) |
| `/apps/backend/apps/questions/urls.py` | 1-56 | Question endpoints (practice, comments, bookmarks, reports) |
| `/apps/backend/apps/questions/views.py` | 1-259 | Question list, comments, bookmarks, reports (with permissions) |
| `/apps/backend/apps/exams/urls.py` | 1-23 | Exam endpoints |
| `/apps/backend/apps/exams/exam_views.py` | 1-100+ | Exam start, submit, review, paywall logic |
| `/apps/backend/apps/accounts/urls.py` | 1-36 | Auth endpoints (login, register, logout, token refresh, me) |
| `/apps/backend/apps/accounts/auth_views.py` | 1-95 | Auth views (JWT, logout with Redis blacklist) |
| `/apps/backend/apps/accounts/authentication.py` | 1-32 | Custom JWT auth with Redis JTI blacklist |
| `/apps/backend/config/settings/base.py` | 150-220 | DRF + JWT + Redis config |

---

## 6. Access Control Summary

| Resource | Endpoint | Page Size | Auth | Notes |
|----------|----------|-----------|------|-------|
| Practice Questions | `/questions/practice/` | 5 | AllowAny | Public; filters by unlocked sets |
| Certifications | `/questions/certifications/` | N/A | AllowAny | Public list |
| Exam Sets | `/questions/certifications/{id}/sets/` | N/A | AllowAny | Filtered by purchase status |
| Comments (read) | `/questions/{id}/comments/` | N/A | AllowAny | Public read |
| Comments (create) | `/questions/{id}/comments/` | N/A | IsAuth | Authenticated users only |
| Bookmarks (list) | `/questions/bookmarks/` | N/A | IsAuth | User-specific |
| Bookmarks (toggle) | `/questions/{id}/bookmark/` | N/A | IsAuth | Authenticated users only |
| Upvote Comment | `/comments/{id}/upvote/` | N/A | IsAuth | Authenticated users only |
| Report Answer | `/questions/{id}/report/` | N/A | IsAuth | Authenticated; one per user/question |

---

## 7. Question Type Support

**Single Choice:** `question_type = 'single'`
- Radio button behavior in UI
- Must select exactly one answer to reveal

**Multiple Choice:** `question_type = 'multiple'`
- Checkbox behavior in UI
- Shows "Select all that apply" label
- Can select multiple answers

**Reveal Logic:** User's selected answers must exactly match correct answers for correctness.

---

## Unresolved Questions

1. **Exam paywall interaction:** How does purchasing an exam set affect practice accessibility? (Lines 86-98 in exam_views.py suggest paywall, but practice is public?)
2. **Exam set unlock logic:** What triggers `UserExamUnlock` creation? Is it automatic on purchase or manual?
3. **Comment nested replies:** Are nested replies (parent/child) flattened or returned hierarchically?
4. **Token rotation:** Is `ROTATE_REFRESH_TOKENS=True` enabled? (Backend config suggests yes, line 217 base.py)
5. **Rate limiting:** How are anon (1000/day) vs user (10000/day) throttles applied?

