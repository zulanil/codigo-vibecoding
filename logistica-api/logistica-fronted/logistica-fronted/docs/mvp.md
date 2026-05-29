# MVP — Logística Frontend

Orden de construcción de módulos. Cada módulo se desarrolla con el flujo SDD completo:
`@orchestrator <módulo>` → spec → (aprobación humana) → implement → validator.

**Regla:** un módulo a la vez. No iniciar el siguiente sin que el anterior esté validado.

---

## Orden de módulos

| # | Módulo | Tipo | Depende de |
|---|--------|------|-----------|
| 1 | [Auth](#1-auth) | Login + JWT + rutas protegidas | — |
| 2 | [Suppliers](#2-suppliers) | CRUD | — |
| 3 | [Warehouses](#3-warehouses) | CRUD | — |
| 4 | [Customers](#4-customers) | CRUD | — |
| 5 | [Products](#5-products) | CRUD | Suppliers |
| 6 | [Drivers](#6-drivers) | CRUD | — |
| 7 | [Transport](#7-transport) | CRUD | Drivers |
| 8 | [Routes](#8-routes) | CRUD + nested stops | Transport, Warehouses |
| 9 | [Shipments](#9-shipments) | CRUD + nested items | Customers, Warehouses, Routes, Products |

---

## 1. Auth

**Tipo:** Autenticación — no es CRUD.

### Pantallas
- `/login` — formulario de login

### Operaciones
- POST `/api/v1/auth/token/` con `{username, password}` → guarda `access` + `refresh` en httpOnly cookies
- POST `/api/v1/auth/token/refresh/` → renueva `access` token silenciosamente
- Logout → limpia cookies
- Middleware Next.js → redirige rutas protegidas a `/login` si no hay token válido

### Formulario Login
| Campo | Tipo | Validación |
|-------|------|-----------|
| username | text | requerido |
| password | password | requerido |

### Zustand Auth Store
- `user` (datos básicos del usuario si se expone endpoint)
- `isAuthenticated` (boolean derivado de la presencia del token)
- `logout()` — limpia cookies + redirect

### Criterios de completitud
- [ ] Formulario de login funcional con manejo de errores 401
- [ ] Token almacenado en httpOnly cookie via Route Handler
- [ ] Refresh automático cuando access token expira
- [ ] Middleware protege todas las rutas `/(dashboard)/**`
- [ ] Redirect a `/login` si no autenticado, redirect a `/dashboard` si ya logueado
- [ ] Botón de logout en el layout del dashboard

---

## 2. Suppliers

**Tipo:** CRUD estándar. Sin dependencias de otros módulos.

### Pantallas
- `/suppliers` — listado con tabla
- `/suppliers/new` — formulario de creación
- `/suppliers/[id]` — detalle + edición inline

### Operaciones
- Listar con paginación (20/página)
- Buscar por nombre, email, contact_name
- Ordenar por nombre, created_at
- Crear
- Editar
- Eliminar (soft delete — desaparece de la lista)

### Tabla (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| Nombre | name | sí |
| Contacto | contact_name | no |
| Email | email | no |
| Teléfono | phone | no |
| Acciones | — | no |

### Formulario
| Campo | Tipo | Validación |
|-------|------|-----------|
| name | text | requerido |
| contact_name | text | requerido |
| email | email | requerido, único |
| phone | text | requerido |
| address | textarea | requerido |

### Criterios de completitud
- [ ] Tabla con paginación, búsqueda y ordenamiento
- [ ] Crear supplier con validación de campos
- [ ] Editar supplier existente
- [ ] Eliminar con modal de confirmación
- [ ] Manejo de errores DRF en formulario (email duplicado, etc.)
- [ ] Estados de carga (skeleton o spinner)
- [ ] Toast de éxito/error en operaciones

---

## 3. Warehouses

**Tipo:** CRUD estándar. Sin dependencias.

### Pantallas
- `/warehouses` — listado con tabla
- `/warehouses/new` — formulario de creación
- `/warehouses/[id]` — detalle + edición

### Operaciones
- Listar con paginación
- Filtrar por city, country
- Buscar por nombre, ciudad, país
- Ordenar por nombre, ciudad, created_at
- Crear, Editar, Eliminar (soft delete)

### Tabla (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| Nombre | name | sí |
| Ciudad | city | sí |
| País | country | no |
| Capacidad (kg) | capacity_kg | no |
| Acciones | — | no |

### Formulario
| Campo | Tipo | Validación |
|-------|------|-----------|
| name | text | requerido |
| address | textarea | requerido |
| city | text | requerido |
| country | text | requerido |
| capacity_kg | number | requerido, > 0 |

### Criterios de completitud
- [ ] Tabla con paginación, filtro por city/country, búsqueda
- [ ] CRUD completo con validaciones
- [ ] Eliminar con confirmación
- [ ] Manejo errores DRF, estados de carga, toasts

---

## 4. Customers

**Tipo:** CRUD estándar.

### Pantallas
- `/customers` — listado
- `/customers/new` — crear
- `/customers/[id]` — detalle + editar

### Operaciones
- Listar con paginación
- Filtrar por customer_type (individual / company)
- Buscar por nombre, email, company_name
- Ordenar por nombre, created_at
- CRUD completo

### Tabla (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| Nombre | name | sí |
| Empresa | company_name | no |
| Tipo | customer_type | no |
| Email | email | no |
| Teléfono | phone | no |
| Acciones | — | no |

### Formulario
| Campo | Tipo | Validación |
|-------|------|-----------|
| name | text | requerido |
| company_name | text | opcional |
| customer_type | select | requerido: individual \| company |
| email | email | requerido, único |
| phone | text | requerido |
| address | textarea | requerido |

### Criterios de completitud
- [ ] Tabla con filtro por tipo, búsqueda, paginación
- [ ] Badge de tipo (individual/company)
- [ ] CRUD completo con validaciones
- [ ] Eliminar con confirmación, toasts, errores DRF

---

## 5. Products

**Tipo:** CRUD. Depende de Suppliers (selector de proveedor en formulario).

### Pantallas
- `/products` — listado
- `/products/new` — crear
- `/products/[id]` — detalle + editar

### Operaciones
- Listar con paginación
- Filtrar por supplier
- Buscar por nombre, sku, descripción
- Ordenar por nombre, sku, unit_price, created_at
- CRUD completo

### Tabla (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| SKU | sku | sí |
| Nombre | name | sí |
| Proveedor | supplier (nombre) | no |
| Peso (kg) | weight_kg | no |
| Precio | unit_price | sí |
| Acciones | — | no |

### Formulario
| Campo | Tipo | Validación |
|-------|------|-----------|
| supplier | select (Suppliers) | requerido |
| name | text | requerido |
| sku | text | requerido, único |
| description | textarea | opcional |
| weight_kg | number | requerido, > 0 |
| length_cm | number | requerido, > 0 |
| width_cm | number | requerido, > 0 |
| height_cm | number | requerido, > 0 |
| unit_price | number | requerido, > 0 |

**Nota:** campos decimales se envían como string al backend.

### Criterios de completitud
- [ ] Tabla con filtro por supplier, búsqueda, paginación
- [ ] Selector de supplier poblado desde la API
- [ ] CRUD completo con validaciones
- [ ] Eliminar con confirmación, toasts, errores DRF

---

## 6. Drivers

**Tipo:** CRUD. El campo `user` (FK a auth_user) se ingresa como ID numérico — no hay pantalla de creación de usuarios en este frontend.

### Pantallas
- `/drivers` — listado
- `/drivers/new` — crear
- `/drivers/[id]` — detalle + editar

### Operaciones
- Listar con paginación
- Filtrar por status
- Buscar por nombre del usuario, license_number
- Ordenar por status, created_at
- CRUD completo

### Tabla (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| Licencia | license_number | no |
| Teléfono | phone | no |
| Estado | status | sí |
| Acciones | — | no |

### Formulario
| Campo | Tipo | Validación |
|-------|------|-----------|
| user | number | requerido (ID de auth_user) |
| license_number | text | requerido, único |
| phone | text | requerido |
| status | select | requerido: available \| on_route \| off_duty |

### Criterios de completitud
- [ ] Tabla con filtro por status, búsqueda, paginación
- [ ] Badge de estado con color (available=verde, on_route=amarillo, off_duty=gris)
- [ ] CRUD completo con validaciones
- [ ] Eliminar con confirmación, toasts, errores DRF

---

## 7. Transport

**Tipo:** CRUD. Depende de Drivers (selector de conductor).

### Pantallas
- `/transports` — listado
- `/transports/new` — crear
- `/transports/[id]` — detalle + editar

### Operaciones
- Listar con paginación
- Filtrar por vehicle_type, status, driver
- Buscar por plate_number
- Ordenar por plate_number, vehicle_type, status
- CRUD completo

### Tabla (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| Placa | plate_number | sí |
| Tipo | vehicle_type | no |
| Capacidad (kg) | capacity_kg | no |
| Estado | status | sí |
| Conductor | driver | no |
| Acciones | — | no |

### Formulario
| Campo | Tipo | Validación |
|-------|------|-----------|
| driver | select (Drivers) nullable | opcional |
| plate_number | text | requerido, único |
| vehicle_type | select | requerido: truck \| van \| motorcycle |
| capacity_kg | number | requerido, > 0 |
| status | select | requerido: available \| in_use \| maintenance |

### Criterios de completitud
- [ ] Tabla con filtros, búsqueda, paginación
- [ ] Selector de driver (nullable) poblado desde API
- [ ] Badges de tipo de vehículo y estado
- [ ] CRUD completo, confirmación de delete, toasts, errores DRF

---

## 8. Routes

**Tipo:** CRUD + gestión de paradas anidadas. Depende de Transport y Warehouses.

### Pantallas
- `/routes` — listado de rutas
- `/routes/new` — crear ruta
- `/routes/[id]` — detalle de ruta + lista de paradas
- `/routes/[id]/stops/new` — agregar parada

### Operaciones
- Listar rutas con paginación
- Filtrar por status, transport, origin_warehouse
- Buscar por nombre
- Ordenar por scheduled_date, status, created_at
- CRUD de ruta
- Listar paradas de una ruta (`GET /routes/{id}/stops/`)
- Agregar parada (`POST /routes/{id}/stops/`)

### Tabla Rutas (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| Nombre | name | no |
| Estado | status | sí |
| Fecha prog. | scheduled_date | sí |
| Transporte | transport | no |
| Almacén origen | origin_warehouse | no |
| Paradas | stops.length | no |
| Acciones | — | no |

### Tabla Paradas (TanStack Table, en detalle de ruta)
| Columna | Campo |
|---------|-------|
| Orden | stop_order |
| Dirección | address |
| Ciudad | city |
| Llegada estimada | estimated_arrival |
| Llegada real | actual_arrival |

### Formulario Ruta
| Campo | Tipo | Validación |
|-------|------|-----------|
| transport | select (Transport) | requerido |
| origin_warehouse | select (Warehouses) | requerido |
| name | text | requerido |
| status | select | requerido: planned \| in_progress \| completed \| cancelled |
| scheduled_date | date | requerido |

### Formulario Parada
| Campo | Tipo | Validación |
|-------|------|-----------|
| stop_order | number | requerido, > 0 |
| address | textarea | requerido |
| city | text | requerido |
| estimated_arrival | datetime-local | opcional |
| actual_arrival | datetime-local | opcional |

### Criterios de completitud
- [ ] Tabla de rutas con filtros, búsqueda, paginación
- [ ] CRUD de ruta con selectores de transport y warehouse
- [ ] Vista de detalle muestra lista de paradas ordenadas por stop_order
- [ ] Agregar parada desde el detalle de ruta
- [ ] Badges de estado de ruta
- [ ] Eliminar con confirmación, toasts, errores DRF

---

## 9. Shipments

**Tipo:** CRUD + gestión de productos anidados. Módulo central — depende de Customers, Warehouses, Routes, Products.

### Pantallas
- `/shipments` — listado con filtros
- `/shipments/new` — crear envío
- `/shipments/[id]` — detalle + lista de productos
- `/shipments/[id]/items/new` — agregar producto al envío

### Operaciones
- Listar con paginación
- Filtrar por status, customer, origin_warehouse, route
- Buscar por tracking_number, destination_address
- Ordenar por status, scheduled_delivery_date, created_at
- CRUD de envío
- Listar productos del envío (`GET /shipments/{id}/items/`)
- Agregar producto (`POST /shipments/{id}/items/`)

### Tabla Envíos (TanStack Table)
| Columna | Campo | Sortable |
|---------|-------|---------|
| Tracking | tracking_number | no |
| Cliente | customer | no |
| Estado | status | sí |
| Destino | destination_address | no |
| Fecha entrega prog. | scheduled_delivery_date | sí |
| Costo | shipping_cost | no |
| Acciones | — | no |

### Tabla Productos del Envío
| Columna | Campo |
|---------|-------|
| Producto | product (nombre) |
| Cantidad | quantity |
| Precio unitario | unit_price |
| Total | quantity × unit_price |

### Formulario Envío
| Campo | Tipo | Validación |
|-------|------|-----------|
| customer | select (Customers) | requerido |
| origin_warehouse | select (Warehouses) | requerido |
| route | select (Routes) nullable | opcional |
| status | select | requerido |
| origin_address | textarea | requerido |
| destination_address | textarea | requerido |
| scheduled_delivery_date | date | requerido |
| weight_kg | number | requerido, > 0 |
| declared_value | number | requerido, > 0 |
| shipping_cost | number | requerido, > 0 |
| notes | textarea | opcional |

**Nota:** `tracking_number` lo genera el servidor — no aparece en el formulario.

### Formulario Producto de Envío
| Campo | Tipo | Validación |
|-------|------|-----------|
| product | select (Products) | requerido |
| quantity | number | requerido, > 0 |
| unit_price | number | requerido, > 0 (snapshot del precio) |

### Criterios de completitud
- [ ] Tabla de envíos con filtros múltiples, búsqueda, paginación
- [ ] Badge de estado con color (pending=gris, assigned=azul, in_transit=amarillo, delivered=verde, cancelled=rojo)
- [ ] CRUD de envío con todos los selectores
- [ ] Vista de detalle muestra productos del envío con subtotal calculado
- [ ] Agregar producto desde el detalle del envío
- [ ] Eliminar con confirmación, toasts, errores DRF
