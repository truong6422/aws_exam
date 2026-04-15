JWTAuthentication
================
Override djangorestframework-simplejwt library
Add signal auto add created_by, updated_by, deleted_by

```python
poetry add djangorestframework-simplejwt
```
```python
'DEFAULT_AUTHENTICATION_CLASSES': [
    'core.authentication.ApiJWTAuthentication',
],
```
