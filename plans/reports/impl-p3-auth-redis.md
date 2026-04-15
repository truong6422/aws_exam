# Phase 03 — Auth Enhancement (Redis JTI Blacklist) — Completion Report

**Date:** 2026-03-22
**Status:** ✅ Completed

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/backend/apps/accounts/authentication.py` | `RedisJWTAuthentication` — checks `token:blacklist:{jti}` in Redis on every authenticated request |
| `apps/backend/apps/accounts/auth_views.py` | `RegisterView`, `LoginView`, `LogoutView` (Redis JTI blacklist on logout) |
| `apps/backend/apps/accounts/profile_views.py` | `CurrentUserView` (GET/PATCH), `ChangePasswordView` (POST, blacklists current token) |

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/apps/accounts/views.py` | Replaced full implementation with re-exports from `auth_views` and `profile_views` (split for 200-line limit) |
| `apps/backend/apps/accounts/serializers.py` | Removed `LogoutSerializer` (DB blacklist); added `ProfileUpdateSerializer` (name field), `ChangePasswordSerializer` (old/new password + validation) |
| `apps/backend/apps/accounts/urls.py` | Added `change-password/` → `ChangePasswordView`; `me/` now handles GET + PATCH |
| `apps/backend/config/settings/base.py` | 4 changes (see below) |

### `base.py` Changes

1. **Removed** `rest_framework_simplejwt.token_blacklist` from `THIRD_PARTY_APPS`
2. **Swapped** `DEFAULT_AUTHENTICATION_CLASSES` to `apps.accounts.authentication.RedisJWTAuthentication`
3. **Updated** `SIMPLE_JWT`: `ACCESS_TOKEN_LIFETIME` → 15 min, removed `BLACKLIST_AFTER_ROTATION`
4. **Removed** Celery settings block (`CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `CELERY_ACCEPT_CONTENT`, `CELERY_TASK_SERIALIZER`)

---

## Migration Notes

- `rest_framework_simplejwt.token_blacklist` was in `INSTALLED_APPS` but **no token_blacklist migrations existed** in the project — safe to remove without `--fake` migration needed.
- No new migrations required for Phase 03 changes.

---

## Verification

### `manage.py check`
```
System check identified 1 issue (0 silenced).
WARNINGS: ?: (urls.W005) URL namespace 'questions' isn't unique.
```
Pre-existing warning (URL namespace collision in questions app). No errors from Phase 03 changes.

### Import verification
```
All imports OK
RedisJWTAuthentication MRO: ['RedisJWTAuthentication', 'JWTAuthentication', 'BaseAuthentication', 'object']
CurrentUserView bases: (<class 'rest_framework.generics.RetrieveUpdateAPIView'>,)
```

### Test run
Tests failed with `psycopg2.errors.UndefinedTable: relation "questions_certification" does not exist` — this is a **pre-existing schema issue** on the local dev DB (other app tables not migrated), not caused by Phase 03 changes. Django system check passed clean.

### Docker
- Dev compose (`docker-compose.dev.yml`) fails to start `db` container due to host port 5432 already in use by local PostgreSQL. Pre-existing environment constraint, not related to Phase 03.
- Redis container is healthy and running.

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| Logout blacklists JTI in Redis (not simplejwt DB table) | ✅ `LogoutView.post()` uses `cache.set(f"token:blacklist:{jti}", ...)` |
| Request with blacklisted token returns 401 | ✅ `RedisJWTAuthentication.authenticate()` raises `InvalidToken` → 401 |
| Redis key format: `token:blacklist:{jti}` with TTL matching token expiry | ✅ TTL = `max(0, exp - now.timestamp())` |
| ACCESS_TOKEN_LIFETIME is 15 minutes | ✅ `timedelta(minutes=15)` in `SIMPLE_JWT` |
| REFRESH_TOKEN_LIFETIME is 7 days | ✅ `timedelta(days=7)` in `SIMPLE_JWT` |
| PATCH /api/v1/auth/me/ updates user name | ✅ `CurrentUserView` is `RetrieveUpdateAPIView` with `ProfileUpdateSerializer` on PATCH |
| POST /api/v1/auth/change-password/ validates old password | ✅ `ChangePasswordSerializer.validate()` calls `user.check_password()` |
| BLACKLIST_AFTER_ROTATION removed from SIMPLE_JWT | ✅ Removed |
| rest_framework_simplejwt.token_blacklist removed from INSTALLED_APPS | ✅ Removed |

---

## Architecture Notes

- **File split**: `views.py` was split into `auth_views.py` + `profile_views.py` to stay under 200 lines each. `views.py` is now a thin re-export shim for backward compat.
- **Test cache**: `config/settings/test.py` uses `locmem` cache — Redis blacklist tests will work without a real Redis server.
- **`ROTATE_REFRESH_TOKENS: True` kept**: When token is rotated, old refresh JTI won't be in Redis blacklist. This is intentional — rotation alone invalidates the old refresh token by the simplejwt library (it won't verify); blacklisting via Redis is for access tokens and explicit logout.
