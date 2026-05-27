# Alcance del MVP — logistica-api

## Objetivo

API REST de logística para gestionar el ciclo completo de envío de productos tecnológicos. Deploy en Railway como objetivo de producción.

---

## Módulos y alcance funcional

Cada módulo es una app Django con CRUD completo via `ModelViewSet` de DRF.

| Módulo      | App Django   | Endpoints base              | Notas                                      |
| ----------- | ------------ | --------------------------- | ------------------------------------------ |
| Almacenes   | `warehouses` | `/api/v1/warehouses/`       | Soft delete con `is_active`                |
| Proveedores | `suppliers`  | `/api/v1/suppliers/`        | Soft delete con `is_active`                |
| Clientes    | `customers`  | `/api/v1/customers/`        | Soft delete con `is_active`                |
| Transporte  | `transport`  | `/api/v1/transport/`        | —                                          |
| Productos   | `products`   | `/api/v1/products/`         | FK a `suppliers` y `warehouses`            |
| Rutas       | `routes`     | `/api/v1/routes/`           | Nested: `/routes/{id}/stops/`              |
| Conductores | `drivers`    | `/api/v1/drivers/`          | OneToOne con `auth_user`                   |
| Envíos      | `shipments`  | `/api/v1/shipments/`        | Nested: `/shipments/{id}/items/`           |

---

## Autenticación

- Proveedor: Django built-in (`django.contrib.auth`) + `djangorestframework-simplejwt`
- Flujo: stateless JWT
- Endpoints:
  - `POST /api/v1/auth/token/` — obtener access + refresh token
  - `POST /api/v1/auth/token/refresh/` — renovar access token
- Protección: todas las rutas requieren `Authorization: Bearer <token>` (permiso `IsAuthenticated` por defecto en DRF config)

---

## Stack completo

| Componente  | Paquete                          | Versión actual / target |
| ----------- | -------------------------------- | ----------------------- |
| Framework   | Django                           | 6.0.5                   |
| API         | djangorestframework              | 3.17.1                  |
| Auth JWT    | djangorestframework-simplejwt    | instalado               |
| CORS        | django-cors-headers              | instalado               |
| Filtros     | django-filter                    | instalado               |
| Docs API    | drf-spectacular                  | instalado               |
| DB dev      | SQLite (built-in)                | —                       |
| DB prod     | psycopg2-binary                  | 2.9.12                  |
| Env vars    | python-decouple                  | 3.8                     |
| WSGI prod   | gunicorn                         | instalado               |
| Static prod | whitenoise                       | instalado               |
| DB URL prod | dj-database-url                  | instalado               |

---

## Fases de desarrollo

El orden respeta dependencias entre apps (definido en `docs/architecture.md`).

### Fase 0 — Setup del proyecto ✓

- Split de settings: `config/settings/base.py`, `development.py`, `production.py`
- Archivo `.env` con `SECRET_KEY`, `DEBUG`, variables de DB
- Dependencias instaladas: simplejwt, cors-headers, django-filter, drf-spectacular, gunicorn, whitenoise, dj-database-url
- `INSTALLED_APPS` configurado con todos los paquetes y apps
- DRF configurado: auth JWT, permisos `IsAuthenticated`, paginación, filtros, schema
- Endpoints de auth y docs registrados en `config/urls.py`
- `whitenoise` en MIDDLEWARE para archivos estáticos
- `STATIC_ROOT` configurado

### Fase 1 — Apps sin dependencias entre sí ✓

Apps: `warehouses`, `suppliers`, `customers`, `transport`

Patrón estándar aplicado en cada app:
1. `models.py` — modelo con `db_table` explícito, `is_active`, `ordering` en Meta
2. `serializers.py` — ModelSerializer con campos explícitos
3. `views.py` — ModelViewSet con `get_queryset` filtrando `is_active=True`
4. `urls.py` — DefaultRouter
5. `admin.py` — `@admin.register` con `list_display`, `search_fields`, `list_filter`
6. Migración generada y aplicada
7. URLs incluidas en `config/urls.py`

### Fase 2 — Apps con dependencias de Fase 1 ✓

Apps: `products` (→ suppliers), `routes` (→ transport, warehouses)

Mismos pasos que Fase 1 + FK correctas con `select_related`.
`routes` incluye `RouteStop` y endpoint nested `/routes/{id}/stops/`.

### Fase 3 — Drivers ✓

App: `drivers` (→ `auth_user` OneToOne)

OneToOne con `auth_user`. Estado: `available` / `on_route` / `off_duty`.

### Fase 4 — Shipments ✓

App: `shipments` (→ customers, warehouses, routes, products)

`ShipmentProduct` como tabla intermedia. Endpoint nested `/shipments/{id}/items/`.

---

## Deploy en Railway

### Variables de entorno requeridas en producción

```
SECRET_KEY=<valor-seguro>
DEBUG=False
DATABASE_URL=postgresql://<usuario>:<password>@<host>/<db>
ALLOWED_HOSTS=<dominio-railway>
CORS_ALLOWED_ORIGINS=<frontend-url>
DJANGO_SETTINGS_MODULE=config.settings.production
```

### Checklist pre-deploy

- [ ] `DJANGO_SETTINGS_MODULE` apunta a `config.settings.production`
- [ ] `DATABASE_URL` configurada en Railway
- [ ] `python manage.py collectstatic` ejecutado
- [ ] `python manage.py migrate` ejecutado en producción
- [ ] `DEBUG=False` y `ALLOWED_HOSTS` configurados
- [ ] `SECRET_KEY` segura (no la del repo)

---

## Documentación de la API

- OpenAPI schema: `GET /api/v1/schema/`
- Swagger UI: `GET /api/v1/docs/`
- Generado automáticamente por `drf-spectacular`

---

## Criterios de aceptación del MVP

1. `python manage.py check` — sin errores ni warnings
2. `python manage.py migrate` — todas las migraciones aplicadas limpiamente
3. Obtener JWT via `POST /api/v1/auth/token/`
4. Acceder a cualquier endpoint con el token — respuesta 200
5. Acceder sin token — respuesta 401
6. Swagger UI accesible en `/api/v1/docs/`
7. Flujo end-to-end:
   - Crear warehouse → supplier → product → customer → route → driver → shipment con items
