# Backend Dockerfile — multi-stage build
# Stages:
#   base        → shared OS deps + Python env
#   development → base + dev/test tools, no source copy (bind-mounted at runtime)
#   production  → base + source copy + prod deps, lean final image

# ── base ──────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System packages required by psycopg2, Pillow, and Channels
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── development ───────────────────────────────────────────────────────────────
FROM base AS development

# Install base + dev deps (includes pytest, ruff, debug-toolbar, etc.)
COPY apps/backend/requirements/base.txt requirements/base.txt
COPY apps/backend/requirements/dev.txt  requirements/dev.txt
RUN pip install --upgrade pip && pip install -r requirements/dev.txt

# Source is bind-mounted at runtime — no COPY needed here.
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ── production ────────────────────────────────────────────────────────────────
FROM base AS production

# Install base + prod deps (gunicorn, whitenoise, sentry-sdk)
COPY apps/backend/requirements/base.txt requirements/base.txt
COPY apps/backend/requirements/prod.txt requirements/prod.txt
RUN pip install --upgrade pip && pip install -r requirements/prod.txt

# Copy application source after deps so source changes don't bust the pip layer
COPY apps/backend/ .

# Non-root user for security
RUN groupadd --gid 1001 appuser && \
    useradd  --uid 1001 --gid appuser --shell /bin/bash --create-home appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000
# WhiteNoise serves static files directly from the app — no collectstatic volume needed.
# Migrations run here so the container is self-contained on first start.
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120"]
