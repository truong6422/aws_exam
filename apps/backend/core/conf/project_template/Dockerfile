# Define base image as python slim-buster.
FROM python:3.10-slim-buster AS base

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DJANGO_SETTINGS_MODULE={{ project_name }}.settings

# This is the first stage of the build.
# It will install all requirements.
RUN apt-get update && \
    apt-get install libpq-dev python3-dev -y && \
    apt-get install -y xvfb gnupg wget curl unzip g++ build-essential --no-install-recommends && \
    apt-get clean

# Install poetry
RUN pip install --no-cache-dir setuptools poetry

# Copy in the config files
COPY pyproject.toml poetry.lock ./

# Define the base directory
WORKDIR /BE
COPY . .

# Install only dependencies
RUN poetry install --no-root --only main

EXPOSE 8000

CMD ["chmod", "+x", "/BE/start.sh"]
ENTRYPOINT ["sh", "/BE/start.sh"]
