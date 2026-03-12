# ─────────────────────────────────────────────────────────────────────────────
# aws-exam-app — Developer Makefile
# Prerequisites: Python 3.12+, PostgreSQL 16+, Redis 7+
# All commands assume a .venv at the repo root and .env loaded automatically
# by python-decouple from the repo root (or apps/backend/).
# ─────────────────────────────────────────────────────────────────────────────

PYTHON        := .venv/bin/python
PIP           := .venv/bin/pip
MANAGE        := $(PYTHON) apps/backend/manage.py
PYTEST        := .venv/bin/pytest
RUFF          := .venv/bin/ruff
REQUIREMENTS  := apps/backend/requirements/dev.txt

# Export DJANGO_SETTINGS_MODULE so every target picks it up without a shell profile
export DJANGO_SETTINGS_MODULE := config.settings.development
# python-decouple searches for .env starting from the CWD; running manage.py
# from repo root means it finds the root .env automatically.
export PYTHONPATH := apps/backend

.PHONY: help venv dev-backend migrate makemigrations createsuper \
        test-backend lint shell clean

# ── Default target ────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  aws-exam-app — available make targets"
	@echo "  ──────────────────────────────────────────────────────"
	@echo "  venv           Create .venv and install dev requirements"
	@echo "  dev-backend    Run Django dev server on :8000"
	@echo "  migrate        Apply Django database migrations"
	@echo "  makemigrations Generate new migration files"
	@echo "  createsuper    Create a Django superuser (non-interactive)"
	@echo "  test-backend   Run backend test suite with pytest"
	@echo "  lint           Run ruff linter on backend source"
	@echo "  shell          Open Django interactive shell"
	@echo "  clean          Remove .venv and compiled Python artefacts"
	@echo ""

# ── Virtual environment ───────────────────────────────────────────────────────
venv:
	@if [ ! -d ".venv" ]; then \
		echo "→ Creating .venv with $(shell python3 --version)…"; \
		python3 -m venv .venv; \
	else \
		echo "→ .venv already exists, skipping creation."; \
	fi
	$(PIP) install --upgrade pip --quiet
	$(PIP) install -r $(REQUIREMENTS)
	@echo "✓ Virtual environment ready. Activate with: source .venv/bin/activate"

# ── Backend dev server ────────────────────────────────────────────────────────
dev-backend:
	$(MANAGE) runserver 0.0.0.0:8000

# ── Database migrations ───────────────────────────────────────────────────────
migrate:
	$(MANAGE) migrate

makemigrations:
	$(MANAGE) makemigrations

# ── Superuser (non-interactive via env vars) ──────────────────────────────────
# Set these in your shell before running:
#   export DJANGO_SUPERUSER_USERNAME=admin
#   export DJANGO_SUPERUSER_EMAIL=admin@example.com
#   export DJANGO_SUPERUSER_PASSWORD=changeme
createsuper:
	$(MANAGE) createsuperuser --noinput

# ── Tests ─────────────────────────────────────────────────────────────────────
test-backend:
	$(PYTEST) apps/backend --ds=config.settings.development \
		--cov=apps/backend --cov-report=term-missing -v

# ── Linting ───────────────────────────────────────────────────────────────────
lint:
	$(RUFF) check apps/backend

# ── Django shell ──────────────────────────────────────────────────────────────
shell:
	$(MANAGE) shell

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	rm -rf .venv
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ Cleaned .venv and compiled Python artefacts."
