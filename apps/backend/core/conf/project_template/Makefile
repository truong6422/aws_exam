install-dev:
	poetry install
	if [ ! -f .env ]; then cp env.local .env; fi
	make install-hooks
	poetry run python manage.py migrate
	poetry run python manage.py migrate_master_data

test:
	poetry run flake8

check-coverage:
	poetry run coverage run --source='.' manage.py test

check-migrations:
	poetry run python manage.py makemigrations --check --no-input --dry-run

check-deploy:
	poetry run python manage.py check --deploy

celery:
	poetry run python3 -m celery --app {{ project_name }}.celery worker -l info && poetry run python3 -m celery --app {{ project_name }}.celery beat -l info

server:
	poetry run python manage.py migrate && poetry run python manage.py runserver

install-hooks:
	echo "make test && make check-migrations" > .git/hooks/pre-commit && chmod 777 .git/hooks/pre-commit
