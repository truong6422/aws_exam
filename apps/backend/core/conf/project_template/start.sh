#!/bin/bash

set -e

cd /BE || exit 1

poetry run python3 manage.py migrate &
poetry run python3 manage.py migrate_data &
poetry run python3 manage.py collectstatic --noinput &
# poetry run python3 -m celery --app {{ project_name }}.celery worker -l info &
# poetry run python3 -m celery --app {{ project_name }}.celery beat -l info &
poetry run python3 manage.py runserver 0.0.0.0:8000
