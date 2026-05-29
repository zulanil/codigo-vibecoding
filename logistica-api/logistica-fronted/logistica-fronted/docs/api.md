# API Reference — Logística Backend

## Base URL

```
http://localhost:8000/api/v1
```

Variable de entorno: `API_BASE_URL` (server-side) / `NEXT_PUBLIC_API_BASE_URL` (client-side).

Swagger UI: `http://localhost:8000/api/v1/docs/`

---

## Autenticación

### Obtener tokens

```
POST /auth/token/
```

Body:
```json
{ "username": "string", "password": "string" }
```

Response:
```json
{ "access": "<jwt>", "refresh": "<jwt>" }
```

### Renovar access token

```
POST /auth/token/refresh/
```

Body: `{ "refresh": "<refresh_token>" }`
Response: `{ "access": "<new_access_token>" }`

### Verificar token

```
POST /auth/token/verify/
```

Body: `{ "token": "<token>" }`
Response: `{}` (200 si válido, 401 si no)

### Header requerido en endpoints protegidos

```
Authorization: Bearer <access_token>
```

Todos los endpoints de recursos requieren este header. Los endpoints `/auth/token/*` son públicos.

---

## Patrones comunes (aplican a los 8 módulos)

| Operación | Método | Ruta |
|-----------|--------|------|
| Listar | GET | `/<resource>/` |
| Crear | POST | `/<resource>/` |
| Detalle | GET | `/<resource>/{id}/` |
| Actualizar (total) | PUT | `/<resource>/{id}/` |
| Actualizar (parcial) | PATCH | `/<resource>/{id}/` |
| Eliminar (soft) | DELETE | `/<resource>/{id}/` |

### Paginación

Todas las listas devuelven:

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/suppliers/?page=2",
  "previous": null,
  "results": [...]
}
```

- 20 items por página
- Query param: `?page=N`

### Filtros, búsqueda y ordenamiento

- Filtrar por campo: `?field=value` (ej. `?status=pending`)
- Buscar texto: `?search=term`
- Ordenar: `?ordering=field` o `?ordering=-field` (descendente)

### Errores

| Status | Shape |
|--------|-------|
| 400 Validación | `{ "field_name": ["error msg"], "non_field_errors": ["..."] }` |
| 401 No autenticado | `{ "detail": "..." }` |
| 403 Sin permiso | `{ "detail": "..." }` |
| 404 No encontrado | `{ "detail": "..." }` |

### Nota sobre campos decimales

DRF serializa `DecimalField` como **string**, no número.
Ejemplo: `"unit_price": "99.99"` — usar `parseFloat()` solo cuando se necesite aritmética.

---

## Módulos

### Suppliers

Base: `/suppliers/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `name` | string | |
| `contact_name` | string | |
| `email` | string | único |
| `phone` | string | |
| `address` | string | |
| `is_active` | boolean | soft delete, default true |
| `created_at` | string | ISO 8601, read-only |
| `updated_at` | string | ISO 8601, read-only |

Filtros disponibles: `?search=` (name, email, contact_name) · `?ordering=` (name, created_at)

---

### Warehouses

Base: `/warehouses/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `name` | string | |
| `address` | string | |
| `city` | string | |
| `country` | string | |
| `capacity_kg` | string | decimal como string |
| `is_active` | boolean | |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

Filtros: `?city=` · `?country=` · `?search=` (name, city, country) · `?ordering=` (name, city, created_at)

---

### Customers

Base: `/customers/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `user` | number \| null | FK a auth_user |
| `name` | string | |
| `company_name` | string | nullable |
| `customer_type` | `'individual' \| 'company'` | |
| `email` | string | único |
| `phone` | string | |
| `address` | string | |
| `is_active` | boolean | |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

Filtros: `?customer_type=` · `?search=` (name, email, company_name) · `?ordering=` (name, created_at)

---

### Products

Base: `/products/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `supplier` | number | FK id de Supplier |
| `name` | string | |
| `sku` | string | único |
| `description` | string | nullable |
| `weight_kg` | string | decimal como string |
| `length_cm` | string | decimal como string |
| `width_cm` | string | decimal como string |
| `height_cm` | string | decimal como string |
| `unit_price` | string | decimal como string |
| `is_active` | boolean | |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

Filtros: `?supplier=<id>` · `?search=` (name, sku, description) · `?ordering=` (name, sku, unit_price, created_at)

---

### Drivers

Base: `/drivers/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `user` | number | OneToOne FK a auth_user (requerido) |
| `license_number` | string | único |
| `phone` | string | |
| `status` | `'available' \| 'on_route' \| 'off_duty'` | default: available |
| `is_active` | boolean | |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

Filtros: `?status=` · `?search=` (user__first_name, user__last_name, license_number) · `?ordering=` (status, created_at)

---

### Transport

Base: `/transports/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `driver` | number \| null | FK nullable |
| `plate_number` | string | único |
| `vehicle_type` | `'truck' \| 'van' \| 'motorcycle'` | |
| `capacity_kg` | string | decimal como string |
| `status` | `'available' \| 'in_use' \| 'maintenance'` | default: available |
| `is_active` | boolean | |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

Filtros: `?vehicle_type=` · `?status=` · `?driver=<id>` · `?search=` (plate_number) · `?ordering=` (plate_number, vehicle_type, status)

---

### Routes

Base: `/routes/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `transport` | number | FK a Transport |
| `origin_warehouse` | number | FK a Warehouse |
| `name` | string | |
| `status` | `'planned' \| 'in_progress' \| 'completed' \| 'cancelled'` | default: planned |
| `scheduled_date` | string | date (YYYY-MM-DD) |
| `stops` | RouteStop[] | read-only, nested |
| `is_active` | boolean | |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

Filtros: `?status=` · `?transport=<id>` · `?origin_warehouse=<id>` · `?search=` (name) · `?ordering=` (scheduled_date, status, created_at)

#### Nested: Paradas de ruta

```
GET  /routes/{id}/stops/   → lista paradas de esa ruta
POST /routes/{id}/stops/   → crear nueva parada
```

Campos de RouteStop:

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `stop_order` | number | positivo, único por ruta |
| `address` | string | |
| `city` | string | |
| `estimated_arrival` | string \| null | ISO 8601 datetime |
| `actual_arrival` | string \| null | ISO 8601 datetime |

Las paradas NO se escriben dentro del payload de Route. Se crean/listan via `/routes/{id}/stops/` separado.

---

### Shipments

Base: `/shipments/`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `tracking_number` | string | único, generado por el servidor |
| `customer` | number | FK a Customer |
| `origin_warehouse` | number | FK a Warehouse |
| `route` | number \| null | FK nullable a Route |
| `status` | `'pending' \| 'assigned' \| 'in_transit' \| 'delivered' \| 'cancelled'` | default: pending |
| `origin_address` | string | |
| `destination_address` | string | |
| `scheduled_delivery_date` | string \| null | date (YYYY-MM-DD) |
| `actual_delivery_date` | string \| null | date (YYYY-MM-DD) |
| `weight_kg` | string | decimal como string |
| `declared_value` | string | decimal como string |
| `shipping_cost` | string | decimal como string |
| `notes` | string | nullable |
| `shipment_products` | ShipmentProduct[] | read-only, nested |
| `is_active` | boolean | |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

Filtros: `?status=` · `?customer=<id>` · `?origin_warehouse=<id>` · `?route=<id>` · `?search=` (tracking_number, destination_address) · `?ordering=` (status, scheduled_delivery_date, created_at)

#### Nested: Productos del envío

```
GET  /shipments/{id}/items/   → lista productos de ese envío
POST /shipments/{id}/items/   → agregar producto al envío
```

Campos de ShipmentProduct:

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `product` | number | FK a Product |
| `quantity` | number | entero positivo |
| `unit_price` | string | decimal, snapshot del precio al crear el envío |

Los productos del envío NO se escriben dentro del payload de Shipment. Se crean/listan via `/shipments/{id}/items/` separado.
