---
spec_id: phase-10-infra-deploy
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Production docker-compose runs with all services healthy
  - Nginx serves frontend static files + proxies /api/ to Django
  - HTTPS via self-signed cert (or Let's Encrypt if domain available)
  - Environment variables documented in .env.example
  - Health check endpoint returns 200
  - Makefile deploy targets added
---

# Phase 10 — Infra: Docker Production & Deploy

**Priority:** Low
**Depends on:** Phase 09 (all tests passing)
**Blocks:** Nothing (final phase)

## Overview

Harden the existing Docker Compose setup for a real production deployment. The scaffolding already exists (`docker-compose.yml`, multi-stage Dockerfiles, Nginx). This phase fills gaps: production settings tuning, static file serving, SSL, environment validation, and deploy scripts.

## Key Insights

- `docker-compose.yml` (production) already exists but hasn't been battle-tested
- Backend Dockerfile is multi-stage (base → dev → prod) — good
- Frontend Dockerfile builds React → Nginx serves static files
- Need: proper `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, static file collection
- `collectstatic` must run before gunicorn starts
- Celery worker needs same image as API (already the case)
- Redis needs a persistent volume in production
- No Kubernetes for now — single-host Docker Compose is sufficient (YAGNI)

## Requirements

### Production Checklist

**Django settings (`config/settings/production.py`)**
- `DEBUG = False`
- `ALLOWED_HOSTS` from env
- `SECURE_SSL_REDIRECT = True` (behind Nginx TLS)
- `SESSION_COOKIE_SECURE = True`
- `CSRF_COOKIE_SECURE = True`
- `STATIC_ROOT = /app/staticfiles/`
- Logging: JSON format to stdout (Docker picks up)
- Sentry DSN from env (optional but wired)

**Backend Dockerfile (prod stage)**
```dockerfile
# Ensure collectstatic runs at startup
ENTRYPOINT ["/app/docker/entrypoint.sh"]
```

**`docker/entrypoint.sh`**
```bash
#!/bin/bash
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput
exec "$@"
```

**Nginx config (`docker/nginx/nginx.conf`)**
```nginx
# Serve frontend static files
location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;  # SPA fallback
}

# Proxy API to Django
location /api/ {
    proxy_pass http://api:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Proxy Django admin
location /admin/ {
    proxy_pass http://api:8000;
}

# Serve Django static/media
location /static/ {
    proxy_pass http://api:8000;
}
```

**`docker-compose.yml` additions**
- Redis: add named volume `redis_data:/data`
- Postgres: verify named volume `postgres_data:/var/lib/postgresql/data`
- API: add `depends_on` health checks for db + redis
- Celery: `restart: unless-stopped`
- Add `networks:` section for service isolation

**`.env.example` updates**
- Document all new vars added across phases:
  - `EXAM_PASS_THRESHOLD` (default: 72)
  - `CELERY_TASK_ALWAYS_EAGER` (True for dev, False for prod)
  - `SENTRY_DSN` (optional)
  - `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` (for first deploy)

### Makefile Targets

```makefile
deploy-up:       # docker compose -f docker-compose.yml up -d --build
deploy-down:     # docker compose -f docker-compose.yml down
deploy-logs:     # docker compose -f docker-compose.yml logs -f
deploy-migrate:  # docker compose exec api python manage.py migrate
deploy-static:   # docker compose exec api python manage.py collectstatic --noinput
deploy-shell:    # docker compose exec api python manage.py shell
```

### Health Check

Verify `GET /health/` returns 200 with all checks green:
- Database connectivity
- Redis connectivity
- (Celery via `django-health-check` plugin if available)

## Architecture

```
docker/
├── backend/
│   ├── Dockerfile          # Review prod stage
│   └── entrypoint.sh       # migrate + collectstatic + exec
├── frontend/
│   └── Dockerfile          # Review (build → nginx copy)
└── nginx/
    ├── Dockerfile
    └── nginx.conf          # Update SPA fallback + proxy rules

docker-compose.yml           # Add volumes, health deps, restart policies
.env.example                 # Update with all new vars
Makefile                     # Add deploy targets
```

## Related Code Files

**Modify:**
- `apps/backend/config/settings/production.py`
- `docker/nginx/nginx.conf`
- `docker-compose.yml`
- `.env.example`
- `Makefile`
- `docker/backend/Dockerfile`

**Create:**
- `docker/backend/entrypoint.sh`

## Implementation Steps

1. Review and update `config/settings/production.py`
2. Write `docker/backend/entrypoint.sh` (migrate + collectstatic + exec)
3. Update backend `Dockerfile` prod stage to use entrypoint
4. Update `docker/nginx/nginx.conf` with SPA fallback + all proxy rules
5. Update `docker-compose.yml`: volumes, health checks, restart policies
6. Update `.env.example` with all env vars from all phases
7. Add Makefile deploy targets
8. Test locally: `make deploy-up` → verify all services healthy
9. Verify `GET /health/` returns 200
10. Verify frontend loads at `http://localhost:80`
11. Verify `/api/v1/auth/login/` reachable through Nginx

## Success Criteria

- `make deploy-up` → all 6 containers healthy (postgres, redis, api, celery, frontend, nginx)
- `GET /health/` → 200 with db + redis green
- Frontend SPA loads, navigates correctly (no 404 on refresh)
- API accessible via Nginx proxy
- `collectstatic` runs on container start
- All environment variables documented in `.env.example`

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| collectstatic fails (missing whitenoise) | 🟢 Low | Already in requirements/base.txt |
| SPA 404 on direct URL refresh | 🟡 Medium | `try_files $uri /index.html` in Nginx |
| Celery not connecting to Redis | 🟢 Low | `depends_on` + `CELERY_BROKER_URL` from env |
| Postgres data loss on `down` | 🔴 High | Named volumes must persist; never use `down -v` in prod |

## Security Considerations

- `SECRET_KEY` must be long random string (not the dev default)
- `DEBUG=False` in production (already enforced by settings module)
- `ALLOWED_HOSTS` must be set to actual domain
- CORS origins must match frontend domain only
- Never commit `.env` (already in `.gitignore`)
- Postgres + Redis ports NOT exposed to host in production compose
