# Install poetry
https://python-poetry.org/docs/
```
curl -sSL https://install.python-poetry.org | python3 -
```

# Config for server render
```
poetry add django-pipeline django-compressor
```
Add to settings: DJANGO_APPS
```
"django.contrib.messages",
"django.contrib.staticfiles",
"django.contrib.humanize",
"django.contrib.sitemaps",
"django.forms",
```
Add to settings: THIRD_PARTY_APPS
```
"pipeline",
"compressor",
```
Change .env variables
```
STATICFILES_STORAGE = 'pipeline.storage.PipelineStorage'
```
Add to settings if server render
```

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'pipeline.finders.PipelineFinder',
    'compressor.finders.CompressorFinder',
)

# Django pipeline
PIPELINE = {
    'EMBED_PATH': r'[/]?img/Bg.png',
    'EMBED_MAX_IMAGE_SIZE': 32700000,  # 3.2 MB
    'STYLESHEETS': {
        'css_files': {
            'source_filenames': (
                'css/styles.css',
            ),
            'output_filename': 'css/main.css',
            'variant': 'datauri',
        },
    }
}

# Django forms
FORM_RENDERER = 'django.forms.renderers.TemplatesSetting'
```

# Command Description
```
make install-dev
```
# Test 
```
make test
```

# Bumpversion
Using 
```
bumpversion patch
```
for fix bug

```
bumpversion minor
```
for release new feature

```
bumpversion major
```
for big change

Push tags to remote repository
```
git push origin --tags
```

# Run Server
Manual
```shell
make server
```
or
```shell
poetry run python3 manage.py runserver
```

# Docker

Note: set DEBUG to False if you want to use selenium
```shell
docker-compose up --build
```