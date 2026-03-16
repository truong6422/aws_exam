---
spec_id: phase-03-backend-auth-profile
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - UserProfile model with display name, avatar URL, certification targets
  - Profile GET/PATCH endpoint
  - JWT token refresh endpoint working
  - Password change endpoint
  - Unit tests for all endpoints
---

# Phase 03 — Backend: User Profiles & Auth Enhancements

**Priority:** Medium
**Depends on:** None (parallel to P1/P2)
**Blocks:** Phase 04 (Analytics uses profile)

## Overview

Extend the existing `User` model stub and `accounts` app with a profile layer, password management, and token refresh. Minimal scope — only what's needed for the UI.

## Key Insights

- Current `User` has: `email`, `username`, `AbstractUser` fields only
- Frontend needs: display name, avatar URL for navbar/profile
- Certification target (e.g., "SAA-C03") drives Practice mode defaults
- Password change required for settings page
- JWT refresh already wired at `/api/v1/auth/login/` (simplejwt) — just needs tests

## Requirements

### Models

**`UserProfile`** (OneToOne with User)
```python
user            # OneToOneField → User (related_name='profile')
display_name    # CharField(max_length=100, blank=True)
avatar_url      # URLField(blank=True)
cert_target     # CharField(max_length=20, blank=True)  e.g. 'SAA-C03'
bio             # TextField(blank=True, max_length=300)
```

Auto-created via `post_save` signal on User creation.

### API Endpoints

```
GET  /api/v1/auth/me/              Current user + profile (existing, expand response)
PATCH /api/v1/auth/me/             Update profile fields
POST /api/v1/auth/password/change/ Change password (old + new)
POST /api/v1/auth/refresh/         Refresh JWT (already exists via simplejwt)
```

### Serializers

- `UserSerializer` — extend to include nested `profile` fields
- `ProfileUpdateSerializer` — writable, only profile fields
- `PasswordChangeSerializer` — validate old password, enforce new password rules

### Permissions
- All endpoints: `IsAuthenticated`

## Architecture

```
apps/accounts/
├── models.py           # Add UserProfile + post_save signal
├── serializers.py      # Expand UserSerializer, add ProfileUpdateSerializer
├── views.py            # Add ProfileUpdateView, PasswordChangeView
├── urls.py             # Add new routes
└── tests/
    ├── test_profile.py
    └── test_password.py
```

## Related Code Files

**Modify:**
- `apps/accounts/models.py` — add `UserProfile` + signal
- `apps/accounts/serializers.py` — expand `UserSerializer`
- `apps/accounts/views.py` — add `ProfileUpdateView`, `PasswordChangeView`
- `apps/accounts/urls.py` — add routes

**Create:**
- `apps/accounts/tests/test_profile.py`
- `apps/accounts/tests/test_password.py`

## Implementation Steps

1. Add `UserProfile` model + `post_save` signal to `models.py`
2. Generate migration
3. Expand `UserSerializer` to include profile fields (read)
4. Write `ProfileUpdateSerializer` (writable profile fields only)
5. Write `PasswordChangeSerializer` with old-password validation
6. Add `ProfileUpdateView` (`RetrieveUpdateAPIView`, partial PATCH)
7. Add `PasswordChangeView` (APIView, POST)
8. Update `urls.py`
9. Write tests

## Success Criteria

- `GET /api/v1/auth/me/` returns user + profile
- `PATCH /api/v1/auth/me/` updates profile fields only
- `POST /api/v1/auth/password/change/` changes password, invalidates old tokens
- Auto-created profile on user registration
- All tests pass

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Signal not firing in tests | 🟢 Low | Use `@receiver` properly, test with `create_user` |
| Token invalidation after pw change | 🟡 Medium | Use simplejwt's `OutstandingToken` model |
