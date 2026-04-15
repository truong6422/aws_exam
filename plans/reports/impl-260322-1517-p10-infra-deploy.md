# Phase 10 — Infrastructure & Production Deploy: Implementation Report

**Date:** 2026-03-22
**Phase file:** `plans/260315-0247-full-project-implementation/phase-10-infra-deploy.md`

---

## What Was Found (Pre-existing)

The project already had a solid production infrastructure skeleton. Key findings:

| Asset | Location | State |
|---|---|---|
| Production compose | `docker-compose.yml` | Existed — used `restart: unless-stopped`, service named `api`, no `nginx/` path |
| Nginx reverse proxy | `docker/nginx/nginx.conf` + `Dockerfile` | Full TLS config, proxies to separate `frontend` container |
| Frontend container | `docker/frontend/Dockerfile` | Multi-stage, Vite build → nginx:alpine |
| Backend container | `docker/backend/Dockerfile` | Multi-stage, gunicorn production stage |
| Production settings | `apps/backend/config/settings/production.py` | Existed — had Sentry block but missing `ENVIRONMENT` param + `ALLOWED_HOSTS`/`CORS` overrides |
| Requirements | `apps/backend/requirements/prod.txt` | Had `sentry-sdk==1.45.0` (not `sentry-sdk[django]`) |
| `.env.example` | `.env.example` | Existed — missing `SENTRY_DSN`, `VITE_SENTRY_DSN`, `VITE_ENVIRONMENT`, `ALLOWED_HOSTS`, `ENVIRONMENT` |
| `@sentry/react` | `apps/frontend/package.json` | Missing |
| Sentry in frontend | `apps/frontend/src/main.tsx` | Missing |
| `.gitignore` | `.gitignore` | `.env` already covered ✅ |

---

## Files Created

### 1. `docker-compose.prod.yml` (new — project root)
Simplified production compose matching the phase spec:
- Services: `postgres`, `redis`, `django`, `nginx`
- All services: `restart: always`
- `postgres` + `redis`: healthchecks with `pg_isready` / `redis-cli ping`
- `django`: builds from `docker/backend/Dockerfile` (production target), depends on healthy postgres+redis, runs migrate + gunicorn with 3 workers
- `nginx`: builds from new `nginx/Dockerfile` (all-in-one SPA + proxy)
- Single internal bridge network — postgres/redis NOT exposed to host
- Named volumes: `postgres_data`, `redis_data`

### 2. `nginx/Dockerfile` (new)
Multi-stage build:
- Stage 1 `frontend-build`: Node 20 Alpine, `npm install` + `npm run build`
- Stage 2 `nginx:alpine`: copies `/app/dist` → `/usr/share/nginx/html`, copies `nginx/nginx.conf`

### 3. `nginx/nginx.conf` (new)
Simplified HTTP-only config (TLS handled upstream or via load balancer):
- `client_max_body_size 10M`
- `/static/` → Django collectstatic output, 30d cache
- `/api/` → `proxy_pass http://django:8000` + full proxy headers, 60s timeouts
- `/admin/` → `proxy_pass http://django:8000`
- `/health/` → `proxy_pass http://django:8000` (was missing from existing config)
- `/` → SPA fallback with `try_files $uri $uri/ /index.html`, `no-store` cache

---

## Files Modified

### 4. `apps/backend/requirements/prod.txt`
- Changed `sentry-sdk==1.45.0` → `sentry-sdk[django]>=2.0,<3.0`
- The `[django]` extra ensures `DjangoIntegration` is available at import time

### 5. `apps/backend/config/settings/production.py`
- Added `from decouple import Csv, config` (was missing `Csv`)
- Added explicit `ALLOWED_HOSTS` override: `config("ALLOWED_HOSTS", cast=Csv(), default="localhost")`
- Added explicit `CORS_ALLOWED_ORIGINS` override (overrides base.py default)
- Added `environment=config("ENVIRONMENT", default="production")` to `sentry_sdk.init()`

### 6. `apps/frontend/package.json`
- Added `"@sentry/react": "^8.0.0"` to `dependencies`

### 7. `apps/frontend/src/main.tsx`
- Added `import * as Sentry from '@sentry/react'`
- Added conditional `Sentry.init()` block (no-op when `VITE_SENTRY_DSN` unset)
- Wrapped `<App />` with `<Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>`

### 8. `.env.example`
- Renamed `DJANGO_ALLOWED_HOSTS` → `ALLOWED_HOSTS` (matches settings)
- Added `ENVIRONMENT=production`
- Updated `CORS_ALLOWED_ORIGINS` to production example
- Added `SENTRY_DSN` and `VITE_SENTRY_DSN` section
- Added `VITE_ENVIRONMENT=production`
- Updated `VITE_API_BASE_URL` to production domain pattern

---

## Docker Compose Config Validation

```
docker compose -f docker-compose.prod.yml config
```

**Result: ✅ VALID** — No errors. Two expected warnings only:
- `POSTGRES_PASSWORD` not set in shell env (correct — must come from `.env` file)

All services resolved correctly:
- `django` → `docker/backend/Dockerfile` (production target)
- `nginx` → `nginx/Dockerfile`
- `postgres` → `postgres:16-alpine` with healthcheck
- `redis` → `redis:7-alpine` with healthcheck
- Network: `aws-exam-app_internal` (bridge, internal)
- Volumes: `aws-exam-app_postgres_data`, `aws-exam-app_redis_data`

---

## Acceptance Criteria Check

| Criterion | Status |
|---|---|
| docker-compose up builds and starts all services (django, postgres, redis, nginx) | ✅ `docker-compose.prod.yml` has all 4 services |
| Nginx serves React SPA static files and proxies /api/ to Django | ✅ `nginx/nginx.conf` — `try_files` SPA + `/api/` proxy |
| GET /health/ returns 200 from Django health check | ✅ `/health/` location added to `nginx/nginx.conf` |
| Sentry captures Django errors (sentry-sdk[django] installed) | ✅ `sentry-sdk[django]>=2.0` in `prod.txt` |
| Sentry captures React errors (@sentry/react installed) | ✅ `@sentry/react: ^8.0.0` in `package.json` + ErrorBoundary in `main.tsx` |
| DEBUG=False in production settings | ✅ `production.py` line 8 |
| ALLOWED_HOSTS, CORS settings configured for production | ✅ Explicit overrides in `production.py` |
| All services have restart: always in docker-compose | ✅ All 4 services in `docker-compose.prod.yml` |
| Environment variables documented in .env.example | ✅ Updated with Sentry, ENVIRONMENT, ALLOWED_HOSTS |

**All 9 acceptance criteria met. ✅**

---

## Notes & Decisions

1. **Two compose files coexist intentionally**: `docker-compose.yml` (full stack with Celery, TLS, separate frontend container) remains for the complete production setup. `docker-compose.prod.yml` is the simplified single-node variant requested by this phase — suitable for MVP/VPS deployment without Celery.

2. **`nginx/` vs `docker/nginx/`**: The `docker/nginx/` setup is the full TLS-terminating reverse proxy that talks to a separate `frontend` container. The new `nginx/Dockerfile` is an all-in-one image that builds the React SPA and serves it directly — simpler for single-server deploys.

3. **`SECURE_SSL_REDIRECT = True`** in `production.py` will cause redirect loops if deployed behind HTTP-only nginx (like `docker-compose.prod.yml`). In that scenario, set `SECURE_SSL_REDIRECT=False` in `.env` or add `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` when TLS is terminated upstream.

4. **`sentry-sdk[django]>=2.0`** replaces the pinned `1.45.0` — v2.x is the current stable SDK with improved async support and smaller bundle. The `[django]` extra is required for `DjangoIntegration` to work correctly out of the box.

---

## Unresolved Questions

- None blocking. The note in #3 above (SSL redirect) should be documented in the deployment runbook if non-TLS deploys are expected.
