---
spec_id: phase-10-infra-deploy
version: "1.0"
status: in-progress
blockedBy:
  - phase-09-integration-tests
agents:
  - fullstack-developer
acceptance_criteria:
  - "docker-compose up builds and starts all services (django, postgres, redis, nginx)"
  - "Nginx serves React SPA static files and proxies /api/ to Django"
  - "GET /health/ returns 200 from Django health check"
  - "Sentry captures Django errors (sentry-sdk[django] installed)"
  - "Sentry captures React errors (@sentry/react installed)"
  - "DEBUG=False in production settings"
  - "ALLOWED_HOSTS, CORS settings configured for production"
  - "All services have restart: always in docker-compose"
  - "Environment variables documented in .env.example"
---

# Phase 10 — Infrastructure & Production Deploy

## Overview

- **Priority**: P3 (Ship after all features tested)
- **Depends on**: P9 (All tests must pass)
- **Blocks**: Nothing (final phase)
- **Description**: Production-ready Docker Compose with Nginx reverse proxy, Sentry error tracking, and deployment checklist. Verify all services start cleanly.

## Related Code Files

### Modify
- `docker-compose.yml` (or `docker-compose.prod.yml`) — verify all services configured
- `apps/backend/config/settings/base.py` — add Sentry SDK init
- `apps/backend/config/settings/production.py` — production overrides (create if not exists)
- `apps/backend/requirements/base.txt` — add `sentry-sdk[django]`
- `apps/frontend/package.json` — add `@sentry/react`
- `apps/frontend/src/main.tsx` — init Sentry

### Create
- `nginx/nginx.conf` — Nginx configuration for SPA + API proxy (if not exists)
- `nginx/Dockerfile` — Nginx container (if not exists)
- `.env.example` — documented environment variables template
- `apps/backend/config/settings/production.py` — if not exists

### Delete
- None

## Implementation Steps

### Step 1: Verify Docker Compose (Production)

Check existing `docker-compose.yml` or create `docker-compose.prod.yml`. Required services:

1. **django** (backend):
   - Build from `apps/backend/Dockerfile`
   - Command: `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3`
   - Environment: load from `.env`
   - Depends on: postgres, redis
   - `restart: always`
   - Expose port 8000 internally (not to host)

2. **postgres**:
   - Image: `postgres:16-alpine`
   - Volume: `postgres_data:/var/lib/postgresql/data`
   - Environment: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
   - `restart: always`
   - Health check: `pg_isready`

3. **redis**:
   - Image: `redis:7-alpine`
   - Command: `redis-server --appendonly yes`
   - Volume: `redis_data:/data`
   - `restart: always`
   - Health check: `redis-cli ping`

4. **nginx**:
   - Build from `nginx/Dockerfile` or image `nginx:alpine`
   - Volumes: mount built React SPA files + nginx.conf
   - Ports: `80:80`, `443:443` (if TLS)
   - Depends on: django
   - `restart: always`

### Step 2: Configure Nginx

Create `nginx/nginx.conf`:

Key nginx locations:
- `location /` → `root /usr/share/nginx/html; try_files $uri $uri/ /index.html;` (SPA fallback)
- `location /api/` → `proxy_pass http://django:8000;` + standard proxy headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
- `location /health/` → proxy to django:8000
- `location /admin/` → proxy to django:8000
- `location /static/` → `alias /usr/share/nginx/static/;` (Django collectstatic output)
- `client_max_body_size 10M;` (for JSON imports)

### Step 3: Setup Sentry — Backend

Add `sentry-sdk[django]` to requirements.

In `config/settings/base.py` (or `production.py`):

```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

SENTRY_DSN = config("SENTRY_DSN", default="")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,  # 10% of transactions
        send_default_pii=False,   # Don't send user PII
        environment=config("ENVIRONMENT", default="production"),
    )
```

### Step 4: Setup Sentry — Frontend

Install: `npm install @sentry/react`

In `apps/frontend/src/main.tsx`:

```typescript
import * as Sentry from '@sentry/react'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT || 'production',
    tracesSampleRate: 0.1,
  })
}
```

Wrap `<App>` with `Sentry.ErrorBoundary` for global error catching.

### Step 5: Create Production Settings

Create or update `config/settings/production.py`:

```python
from .base import *

DEBUG = False
ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# CORS — restrict to frontend domain
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", cast=Csv())

# Static files collected by collectstatic
STATIC_ROOT = BASE_DIR / "staticfiles"
```

### Step 6: Create .env.example

Document all required environment variables:

```bash
# Django
SECRET_KEY=change-me-in-production
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
ENVIRONMENT=production
DJANGO_SETTINGS_MODULE=config.settings.production

# Database
DB_NAME=aws_exam_app
DB_USER=postgres
DB_PASSWORD=change-me
DB_HOST=postgres
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Frontend
VITE_API_URL=https://yourdomain.com
VITE_ENVIRONMENT=production
```

### Step 7: Build & Deploy Script

Create or update deployment workflow:

```bash
# Build frontend
cd apps/frontend && npm run build
# Copy build output to nginx serve directory

# Collect Django static files
cd apps/backend && python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate --noinput

# Start services
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 8: Production Checklist

Verify before going live:

- [ ] `DEBUG=False` in production settings
- [ ] `SECRET_KEY` is unique and not committed to git
- [ ] `ALLOWED_HOSTS` set to actual domain(s)
- [ ] `CORS_ALLOWED_ORIGINS` matches frontend domain
- [ ] PostgreSQL uses strong password
- [ ] Redis not exposed to public network
- [ ] Sentry DSN configured for both backend + frontend
- [ ] `GET /health/` returns 200
- [ ] Nginx serves SPA correctly (deep links work via try_files)
- [ ] `/api/` endpoints proxied correctly
- [ ] Django admin accessible at `/admin/`
- [ ] Static files served (Django admin CSS loads)
- [ ] SSL/TLS configured (if using HTTPS)
- [ ] `client_max_body_size` allows JSON imports (10M)
- [ ] All services restart on failure (`restart: always`)
- [ ] Database backups configured (if RDS, automatic)
- [ ] Log output accessible (docker logs or centralized)

## Security Considerations

- **SECRET_KEY**: Random, 50+ chars, never in git.
- **No PII in Sentry**: `send_default_pii=False`.
- **Redis not public**: Only accessible within Docker network — no host port mapping.
- **HTTPS**: Use Let's Encrypt + certbot or AWS ACM.
- **Security headers**: HSTS, XSS filter, Content-Type nosniff, X-Frame-Options DENY.
- **.env not committed**: Must be in `.gitignore`.
- **RDS note**: For production, consider managed RDS ($15-30/mo) for automated backups + failover. MVP can use Postgres container; migrate when user count grows. Update `DB_HOST` to RDS endpoint and remove postgres service.

## Acceptance Criteria

- docker-compose up builds and starts all services (django, postgres, redis, nginx)
- Nginx serves React SPA static files and proxies /api/ to Django
- GET /health/ returns 200 from Django health check
- Sentry captures Django errors (sentry-sdk[django] installed)
- Sentry captures React errors (@sentry/react installed)
- DEBUG=False in production settings
- ALLOWED_HOSTS, CORS settings configured for production
- All services have restart: always in docker-compose
- Environment variables documented in .env.example
