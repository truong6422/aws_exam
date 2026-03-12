# Local Development Environment Setup (Linux, no Docker)

Prerequisites: **Python 3.12+**, **PostgreSQL 16+**, **Redis 7+** running locally.

---

## 1. Clone & enter the repo

```bash
git clone <repo-url> aws-exam-app
cd aws-exam-app
```

---

## 2. Create the Python virtual environment

```bash
# Option A — one command via Makefile (recommended)
make venv

# Option B — manual
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r apps/backend/requirements/dev.txt
```

The `.venv` lives at the **repo root**. Re-activate it in every new terminal:

```bash
source .venv/bin/activate
```

---

## 3. Configure environment variables

`python-decouple` (used by Django settings) searches for `.env` starting from
the **current working directory**. Because `manage.py` is invoked from repo root
(via `PYTHONPATH=apps/backend`), the root `.env` is picked up automatically.

A pre-filled local `.env` is already provided at repo root. Review and adjust if needed:

```bash
# Key values in .env
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=change-me-dev-only-not-for-production
DEBUG=True

DB_NAME=awsexam_dev
DB_USER=awsexam
DB_PASSWORD=awsexam
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379/0
```

> **Important:** Never commit `.env` to version control. It is already listed in `.gitignore`.

To override `DJANGO_SETTINGS_MODULE` for a single command:

```bash
DJANGO_SETTINGS_MODULE=config.settings.production python apps/backend/manage.py check
```

---

## 4. Create the local PostgreSQL database

Ensure PostgreSQL is running, then create the user and database:

```bash
# Create the role (skip if it already exists)
psql -U postgres -c "CREATE ROLE awsexam WITH LOGIN PASSWORD 'awsexam';"

# Create the database owned by that role
psql -U postgres -c "CREATE DATABASE awsexam_dev OWNER awsexam;"

# Quick verification
psql -U awsexam -d awsexam_dev -c "\conninfo"
```

Alternatively, using the `createdb` shortcut:

```bash
createdb -U postgres -O awsexam awsexam_dev
```

---

## 5. Apply migrations

```bash
# Via Makefile (recommended)
make migrate

# Or manually (from repo root, with .venv active)
PYTHONPATH=apps/backend DJANGO_SETTINGS_MODULE=config.settings.development \
  python apps/backend/manage.py migrate
```

---

## 6. Create a superuser

```bash
# Via Makefile — set these env vars first:
export DJANGO_SUPERUSER_USERNAME=admin
export DJANGO_SUPERUSER_EMAIL=admin@example.com
export DJANGO_SUPERUSER_PASSWORD=changeme
make createsuper

# Or interactively:
PYTHONPATH=apps/backend DJANGO_SETTINGS_MODULE=config.settings.development \
  python apps/backend/manage.py createsuperuser
```

---

## 7. Run the development server

```bash
# Via Makefile
make dev-backend

# Or manually
PYTHONPATH=apps/backend DJANGO_SETTINGS_MODULE=config.settings.development \
  python apps/backend/manage.py runserver
```

API is available at `http://localhost:8000/`.
Django admin: `http://localhost:8000/admin/`.

---

## 8. Run backend tests

```bash
make test-backend
```

This runs `pytest` with coverage reporting against `config.settings.development`.

---

## 9. Run the linter

```bash
make lint
```

---

## Makefile quick-reference

| Target          | Description                                      |
|-----------------|--------------------------------------------------|
| `make venv`     | Create `.venv` and install `requirements/dev.txt` |
| `make dev-backend` | Start Django dev server on `:8000`            |
| `make migrate`  | Apply all pending Django migrations              |
| `make makemigrations` | Generate new migration files               |
| `make createsuper` | Create superuser (needs `DJANGO_SUPERUSER_*`) |
| `make test-backend` | Run pytest with coverage                    |
| `make lint`     | Run ruff on backend source                      |
| `make shell`    | Open Django interactive shell                   |
| `make clean`    | Remove `.venv` and `__pycache__` artefacts      |

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'config'`**
→ Ensure `PYTHONPATH=apps/backend` is set, or use the Makefile targets which set it automatically.

**`django.db.utils.OperationalError: connection refused`**
→ Check PostgreSQL is running: `pg_isready -h localhost -p 5432`

**`django.core.exceptions.ImproperlyConfigured: SECRET_KEY`**
→ Ensure `.env` exists at repo root and `SECRET_KEY` is set.

**`ModuleNotFoundError: No module named 'debug_toolbar'`**
→ Run `make venv` (or `pip install -r apps/backend/requirements/dev.txt`) to install dev dependencies.

**Redis connection errors (cache/channels)**
→ Start Redis: `redis-server` or `sudo systemctl start redis`
