# Django Core Project Analysis Report

**Date**: 2024-03-24  
**Project Path**: `/home/truong/project/Django Core/django-core`  
**Status**: Reusable Django Package Library

---

## Executive Summary

Django Core is a **comprehensive reusable Django package library** designed to provide enterprise-grade foundational components for Django projects. It is **not a template or scaffold** but a full-featured package that can be installed via pip/poetry into existing Django projects to augment them with production-ready utilities, patterns, and base classes.

**Key Classification**: 
- ✅ **Reusable Package Library** (installs via `pip` or poetry)
- ✅ **Architecture Framework** (provides base models, mixins, managers, serializers)
- ✅ **Enterprise Utilities** (audit tracking, soft deletes, JWT auth, data migration)
- ✅ **API Enhancement Library** (DRF mixins, custom fields, pagination, filters)
- ⚠️ **Project Scaffolding** (includes `createproject` and `createapp` commands for new Django projects)

---

## 1. What This "Core" Provides

### Purpose
Django Core provides **reusable, well-tested infrastructure components** that save time and enforce consistent patterns across multiple Django projects. It implements common enterprise requirements without forcing a specific framework structure.

### Package Philosophy
- **Add to INSTALLED_APPS**, run migrations, get enhanced functionality
- **Composable mixins** that integrate with existing models/views/serializers
- **Signal-based patterns** for audit trails and data integrity
- **DRF enhancements** for modern API development
- **Zero breaking changes** - wraps/extends existing Django functionality

---

## 2. Full Directory Structure

```
django-core/
├── core/                          # Main package
│   ├── __init__.py
│   ├── apps.py                   # App config with signal handlers
│   ├── models.py                 # MigrationData model for tracking data migrations
│   ├── config.py                 # Configuration defaults (reverse proxy, pagination, etc.)
│   ├── utils.py                  # IP detection, threading, templating utilities
│   ├── serializers.py            # DRF custom serializers (enum, filtering, bulk update)
│   ├── mixins.py                 # DRF ViewSet mixins (API, bulk operations, exports)
│   ├── views.py                  # Generic CBV mixins (list, detail, create, update, delete)
│   ├── mail.py                   # Email utilities
│   ├── signals.py                # Signal definitions
│   ├── sitemap.py                # Sitemap utilities
│   ├── decorators.py             # Custom decorators (currently empty)
│   ├── elastic_search.py         # Elasticsearch integration
│   ├── full_text_search.py       # Full-text search utilities
│   │
│   ├── db/                       # Database layer
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── fields.py         # StatusField, MonitorField, SequenceField
│   │       ├── mixins.py         # ModelMixin, StatusModel, OrderModel, soft delete
│   │       ├── managers.py       # QueryManager for dynamic status managers
│   │       ├── signals.py        # Bulk operation signals
│   │       └── utils.py          # Sequence generation
│   │
│   ├── authentication/           # JWT authentication
│   │   ├── __init__.py           # ApiJWTAuthentication, BearerAuth
│   │   └── README.md
│   │
│   ├── extra_fields/            # DRF custom fields
│   │   ├── fields.py            # Base64ImageField, Base64FileField, HybridImageField
│   │   ├── relations.py         # PresentablePrimaryKeyRelatedField, PresentableSlugRelatedField
│   │   ├── geo_fields.py        # GIS/Point fields
│   │   ├── compat.py            # Compatibility layer
│   │   ├── __init__.py          # Range fields (IntegerRange, DateRange, etc.)
│   │   └── README.md
│   │
│   ├── autoslug/                # Override django-autoslug
│   │   ├── utils.py             # Unicode-aware slug generation
│   │   ├── __init__.py
│   │   └── README.md
│   │
│   ├── pagination/              # DRF pagination
│   │   ├── limit_offset.py
│   │   ├── page_number.py
│   │   ├── cursor.py
│   │   └── elastic_search_paginator.py
│   │
│   ├── renderers/               # DRF custom renderers
│   │   └── renderers.py
│   │
│   ├── filters/                 # View-level filtering
│   │   └── views.py
│   │
│   ├── admin/                   # Django admin customizations
│   │   └── filters.py           # ArrayFieldListFilter
│   │
│   ├── validators/              # Custom validators
│   │   ├── password_validation.py  # PasswordRulesValidator (8-20 chars, mixed case)
│   │   └── unique_together.py      # CustomUniqueTogetherValidator
│   │
│   ├── middlewares/             # Django middlewares
│   │   └── query_count.py       # QueryCountDebugMiddleware (dev only)
│   │
│   ├── management/
│   │   └── commands/
│   │       ├── migrate_data.py  # Data migration loader from JSON/YAML fixtures
│   │       ├── createproject.py # Generate new Django project
│   │       └── createapp.py     # Generate new Django app
│   │
│   ├── django_filters/          # django-filter customizations
│   ├── drf_spectacular/         # drf-spectacular integration
│   ├── constants/               # Error codes and constants
│   ├── exceptions/              # Custom exceptions
│   ├── parsers/                 # DRF custom parsers (nested multipart)
│   ├── templatetags/            # Custom template filters
│   ├── reverse_search/          # URL reverse lookup utilities
│   ├── googletrans/             # Google Translate integration
│   ├── immutabledict/           # ImmutableDict data structure
│   ├── playwright/              # Browser testing utilities
│   ├── selenium/                # Selenium integration
│   │
│   ├── migrations/              # Core app migrations
│   │
│   └── conf/                    # Project templates
│       ├── project_template/    # Full Django project skeleton
│       │   ├── project_name/    # Main package
│       │   ├── users/           # Pre-built user app
│       │   ├── templates/
│       │   ├── static/
│       │   ├── nginx/           # Docker/NGINX config
│       │   ├── media/
│       │   ├── docker-compose.yml
│       │   └── README.rst
│       │
│       └── app_template/        # Django app skeleton
│           ├── api/             # DRF views/serializers
│           ├── filters/
│           ├── serializers/
│           ├── management/
│           ├── migrations/
│           ├── use_cases/       # Business logic layer
│           ├── templates/
│           └── static/
│
├── test_app/                    # Test application
├── test_settings.py             # Django test settings
├── requirements.txt
├── pyproject.toml
├── README.md
└── README.rst
```

---

## 3. Key Files Analysis

### 3.1 Core Configuration (`core/config.py`)
```python
# Runtime configuration with Django settings fallback
- BEHIND_REVERSE_PROXY: Support proxied deployments (X-Forwarded-For)
- REVERSE_PROXY_HEADER: Custom proxy header (default: HTTP_X_FORWARDED_FOR)
- MIGRATE_DATA_FOLDER: Fixture directory (default: "fixtures")
- MIGRATE_DATA_FILE_FORMAT: Supported formats (default: ["json"])
- REST_FRAMEWORK_AUTO_FILTER_FIELDS: Auto-filter serializer fields
- PAGE_QUERY_PARAM, PAGE_SIZE_QUERY_PARAM: Pagination param names
- MAX_PAGE_SIZE, VIEW_PAGE_SIZE: Pagination defaults
- CURSOR_PAGINATION_ORDERING: Default ordering field
```

### 3.2 Base Models (`core/db/models/`)

#### ModelMixin
Provides audit tracking and soft deletes on all models:
```python
class ModelMixin(models.Model):
    # Audit fields
    created_by: BigIntegerField      # User ID who created
    updated_by: BigIntegerField      # User ID who updated
    deleted_by: BigIntegerField      # User ID who deleted
    created_at: DateTimeField        # Auto-populated creation time
    updated_at: DateTimeField        # Updated timestamp (manual)
    deleted_at: DateTimeField        # Soft delete timestamp
    is_deleted: BooleanField         # Soft delete flag
    
    objects = SoftDeleteManager()    # Returns only non-deleted
    all_objects = models.Manager()   # Returns all (including deleted)
    
    def delete(self, soft=True):     # Soft delete by default
    def restore():                   # Restore soft-deleted records
```

#### StatusModel
Dynamic status-based manager system:
```python
class StatusModel(models.Model):
    status: CharField               # Status choices
    status_changed: DateTimeField   # Monitors when status changes
    
    # Generates dynamic managers for each status:
    # Example: if STATUS = (('draft', 'Draft'), ('published', 'Published'))
    # Then available: Model.draft.all(), Model.published.all()
```

#### OrderModel
Ordered, soft-deletable items with move operations:
```python
class OrderModel(ModelMixin):
    order: IntegerField = 0
    ORDER_FIELD_FILTER = []  # Fields to filter by when reordering
    
    def move(obj, new_order):       # Reorder items atomically
```

#### Custom Fields
- **StatusField**: Auto-validates against STATUS class attribute
- **MonitorField**: DateTimeField that updates when monitored field changes
- **SequenceField**: Auto-generates sequences (e.g., invoice numbers)

### 3.3 Authentication (`core/authentication/`)

#### ApiJWTAuthentication
Extends `rest_framework_simplejwt` with automatic audit tracking:

```python
class ApiJWTAuthentication(JWTAuthentication):
    def authenticate(request):
        # Standard JWT validation
        # PLUS auto-calls enforce_who_did()
        
    def enforce_who_did(request, user):
        # POST: auto-set created_by = user.id
        # PUT/PATCH: auto-set updated_by = user.id, updated_at = now()
        # DELETE: auto-set deleted_by = user.id
        
        # Via Django signals - no model changes needed
```

#### BearerAuth
Simple `requests` library authentication for Bearer tokens.

### 3.4 DRF Mixins (`core/mixins.py`)

#### APIMixin (Base)
```python
- obj_permission_classes: Per-object permission checking
- plus_permission_classes: Additional permission classes
- get_serializer_context(): Adds current_user to context
- check_object_permissions(): Custom object-level permission check
```

#### CreateModelMixin / BulkCreateModelMixin
```python
- _response_create(): Customizable response handling
- Automatic transaction.atomic() wrapping
- perform_create(): Hook for custom logic
```

#### UpdateModelMixin
```python
- Tracks diffs before/after update (DeepDiff)
- Only saves if changes detected
- Updates prefetch_related cache
```

#### ExportCSVMixin / ExportExcelMixin
```python
- _export_csv(): Pandas-based CSV export
- _export_excel(): Pandas/xlsxwriter Excel export
- Customizable column mapping
```

### 3.5 DRF Custom Fields (`core/extra_fields/`)

| Field | Purpose |
|-------|---------|
| `Base64ImageField` | Upload images as base64 strings |
| `Base64FileField` | Upload files as base64 |
| `HybridImageField` | Accepts base64 OR multipart form data |
| `PointField` | GIS Point field (latitude/longitude) |
| `IntegerRangeField` | PostgreSQL range fields |
| `DateRangeField`, `DateTimeRangeField` | Date/datetime ranges |
| `PresentablePrimaryKeyRelatedField` | Show nested serializer on read, accept ID on write |
| `PresentableSlugRelatedField` | Slug-based relation with nested serializer |
| `LowercaseEmailField` | Normalizes email to lowercase |

### 3.6 Validators (`core/validators/`)

#### PasswordRulesValidator
```python
PASSWORD_RULES = {
    'Be between 8 and 20 chars': lambda pw: 8 <= len(pw) <= 20,
    'Lowercase letter': lambda pw: re.match(r"(?=.*[a-z])", pw),
    'Uppercase letter': lambda pw: re.match(r"(?=.*[A-Z])", pw),
    'Digit': lambda pw: re.match(r"(?=.*\d)", pw),
    'No spaces': lambda pw: re.match(r"^[^ ]+$", pw),
}
```

#### CustomUniqueTogetherValidator
Enhanced `UniqueTogetherValidator` that ignores `None` values (allows multiple nulls).

### 3.7 Generic Views (`core/views.py`)

```python
class StandPaginatorListView          # CBV list with filtering/pagination
class DetailView                       # CBV detail with serializer context
class CreateView                       # CBV create with extended context
class UpdateView                       # CBV update
class DeleteView                       # CBV delete
```

### 3.8 Middlewares (`core/middlewares/`)

#### QueryCountDebugMiddleware
Logs database queries per request (dev-only, requires `LOG_QUERY_COUNT` setting).

### 3.9 Management Commands (`core/management/commands/`)

#### `migrate_data`
Loads fixture files (JSON/YAML) from app `fixtures/` directories:
```bash
python manage.py migrate_data                    # All apps
python manage.py migrate_data -a core           # Specific app
python manage.py migrate_data -d fixtures -f json yml  # Custom dir/formats
```

Fires signals (`emit_pre_migrate_data`, `emit_post_migrate_data`) for custom logic.

#### `createproject`
Scaffolds a new Django project with built-in structure:
```bash
poetry run core-admin createproject
```
Generates: settings, users app, templates, Docker setup.

#### `createapp`
Scaffolds a new Django app with DRF structure:
```bash
python manage.py createapp
```
Generates: models, serializers, viewsets, filters, templates.

### 3.10 Signal System (`core/apps.py`)

CoreConfig monkey-patches Django QuerySet methods to emit custom signals:

```python
# Pre-operation signals
- pre_bulk_create
- pre_bulk_update
- pre_query_update
- pre_list_delete

# Post-operation signals
- post_bulk_create
- post_bulk_update
- post_query_update
- post_list_delete

# Usage:
@receiver(pre_bulk_create, sender=MyModel)
def log_bulk_creates(sender, objects, **kwargs):
    print(f"Creating {len(objects)} {sender} objects")
```

### 3.11 Admin Enhancements (`core/admin/`)

#### ArrayFieldListFilter
Django admin filter for PostgreSQL `ArrayField`:
```python
# Use in ModelAdmin:
class MyModelAdmin(admin.ModelAdmin):
    list_filter = [ArrayFieldListFilter]  # Dynamically filters array values
```

### 3.12 Pagination (`core/pagination/`)

Multiple pagination strategies:
- `PageNumberPagination` (page-based)
- `LimitOffsetPagination` (offset-based)
- `CursorPagination` (cursor-based, for large datasets)
- `ElasticSearchPaginator` (Elasticsearch results)

### 3.13 AutoSlug Override (`core/autoslug/`)

Replaces `django-autoslug` default slugify with Unicode-aware version:
```python
# Settings:
AUTOSLUG_SLUGIFY_FUNCTION = 'core.autoslug.utils.slugify'

# Converts "Тестирование" → "testirovanie" (transliteration)
```

---

## 4. Features & Patterns Provided

| Feature | Component | Purpose |
|---------|-----------|---------|
| **Soft Deletes** | `ModelMixin` | Archive records without hard deletion |
| **Audit Trails** | `ModelMixin` + `ApiJWTAuthentication` | Track who created/updated/deleted |
| **Status Workflows** | `StatusModel` | Dynamic status managers + monitors |
| **Ordered Items** | `OrderModel` | Reorderable model with move() |
| **JWT Auth** | `ApiJWTAuthentication` | Simplejwt + auto audit tracking |
| **Bulk Operations** | App signals | Monitor bulk_create, bulk_update, delete |
| **Data Migrations** | `migrate_data` command | Load fixtures with diff-checking |
| **DRF Enhancements** | `APIMixin`, custom fields | Professional REST APIs |
| **Export** | `ExportCSVMixin`, `ExportExcelMixin` | Pandas-based CSV/Excel exports |
| **Advanced Fields** | `Base64ImageField`, `PointField`, ranges | Modern serializer fields |
| **GIS Support** | `PointField` | GeoDjango point/polygon fields |
| **Filtering** | DRF filters integration | Advanced queryset filtering |
| **Query Debugging** | `QueryCountDebugMiddleware` | Development query profiling |
| **Project Scaffolding** | `createproject`, `createapp` | Bootstrap new projects |

---

## 5. How to Use / Integrate

### Step 1: Installation
```python
# pyproject.toml
[dependencies]
django = "~4.2"
core = { git = "https://...django-core.git", branch = "main" }

# or pip
pip install git+https://...django-core.git
```

### Step 2: Configure Django
```python
# settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    # ...
    'core',  # ADD THIS
    'rest_framework',
    'django_filters',
]

# Optionally configure:
BEHIND_REVERSE_PROXY = True
REVERSE_PROXY_HEADER = 'HTTP_X_FORWARDED_FOR'
LOG_QUERY_COUNT = True  # Debug only
MIGRATE_DATA_FOLDER = 'fixtures'
```

### Step 3: Run Migrations
```bash
python manage.py migrate core
```

### Step 4: Use Base Classes in Your Models
```python
from core.db.models import ModelMixin, StatusModel, OrderModel

class Article(ModelMixin):
    title = CharField(max_length=255)
    # Auto-gets: created_by, updated_by, deleted_by, created_at, updated_at, is_deleted
    # Auto-gets: objects (soft-delete manager), all_objects

    class Meta:
        abstract = False

class BlogPost(StatusModel):
    STATUS = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    title = CharField(max_length=255)
    status = inherited from StatusModel
    
    # Usage: BlogPost.draft.all(), BlogPost.published.all()
```

### Step 5: Use DRF Mixins
```python
from core.mixins import APIMixin, BulkCreateModelMixin
from rest_framework import viewsets

class ArticleViewSet(APIMixin, BulkCreateModelMixin, viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    obj_permission_classes = [IsOwner]
    
    def get_serializer_context(self, **kwargs):
        # Already adds 'current_user' from parent
        return super().get_serializer_context(**kwargs)
```

### Step 6: Use JWT Authentication
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.ApiJWTAuthentication',  # Auto-audit trails
    ],
}

# Then any POST/PUT/PATCH/DELETE automatically sets created_by, updated_by, etc.
```

### Step 7: Custom Validators
```python
from core.validators import PasswordRulesValidator

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'core.validators.PasswordRulesValidator'},
]
```

### Step 8: Load Data Fixtures
```python
# fixtures/article_categories.json
[
    {"id": 1, "name": "Tech"},
    {"id": 2, "name": "Design"}
]

# Signal handler in your app:
from core.db.models.signals import emit_pre_migrate_data
from django.dispatch import receiver

@receiver(emit_pre_migrate_data, sender=apps.get_app_config('articles'))
def handle_migrate_master_data(sender, files, **kwargs):
    data = files.get('article_categories.json', {})
    if data:
        # Custom loading logic
        pass
```

---

## 6. Dependencies

```txt
Django >= 4.0
djangorestframework >= 3.14
django-filter >= 23
django-autoslug >= 1.9
flake8-django >= 1.4
requests
python-decouple >= 3.8
filetype >= 1.2.0
unidecode >= 1.3
httpx >= 0.25
bumpversion >= 0.6
deepdiff >= 6.7
django-sequences >= 3.0
```

**Optional**:
- `djangorestframework-simplejwt` (for JWT auth)
- `pandas` (for Excel/CSV export)
- `elasticsearch` (for ES integration)
- `playwright` / `selenium` (for testing)
- `drf-spectacular` (for API documentation)

---

## 7. Configuration Patterns

### Environment-Aware Configuration
```python
# core/config.py uses Django settings with fallbacks
BEHIND_REVERSE_PROXY = getattr(settings, 'BEHIND_REVERSE_PROXY', False)
REST_FRAMEWORK_AUTO_FILTER_FIELDS = getattr(settings, 'REST_FRAMEWORK_AUTO_FILTER_FIELDS', None)
```

### Signal-Based Patterns
```python
# Define custom logic in your app's models.py
@receiver(emit_pre_migrate_data, sender=apps.get_app_config('myapp'))
def my_data_handler(sender, files, **kwargs):
    pass

@receiver(pre_bulk_create, sender=MyModel)
def log_bulk_creates(sender, objects, **kwargs):
    pass
```

### Per-Request Context
```python
# Serializers get current_user automatically:
class MySerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        user = self.context['current_user']
        # Use user for audit tracking
        return super().create(validated_data)
```

---

## 8. Project Templates Included

### Project Template (`core/conf/project_template/`)
Complete Django project scaffold with:
- Pre-configured settings (base, dev, prod)
- Built-in `users` app with profile support
- Docker/Docker-Compose setup
- NGINX reverse proxy configuration
- Static/media directories
- HTML templates with Django form error handling

### App Template (`core/conf/app_template/`)
Standard Django app structure with:
- `api/` (DRF viewsets/routers)
- `filters/` (custom filters)
- `serializers/` (DRF serializers)
- `management/commands/`
- `use_cases/` (business logic layer)
- `migrations/`
- Templates and static files

---

## 9. Advanced Features

### Bulk Operation Signals
```python
# CoreConfig monkey-patches QuerySet to emit signals:
# - pre_bulk_create / post_bulk_create
# - pre_bulk_update / post_bulk_update  
# - pre_query_update / post_query_update
# - pre_list_delete / post_list_delete

# Skip signals if needed:
Article.objects.bulk_create(articles, skip_signal=True)
```

### DeepDiff Tracking
```python
# UpdateModelMixin compares before/after using DeepDiff
# Only saves if changes detected (update method shows diff)
```

### Nested Multipart Parser
```python
# Parser for complex nested multipart form data
# Use in DRF views for advanced form handling
```

### Elasticsearch Integration
```python
# core/elastic_search.py for ES queries and aggregations
# ElasticSearchPaginator for ES result pagination
```

---

## 10. Unresolved Questions

1. **Version Control**: How is this package versioned and released to GitLab? (no setup.py found, relies on Poetry)
2. **Testing**: Where are unit tests? (test_app exists but testing patterns unclear)
3. **Documentation**: More examples for django_filters, drf_spectacular customizations?
4. **Backwards Compatibility**: How are breaking changes communicated to downstream projects?
5. **Maintenance**: Is there a roadmap or active development roadmap?
6. **Rate Limiting**: No built-in rate limiting or throttling seen - relying on DRF defaults?
7. **Caching**: No cache layer seen - how does this integrate with Redis/Memcached?
8. **Permissions**: Base permission classes beyond object-level checks?
9. **Database Support**: Tested on PostgreSQL only, or MySQL/SQLite too?
10. **Internationalization**: Template tags, translation strings - how comprehensive is i18n support?

---

## Summary Table

| Aspect | Status |
|--------|--------|
| **Type** | Reusable Python package (installable) |
| **Framework** | Django 4.0+ with DRF 3.14+ |
| **Database** | Django ORM (any backend) + PostgreSQL-specific features |
| **API** | REST (Django REST Framework) |
| **Authentication** | JWT (via simplejwt) with audit trails |
| **Audit Trail** | Automatic via signals (created_by, updated_by, deleted_by) |
| **Soft Deletes** | Built-in with is_deleted flag |
| **Data Migrations** | Fixture-based with signal handlers |
| **Project Scaffolding** | Included (createproject, createapp commands) |
| **Field Types** | 50+ custom DRF fields (base64, ranges, GIS, etc.) |
| **Admin** | Custom filters (ArrayFieldListFilter) |
| **Export** | CSV/Excel via Pandas |
| **Search** | Full-text + Elasticsearch support |
| **Testing** | Playwright/Selenium integration |
| **Maturity** | Production-ready (enterprise patterns) |

---

## Key Takeaways

1. **Not a boilerplate** - it's a **library you import**
2. **Minimal footprint** - add to INSTALLED_APPS, run migrations, extend from provided base classes
3. **Signal-driven** - non-invasive pattern for audit trails and monitoring
4. **DRF-first** - heavy investment in modern API patterns
5. **Enterprise features** - soft deletes, audit trails, status workflows, ordered items
6. **Extensible** - all mixins/fields are meant to be subclassed
7. **Zero magic** - uses Django signals and standard patterns, not metaclasses or bytecode manipulation
8. **Project templates** - includes scaffolds but not required; can use package alone
