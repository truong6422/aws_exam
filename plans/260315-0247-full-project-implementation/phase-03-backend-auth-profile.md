---
spec_id: phase-03-backend-auth-profile
version: "1.0"
status: completed
agents:
  - fullstack-developer
acceptance_criteria:
  - "Logout blacklists JTI in Redis (not simplejwt DB table)"
  - "Request with blacklisted token returns 401"
  - "Redis key format: token:blacklist:{jti} with TTL matching token expiry"
  - "ACCESS_TOKEN_LIFETIME is 15 minutes in settings"
  - "REFRESH_TOKEN_LIFETIME is 7 days in settings"
  - "PATCH /api/v1/auth/me/ updates user name"
  - "POST /api/v1/auth/change-password/ validates old password and sets new one"
  - "BLACKLIST_AFTER_ROTATION removed from SIMPLE_JWT settings"
  - "rest_framework_simplejwt.token_blacklist removed from INSTALLED_APPS"
---

# Phase 03 — Backend: Auth Enhancement (Redis JTI Blacklist) + Profile

## Overview

- **Priority**: P1 (Security — can run parallel with P1/P2)
- **Depends on**: Nothing (existing accounts app)
- **Blocks**: None directly (all phases benefit from proper auth)
- **Description**: Migrate logout from simplejwt DB blacklist (`token.blacklist()`) to Redis JTI blacklist. Add profile update and change password endpoints. Update JWT token lifetimes.

## Related Code Files

### Modify
- `apps/backend/apps/accounts/views.py` — rewrite LogoutView, add ProfileUpdateView, ChangePasswordView
- `apps/backend/apps/accounts/serializers.py` — remove LogoutSerializer (refresh-based), add ProfileUpdateSerializer, ChangePasswordSerializer
- `apps/backend/apps/accounts/urls.py` — add me/ PATCH, change-password/ POST
- `apps/backend/config/settings/base.py` — change DEFAULT_AUTHENTICATION_CLASSES, update SIMPLE_JWT, remove token_blacklist from INSTALLED_APPS, remove Celery settings

### Create
- `apps/backend/apps/accounts/authentication.py` — RedisJWTAuthentication class

### Delete
- None (remove simplejwt token_blacklist migration is handled by Django)

## Implementation Steps

### Step 1: Create Custom Authentication Class

Create `apps/accounts/authentication.py`:

```python
from django.core.cache import cache
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

class RedisJWTAuthentication(JWTAuthentication):
    """Check Redis blacklist on every authenticated request."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        jti = token.get('jti')
        if cache.get(f'token:blacklist:{jti}'):
            raise InvalidToken('Token has been revoked')
        return (user, token)
```

### Step 2: Rewrite LogoutView

Current implementation uses `RefreshToken(token_str).blacklist()` which writes to DB. Replace with Redis:

In `apps/accounts/views.py`, rewrite `LogoutView`:
- Accept both access and refresh tokens for blacklisting
- Get `jti` from the validated access token (`request.auth`)
- Calculate TTL: `max(0, token['exp'] - int(timezone.now().timestamp()))`
- Store in Redis: `cache.set(f'token:blacklist:{jti}', True, timeout=ttl)`
- Also blacklist refresh token JTI if provided in body
- Return `{detail: 'Logged out'}`

### Step 3: Remove Old LogoutSerializer

In `apps/accounts/serializers.py`:
- Remove `LogoutSerializer` class entirely (no longer need refresh token parsing)
- Add `RefreshTokenSerializer` — optional, accepts `refresh` field for blacklisting refresh token too

### Step 4: Add ProfileUpdateSerializer + View

In `apps/accounts/serializers.py`, add:
- **ProfileUpdateSerializer**: `fields = ['name']`, writable. Uses `ModelSerializer` on User model.

In `apps/accounts/views.py`, modify `CurrentUserView`:
- Change from `RetrieveAPIView` to `RetrieveUpdateAPIView`
- GET returns `UserProfileSerializer` (read-only)
- PATCH accepts `ProfileUpdateSerializer` (writable)
- Override `get_serializer_class` based on method

### Step 5: Add ChangePasswordView

In `apps/accounts/serializers.py`, add:
- **ChangePasswordSerializer**:
  - `old_password`: CharField(required=True)
  - `new_password`: CharField(required=True, min_length=8)
  - Validate `old_password` against `user.check_password()`
  - Validate `new_password` with Django password validators

In `apps/accounts/views.py`, add:
- **ChangePasswordView** (POST `/auth/change-password/`):
  - Permission: IsAuthenticated
  - Validate old password, set new password with `user.set_password()`
  - Blacklist current access token JTI after password change (force re-login)
  - Return `{detail: 'Password changed successfully'}`

### Step 6: Update URLs

In `apps/accounts/urls.py`, update:
- `me/` → CurrentUserView (now supports GET + PATCH)
- Add: `change-password/` → ChangePasswordView (POST)

### Step 7: Update Settings

In `config/settings/base.py`:

1. Change `DEFAULT_AUTHENTICATION_CLASSES`:
   ```python
   'DEFAULT_AUTHENTICATION_CLASSES': [
       'apps.accounts.authentication.RedisJWTAuthentication',
   ],
   ```

2. Update `SIMPLE_JWT`:
   ```python
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
       'ROTATE_REFRESH_TOKENS': True,
       'AUTH_HEADER_TYPES': ('Bearer',),
       # Remove BLACKLIST_AFTER_ROTATION — we use Redis now
   }
   ```

3. Remove `rest_framework_simplejwt.token_blacklist` from `INSTALLED_APPS`

4. Remove Celery settings block (no longer needed per architecture decision):
   - Remove `CELERY_BROKER_URL`
   - Remove `CELERY_RESULT_BACKEND`
   - Remove `CELERY_ACCEPT_CONTENT`
   - Remove `CELERY_TASK_SERIALIZER`

### Step 8: Handle Refresh Token Blacklisting

On logout, also blacklist refresh token if provided:
- Parse refresh token from request body (optional field)
- Decode JTI from refresh token using `RefreshToken(token_str)`
- Store in Redis with TTL = refresh token remaining lifetime
- This ensures rotated refresh tokens are also invalidated

## API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/auth/logout/` | Bearer JWT | `{refresh?: string}` | `{detail: 'Logged out'}` |
| GET | `/api/v1/auth/me/` | Bearer JWT | — | `{id, email, username, name, date_joined, is_staff}` |
| PATCH | `/api/v1/auth/me/` | Bearer JWT | `{name?: string}` | `{id, email, username, name, date_joined, is_staff}` |
| POST | `/api/v1/auth/change-password/` | Bearer JWT | `{old_password, new_password}` | `{detail: 'Password changed successfully'}` |

## Security Considerations

- **Redis TTL auto-cleanup**: Blacklisted JTIs expire automatically — no DB table growth.
- **Blacklist check on every request**: `RedisJWTAuthentication` checks Redis on each authenticated request. Redis is fast (~1ms).
- **Password change forces re-login**: After changing password, blacklist current access token.
- **Refresh token blacklisting**: Both access and refresh JTIs should be blacklisted on logout.
- **No `BLACKLIST_AFTER_ROTATION`**: Removed — we handle blacklisting manually via Redis.
- **Race condition**: Between logout and token check there's a tiny window. With 15min access tokens, this is acceptable.

## Acceptance Criteria

- Logout blacklists JTI in Redis (not simplejwt DB table)
- Request with blacklisted token returns 401
- Redis key format: token:blacklist:{jti} with TTL matching token expiry
- ACCESS_TOKEN_LIFETIME is 15 minutes in settings
- REFRESH_TOKEN_LIFETIME is 7 days in settings
- PATCH /api/v1/auth/me/ updates user name
- POST /api/v1/auth/change-password/ validates old password and sets new one
- BLACKLIST_AFTER_ROTATION removed from SIMPLE_JWT settings
- rest_framework_simplejwt.token_blacklist removed from INSTALLED_APPS
