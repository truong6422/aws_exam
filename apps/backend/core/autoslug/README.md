Django AutoSlug
================
Override django-autoslug library

Convert non-latin languages to latin then using as slug

Add to django settings file
```python
AUTOSLUG_SLUGIFY_FUNCTION = 'core.autoslug.utils.slugify'
```
