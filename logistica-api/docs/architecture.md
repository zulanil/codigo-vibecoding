# Arquitectura de Desarrollo — Logística API MVP

## Stack técnico

| Componente           | Tecnología                    | Versión |
| -------------------- | ----------------------------- | ------- |
| Runtime              | Python                        | 3.14    |
| Framework web        | Django                        | 6.0.5   |
| API REST             | Django REST Framework         | 3.17.1  |
| Autenticación        | djangorestframework-simplejwt | 5.5.1   |
| Documentación API    | drf-spectacular               | 0.29.0  |
| Filtrado             | django-filter                 | 25.2    |
| CORS                 | django-cors-headers           | 4.9.0   |
| Variables de entorno | python-decouple               | 3.8     |
| BD desarrollo        | SQLite                        | —       |
| BD producción        | PostgreSQL                    | —       |

---

## Estructura de carpetas

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py          ← settings comunes a todos los entornos
│   │   ├── development.py   ← SQLite, DEBUG=True
│   │   └── production.py    ← PostgreSQL, DEBUG=False
│   ├── urls.py              ← URL raíz del proyecto
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/                    ← todas las apps de dominio
│   ├── customers/
│   ├── warehouses/
│   ├── suppliers/
│   ├── products/
│   ├── transport/
│   ├── drivers/
│   ├── routes/
│   └── shipments/
│
├── docs/
│   ├── schema.md            ← referencia del schema de BD
│   └── architecture.md      ← este archivo
│
├── requirements/
│   ├── base.txt             ← dependencias comunes
│   ├── development.txt      ← dependencias de desarrollo
│   └── production.txt       ← dependencias de producción
│
├── .env                     ← variables de entorno (nunca commitear)
├── .env.example             ← plantilla de variables (sí commitear)
└── manage.py
```

---

## Estructura interna de cada app

Todas las apps de dominio siguen el mismo patrón:

```
apps/<nombre>/
├── __init__.py
├── apps.py
├── admin.py          ← registro en Django Admin
├── models.py         ← modelo Django (según docs/schema.md)
├── serializers.py    ← serializers DRF
├── views.py          ← ViewSets DRF
├── urls.py           ← router local de la app
├── migrations/
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_views.py
```

---

## Configuración DRF (`settings/base.py`)

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

---

## Endpoints — `/api/v1/`

| Módulo            | Endpoint                          | Métodos                 |
| ----------------- | --------------------------------- | ----------------------- |
| Auth              | `/api/v1/auth/token/`             | POST                    |
| Auth              | `/api/v1/auth/token/refresh/`     | POST                    |
| Auth              | `/api/v1/auth/token/verify/`      | POST                    |
| Clientes          | `/api/v1/customers/`              | GET, POST               |
| Clientes          | `/api/v1/customers/{id}/`         | GET, PUT, PATCH, DELETE |
| Almacenes         | `/api/v1/warehouses/`             | GET, POST               |
| Almacenes         | `/api/v1/warehouses/{id}/`        | GET, PUT, PATCH, DELETE |
| Proveedores       | `/api/v1/suppliers/`              | GET, POST               |
| Proveedores       | `/api/v1/suppliers/{id}/`         | GET, PUT, PATCH, DELETE |
| Productos         | `/api/v1/products/`               | GET, POST               |
| Productos         | `/api/v1/products/{id}/`          | GET, PUT, PATCH, DELETE |
| Transporte        | `/api/v1/transports/`             | GET, POST               |
| Transporte        | `/api/v1/transports/{id}/`        | GET, PUT, PATCH, DELETE |
| Conductores       | `/api/v1/drivers/`                | GET, POST               |
| Conductores       | `/api/v1/drivers/{id}/`           | GET, PUT, PATCH, DELETE |
| Rutas             | `/api/v1/routes/`                 | GET, POST               |
| Rutas             | `/api/v1/routes/{id}/`            | GET, PUT, PATCH, DELETE |
| Paradas de ruta   | `/api/v1/routes/{id}/stops/`      | GET, POST               |
| Envíos            | `/api/v1/shipments/`              | GET, POST               |
| Envíos            | `/api/v1/shipments/{id}/`         | GET, PUT, PATCH, DELETE |
| Ítems de envío    | `/api/v1/shipments/{id}/items/`   | GET, POST               |
| Docs (OpenAPI)    | `/api/v1/schema/`                 | GET                     |
| Docs (Swagger UI) | `/api/v1/docs/`                   | GET                     |

---

## Principios de implementación

### ViewSets
- Solo CRUD estándar via `ModelViewSet`
- Filtrar queryset por `is_active=True` siempre
- `get_queryset()` para filtrar por usuario según rol
- Sin lógica de negocio — solo orchestration

### Serializers
- Campos explícitos siempre (no `fields = '__all__'`)
- Validaciones cross-field en `validate()`
- Reglas de negocio simples en `validate_<field>()`

### Models
- Constantes de choices como atributos de clase
- `is_active = BooleanField(default=True)` para soft delete
- `db_table` explícito en `Meta` — coincide con `docs/schema.md`
- `__str__` siempre definido

### Querysets
- `select_related` para FK directas
- `prefetch_related` para M2M y FK inversas
- `ordering` siempre definido

---

## Entornos

| Variable | Desarrollo | Producción |
|---|---|---|
| `DEBUG` | `True` | `False` |
| DB | SQLite | PostgreSQL (Neon) |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | dominio real |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | dominio frontend |

---

## Decisiones de diseño

| Decisión | Elección | Razón |
| --- | --- | --- |
| Autenticación | JWT (simplejwt) | Stateless, estándar DRF, compatible con cualquier frontend |
| Docs API | drf-spectacular | Auto-generado desde código, cero mantenimiento manual |
| Settings | base / dev / prod | Separación limpia de entornos desde el inicio |
| Soft delete | `is_active=False` | Evita pérdida de datos; ViewSets filtran `is_active=True` por defecto |
| Recursos anidados | `@action` decorator | Refleja relación de pertenencia sin agregar dependencias extra |
| Nombre de tablas | `db_table` explícito | Coincide exactamente con el schema documentado |

---

## Flujo de desarrollo para nueva feature

1. Actualizar `docs/schema.md` si hay cambios en modelos
2. Crear/modificar model → `makemigrations`
3. Crear/modificar serializer
4. Crear/modificar ViewSet (aplicar filtros y permisos)
5. Registrar en `urls.py` de la app
6. Escribir tests en `tests/test_models.py` y `tests/test_views.py`
7. Verificar con `python manage.py check`
