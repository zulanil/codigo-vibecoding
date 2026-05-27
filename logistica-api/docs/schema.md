# Schema de Base de Datos — Logística API

## Tablas de Django (reutilizadas)

Django provee tablas listas para usar. El proyecto las extiende con relaciones, no las duplica.

| Tabla Django | Uso en este proyecto |
|---|---|
| `auth_user` | Base para `Customer` y `Driver` (acceso al sistema) |
| `auth_group` | Roles: `customer`, `driver`, `admin` |
| `auth_permission` | Permisos granulares por endpoint |
| `django_content_type` | Usado por permisos y admin (automático) |
| `django_session` | Sesiones (automático) |
| `django_admin_log` | Auditoría del admin (automático) |

---

## Tablas del proyecto

### `suppliers`
Empresas que venden los productos tecnológicos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `name` | varchar(200) | NOT NULL | Razón social |
| `contact_name` | varchar(200) | NOT NULL | Persona de contacto |
| `email` | varchar(254) | NOT NULL, unique | — |
| `phone` | varchar(30) | NOT NULL | — |
| `address` | text | NOT NULL | Dirección completa |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `warehouses`
Puntos de almacenamiento y despacho de productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `name` | varchar(200) | NOT NULL | Nombre del almacén |
| `address` | text | NOT NULL | Dirección completa |
| `city` | varchar(100) | NOT NULL | — |
| `country` | varchar(100) | NOT NULL | — |
| `capacity_kg` | decimal(10,2) | NOT NULL | Capacidad máxima en kilogramos |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `customers`
Empresas o personas que generan envíos. Pueden tener acceso al portal.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `user_id` | integer | FK → `auth_user`, nullable, unique | Cuenta de acceso al portal (opcional) |
| `name` | varchar(200) | NOT NULL | Nombre completo o razón social |
| `company_name` | varchar(200) | nullable | Nombre de empresa (si aplica) |
| `customer_type` | varchar(20) | NOT NULL | `individual` / `company` |
| `email` | varchar(254) | NOT NULL, unique | Email principal de contacto |
| `phone` | varchar(30) | NOT NULL | — |
| `address` | text | NOT NULL | Dirección de facturación |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

**Relaciones:**
- `user_id` → `auth_user.id` (nullable — cliente sin portal no tiene usuario)

---

### `products`
Productos tecnológicos gestionados en el sistema.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `supplier_id` | integer | FK → `suppliers`, NOT NULL | Proveedor del producto |
| `name` | varchar(200) | NOT NULL | Nombre del producto |
| `sku` | varchar(100) | NOT NULL, unique | Código de referencia único |
| `description` | text | nullable | Descripción detallada |
| `weight_kg` | decimal(8,3) | NOT NULL | Peso en kilogramos |
| `length_cm` | decimal(8,2) | NOT NULL | Largo en centímetros |
| `width_cm` | decimal(8,2) | NOT NULL | Ancho en centímetros |
| `height_cm` | decimal(8,2) | NOT NULL | Alto en centímetros |
| `unit_price` | decimal(12,2) | NOT NULL | Precio unitario de compra |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

**Relaciones:**
- `supplier_id` → `suppliers.id`

---

### `drivers`
Conductores asignados a transportes. Siempre tienen cuenta en el sistema.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `user_id` | integer | FK → `auth_user`, NOT NULL, unique | Cuenta del conductor |
| `license_number` | varchar(50) | NOT NULL, unique | Número de licencia de conducir |
| `phone` | varchar(30) | NOT NULL | Teléfono de contacto |
| `status` | varchar(20) | NOT NULL | `available` / `on_route` / `off_duty` |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

**Relaciones:**
- `user_id` → `auth_user.id` (nombre, email y contraseña viven en `auth_user`)

---

### `transports`
Vehículos disponibles para realizar entregas.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `driver_id` | integer | FK → `drivers`, nullable | Conductor asignado actualmente |
| `plate_number` | varchar(20) | NOT NULL, unique | Placa del vehículo |
| `vehicle_type` | varchar(30) | NOT NULL | `truck` / `van` / `motorcycle` |
| `capacity_kg` | decimal(10,2) | NOT NULL | Capacidad de carga en kilogramos |
| `status` | varchar(20) | NOT NULL | `available` / `in_use` / `maintenance` |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

**Relaciones:**
- `driver_id` → `drivers.id` (nullable — transporte puede estar sin conductor asignado)

---

### `routes`
Rutas planificadas con origen en un almacén y múltiples paradas.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `transport_id` | integer | FK → `transports`, NOT NULL | Transporte asignado |
| `origin_warehouse_id` | integer | FK → `warehouses`, NOT NULL | Almacén de salida |
| `name` | varchar(200) | NOT NULL | Nombre o código de ruta |
| `status` | varchar(20) | NOT NULL | `planned` / `in_progress` / `completed` / `cancelled` |
| `scheduled_date` | date | NOT NULL | Fecha programada de inicio |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

**Relaciones:**
- `transport_id` → `transports.id`
- `origin_warehouse_id` → `warehouses.id`

---

### `route_stops`
Paradas ordenadas de una ruta. Una ruta tiene una o más paradas.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `route_id` | integer | FK → `routes`, NOT NULL | Ruta a la que pertenece |
| `stop_order` | integer | NOT NULL | Orden de la parada (1, 2, 3…) |
| `address` | text | NOT NULL | Dirección de entrega |
| `city` | varchar(100) | NOT NULL | — |
| `estimated_arrival` | datetime | NOT NULL | Hora estimada de llegada |
| `actual_arrival` | datetime | nullable | Hora real de llegada |

**Relaciones:**
- `route_id` → `routes.id`
- Restricción unique: `(route_id, stop_order)` — no pueden repetirse paradas en la misma ruta

---

### `shipments`
Unidad central de negocio. Representa un envío de un cliente desde un almacén hacia un destino.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `tracking_number` | varchar(50) | NOT NULL, unique | Código de seguimiento |
| `customer_id` | integer | FK → `customers`, NOT NULL | Cliente que genera el envío |
| `origin_warehouse_id` | integer | FK → `warehouses`, NOT NULL | Almacén de origen |
| `route_id` | integer | FK → `routes`, nullable | Ruta asignada (puede no estar asignada aún) |
| `status` | varchar(20) | NOT NULL | `pending` / `assigned` / `in_transit` / `delivered` / `cancelled` |
| `origin_address` | text | NOT NULL | Dirección de recogida |
| `destination_address` | text | NOT NULL | Dirección de entrega final |
| `scheduled_delivery_date` | date | NOT NULL | Fecha pactada de entrega |
| `actual_delivery_date` | date | nullable | Fecha real de entrega |
| `weight_kg` | decimal(10,3) | NOT NULL | Peso total del envío |
| `declared_value` | decimal(12,2) | NOT NULL | Valor declarado de la mercancía |
| `shipping_cost` | decimal(12,2) | NOT NULL | Costo calculado del envío |
| `notes` | text | nullable | Observaciones adicionales |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

**Relaciones:**
- `customer_id` → `customers.id`
- `origin_warehouse_id` → `warehouses.id`
- `route_id` → `routes.id` (nullable — envío pendiente de asignación)

---

### `shipment_products`
Tabla intermedia entre `shipments` y `products`. Registra qué productos van en cada envío y a qué precio.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | — |
| `shipment_id` | integer | FK → `shipments`, NOT NULL | — |
| `product_id` | integer | FK → `products`, NOT NULL | — |
| `quantity` | integer | NOT NULL | Unidades del producto en el envío |
| `unit_price` | decimal(12,2) | NOT NULL | Precio al momento del envío (snapshot) |

**Relaciones:**
- `shipment_id` → `shipments.id`
- `product_id` → `products.id`
- Restricción unique: `(shipment_id, product_id)`

---

## Diagrama de relaciones

```
auth_user
    │
    ├──(1:1)──► customers ──(1:N)──► shipments ◄──(N:1)── warehouses
    │                                    │
    └──(1:1)──► drivers                  ├──(N:M, via shipment_products)──► products
                    │                    │                                       │
                    ▼                    └──(N:1)──► routes                      │
               transports                               │                   suppliers
                                                        ├──(N:1)──► transports
                                                        ├──(N:1)──► warehouses (origin)
                                                        └──(1:N)──► route_stops
```

## Resumen de apps Django y sus modelos

| App | Modelos |
|---|---|
| `customers` | `Customer` |
| `suppliers` | `Supplier` |
| `warehouses` | `Warehouse` |
| `products` | `Product` |
| `drivers` | `Driver` |
| `transport` | `Transport` |
| `routes` | `Route`, `RouteStop` |
| `shipments` | `Shipment`, `ShipmentProduct` |
