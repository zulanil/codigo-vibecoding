# Spec: Routes

## Información del módulo

- App Next.js: `app/(dashboard)/routes/`
- Dependencias: `transport` (módulo ya validado — selector de transporte), `warehouses` (módulo ya validado — selector de almacén de origen)
- MVP order: #8 (después de Transport, antes de Shipments)

## Estado

- [x] Pendiente de aprobación
- [x] Aprobado — listo para implementar
- [x] Implementado
- [x] Validado

---

## API utilizada

### Rutas principales

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/routes/` | GET | Bearer | — | `PaginatedResponse<Route>` |
| `/routes/` | POST | Bearer | `RoutePayload` | `Route` |
| `/routes/{id}/` | GET | Bearer | — | `Route` (incluye `stops[]`) |
| `/routes/{id}/` | PUT | Bearer | `RoutePayload` | `Route` |
| `/routes/{id}/` | PATCH | Bearer | `Partial<RoutePayload>` | `Route` |
| `/routes/{id}/` | DELETE | Bearer | — | 204 |

Query params de `/routes/`:
- `?page=N` — paginación (20 items/página)
- `?status=planned|in_progress|completed|cancelled`
- `?transport=<id>`
- `?origin_warehouse=<id>`
- `?search=` — busca en `name`
- `?ordering=scheduled_date|-scheduled_date|status|-status|created_at|-created_at`

### Paradas anidadas (nested stops)

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/routes/{id}/stops/` | GET | Bearer | — | `RouteStop[]` |
| `/routes/{id}/stops/` | POST | Bearer | `RouteStopPayload` | `RouteStop` |

Nota: las paradas también se incluyen dentro del objeto `Route` en la respuesta del `GET /routes/{id}/` como campo `stops: RouteStop[]`. El `GET /routes/{id}/stops/` es para uso futuro; en esta implementación se leerá `stops` directamente desde el objeto de la ruta.

### Dependencias de selectores

| Endpoint | Propósito | Query key |
|----------|-----------|-----------|
| `GET /transports/` | Poblar selector de transporte y resolver nombre en tabla | `['transports-list']` |
| `GET /warehouses/` | Poblar selector de almacén y resolver nombre en tabla | `['warehouses-list']` |

Tipos de `docs/models.ts`: `Route`, `RoutePayload`, `RouteStop`, `RouteStopPayload`, `RouteStatus`, `Transport`, `Warehouse`, `PaginatedResponse`

---

## Rutas / páginas

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/routes` | `app/(dashboard)/routes/page.tsx` | Server Component | Listado de rutas con tabla |
| `/routes/new` | `app/(dashboard)/routes/new/page.tsx` | Server Component | Formulario de creación |
| `/routes/[id]` | `app/(dashboard)/routes/[id]/page.tsx` | Server Component | Edición de ruta + panel de paradas |

---

## Estructura de archivos

```
lib/
  api/
    routes.ts

components/
  routes/
    RouteColumns.tsx
    RouteTable.tsx          ← 'use client'
    RouteForm.tsx           ← 'use client'
    RouteEdit.tsx           ← 'use client'
    DeleteRouteDialog.tsx   ← 'use client'
    StopsPanel.tsx          ← 'use client'
    AddStopDialog.tsx       ← 'use client'

app/
  (dashboard)/
    routes/
      page.tsx
      new/page.tsx
      [id]/page.tsx
```

---

## Tareas

### 1. Setup y tipos

- [x] Verificar que `Route`, `RoutePayload`, `RouteStop`, `RouteStopPayload`, `RouteStatus` están re-exportados en `lib/types/index.ts`
- [x] Verificar que `Transport` y `Warehouse` también están disponibles en `lib/types/index.ts` (necesarios para los selectores)

### 2. API functions — `lib/api/routes.ts`

- [x] Crear función `getRoutes(params?: { page?: string; search?: string; ordering?: string; status?: string; transport?: string; origin_warehouse?: string }): Promise<PaginatedResponse<Route>>` — usa `apiClient.get('/routes/', { params })`
- [x] Crear función `getRoute(id: number): Promise<Route>` — usa `apiClient.get('/routes/{id}/')`, la respuesta incluye el campo `stops: RouteStop[]`
- [x] Crear función `createRoute(payload: RoutePayload): Promise<Route>` — usa `apiClient.post('/routes/', payload)`
- [x] Crear función `updateRoute(id: number, payload: RoutePayload): Promise<Route>` — usa `apiClient.put('/routes/{id}/', payload)`
- [x] Crear función `deleteRoute(id: number): Promise<void>` — usa `apiClient.delete('/routes/{id}/')`, retorna `void`
- [x] Crear función `getRouteStops(routeId: number): Promise<RouteStop[]>` — usa `apiClient.get('/routes/{routeId}/stops/')`
- [x] Crear función `createRouteStop(routeId: number, payload: RouteStopPayload): Promise<RouteStop>` — usa `apiClient.post('/routes/{routeId}/stops/', payload)`
- [x] Todas las funciones usan `apiClient` de `lib/api/client.ts`, nunca `fetch` ni `axios` directamente

### 3. Componente RouteColumns — `components/routes/RouteColumns.tsx`

- [x] Exportar función `getRouteColumns(transportsMap: Map<number, string>, warehousesMap: Map<number, string>): ColumnDef<Route>[]`
- [x] Columna `name` — header "Nombre", no sortable
- [x] Columna `status` — header "Estado", sortable (`enableSorting: true`), Badge con color:
  - `planned` → variant `outline` + clase `text-blue-600 border-blue-600`
  - `in_progress` → variant `outline` + clase `text-yellow-600 border-yellow-600`
  - `completed` → variant `outline` + clase `text-green-600 border-green-600`
  - `cancelled` → variant `outline` + clase `text-red-600 border-red-600` (o `variant="secondary"`)
- [x] Columna `scheduled_date` — header "Fecha programada", sortable (`enableSorting: true`), mostrar el string `YYYY-MM-DD` directamente
- [x] Columna `transport` — header "Transporte", no sortable, resolver nombre via `transportsMap.get(row.original.transport) ?? String(row.original.transport)` — mostrar `plate_number` del transporte
- [x] Columna `origin_warehouse` — header "Almacén origen", no sortable, resolver nombre via `warehousesMap.get(row.original.origin_warehouse) ?? String(row.original.origin_warehouse)` — mostrar `name` del almacén
- [x] Columna `stops` — header "Paradas", no sortable, mostrar `row.original.stops.length` como número entero
- [x] Columna `actions` — id `"actions"`, header "Acciones", celda con: link a `/routes/{id}` (Editar) + `<DeleteRouteDialog id={id} />`

### 4. Componente RouteTable — `components/routes/RouteTable.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Leer `page`, `search`, `ordering`, `status` desde `useSearchParams()`
- [x] `useQuery({ queryKey: ['routes', { page, search, ordering, status }], queryFn: () => getRoutes({ page, search, ordering, status }) })` para la lista paginada
- [x] `useQuery({ queryKey: ['transports-list'], queryFn: () => getTransports() })` — para resolver nombres de transporte; usar `staleTime: 5 * 60 * 1000`
- [x] `useQuery({ queryKey: ['warehouses-list'], queryFn: () => getWarehouses() })` — para resolver nombres de almacén; usar `staleTime: 5 * 60 * 1000`
- [x] Construir `transportsMap: Map<number, string>` desde transports data: clave = `transport.id`, valor = `transport.plate_number`
- [x] Construir `warehousesMap: Map<number, string>` desde warehouses data: clave = `warehouse.id`, valor = `warehouse.name`
- [x] Pasar ambos mapas a `getRouteColumns(transportsMap, warehousesMap)` para construir las columnas
- [x] `placeholderData: (prev) => prev` en la query de routes para evitar flash
- [x] Botones de filtro por `status`: "Todos" | "Planificada" | "En progreso" | "Completada" | "Cancelada" — al hacer click actualizar `?status=` en la URL via `router.push` con `useRouter()`
- [x] Input de búsqueda con debounce 300ms → actualiza `?search=` en la URL
- [x] TanStack Table con `manualPagination: true`, `manualSorting: true`
- [x] `pageCount: Math.ceil(data.count / 20)`
- [x] `state: { pagination: { pageIndex: Number(page ?? 1) - 1, pageSize: 20 } }`
- [x] Sorting en `status` y `scheduled_date` → actualiza `?ordering=` en la URL (con `-` para descendente)
- [x] Mostrar skeleton mientras `isLoading`
- [x] Mostrar mensaje "No hay rutas registradas" si `data.results.length === 0`
- [x] Controles de paginación: botón Anterior (deshabilitado si `page === 1`) y Siguiente (deshabilitado si no hay `data.next`)

### 5. Componente DeleteRouteDialog — `components/routes/DeleteRouteDialog.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `id: number`
- [x] shadcn `Dialog` con trigger (botón "Eliminar"), título "Confirmar eliminación", descripción "Esta acción no se puede deshacer"
- [x] `useMutation({ mutationFn: () => deleteRoute(id), onSuccess: ..., onError: ... })`
- [x] `onSuccess`: cerrar dialog + `invalidateQueries({ queryKey: ['routes'] })` + toast de éxito "Ruta eliminada correctamente"
- [x] `onError`: toast de error con el mensaje del backend si disponible
- [x] Botón "Confirmar" con estado loading (`isPending`) y deshabilitado durante mutación
- [x] Botón "Cancelar" cierra el dialog sin hacer nada

### 6. Componente RouteForm — `components/routes/RouteForm.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `route?: Route` (opcional — ausente = modo crear, presente = modo editar)
- [x] `useQuery({ queryKey: ['transports-list'], queryFn: () => getTransports(), staleTime: 5 * 60 * 1000 })` para poblar el select de transporte
- [x] `useQuery({ queryKey: ['warehouses-list'], queryFn: () => getWarehouses(), staleTime: 5 * 60 * 1000 })` para poblar el select de almacén
- [x] Mostrar skeleton mientras carga cualquiera de las dos listas
- [x] Campos del formulario con shadcn `Form` (react-hook-form + zod):
  - `transport` — shadcn `Select`, **requerido**: una opción por transporte con texto = `transport.plate_number`, value = `String(transport.id)`; sin opción "Sin asignar"
  - `origin_warehouse` — shadcn `Select`, **requerido**: una opción por almacén con texto = `warehouse.name`, value = `String(warehouse.id)`; sin opción "Sin asignar"
  - `name` — shadcn `Input`, requerido
  - `status` — shadcn `Select`, requerido, opciones: "Planificada" (`planned`), "En progreso" (`in_progress`), "Completada" (`completed`), "Cancelada" (`cancelled`)
  - `scheduled_date` — shadcn `Input` type="date", requerido, retorna string `YYYY-MM-DD`
- [x] Zod schema (ver sección Zod schemas — RouteForm)
- [x] `defaultValues` en modo edición:
  - `transport`: `String(route.transport)`
  - `origin_warehouse`: `String(route.origin_warehouse)`
  - `name`: `route.name`
  - `status`: `route.status`
  - `scheduled_date`: `route.scheduled_date`
- [x] `defaultValues` en modo creación:
  - `transport`: `""`
  - `origin_warehouse`: `""`
  - `name`: `""`
  - `status`: `"planned"`
  - `scheduled_date`: `""`
- [x] Transformación al enviar: `transport: Number(values.transport)` y `origin_warehouse: Number(values.origin_warehouse)` — ambos son requeridos, nunca `null`
- [x] `useMutation(createRoute)` en modo crear, `useMutation((p) => updateRoute(route.id, p))` en modo editar
- [x] `onSuccess` en modo crear: toast "Ruta creada correctamente" + `router.push('/routes')`
- [x] `onSuccess` en modo editar: toast "Ruta actualizada correctamente" + `router.push('/routes')`
- [x] `onError`: mapear errores DRF al campo correspondiente via `form.setError('name', ...)` etc.; `non_field_errors` → toast de error
- [x] Botón "Guardar" con estado loading durante `isPending`, deshabilitado durante mutación
- [x] Botón "Cancelar" con `router.back()`
- [x] En modo editar, NO renderizar `StopsPanel` dentro de este componente — el panel de paradas lo renderiza `RouteEdit`

### 7. Componente RouteEdit — `components/routes/RouteEdit.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `id: number`
- [x] `useQuery({ queryKey: ['route', id], queryFn: () => getRoute(id) })` — la respuesta incluye `stops: RouteStop[]`
- [x] Mientras `isLoading`: mostrar skeleton de formulario
- [x] Si `isError` o no hay data: mostrar mensaje "Ruta no encontrada" con link "← Volver a rutas"
- [x] Cuando hay data: renderizar `<RouteForm route={data} />` seguido de `<StopsPanel routeId={id} stops={data.stops} />`
- [x] `StopsPanel` se muestra debajo del formulario, separado visualmente (margen o divisor)

### 8. Componente StopsPanel — `components/routes/StopsPanel.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `routeId: number`, `stops: RouteStop[]`
- [x] Mostrar sección con título "Paradas" y contador "(N paradas)"
- [x] Tabla de paradas usando TanStack Table con columnas:
  - `stop_order` — header "Orden"
  - `address` — header "Dirección"
  - `city` — header "Ciudad"
  - `estimated_arrival` — header "Llegada estimada", mostrar `null` como "—"
  - `actual_arrival` — header "Llegada real", mostrar `null` como "—"
- [x] Ordenar las filas visualmente por `stop_order` ascendente (no requiere sorting manual, los datos vienen ordenados del backend)
- [x] Mostrar mensaje "Sin paradas registradas" si `stops.length === 0`
- [x] Botón "+ Agregar parada" que abre `AddStopDialog`
- [x] Estado local `open: boolean` controlado via `useState` para el dialog
- [x] Al cerrar `AddStopDialog` con éxito, la query `['route', routeId]` ya fue invalidada — el componente padre `RouteEdit` se re-renderiza con los stops actualizados

### 9. Componente AddStopDialog — `components/routes/AddStopDialog.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `routeId: number`, `open: boolean`, `onClose: () => void`
- [x] shadcn `Dialog` controlado por prop `open`, `onOpenChange` llama a `onClose`
- [x] Título del dialog: "Agregar parada"
- [x] Campos del formulario con shadcn `Form` (react-hook-form + zod):
  - `stop_order` — shadcn `Input` type="number", min="1", step="1", requerido
  - `address` — shadcn `Textarea`, requerido
  - `city` — shadcn `Input`, requerido
  - `estimated_arrival` — shadcn `Input` type="datetime-local", opcional — campo puede quedar vacío
  - `actual_arrival` — shadcn `Input` type="datetime-local", opcional — campo puede quedar vacío
- [x] Zod schema (ver sección Zod schemas — AddStop)
- [x] `defaultValues`:
  - `stop_order`: campo vacío (el usuario lo ingresa)
  - `address`: `""`
  - `city`: `""`
  - `estimated_arrival`: `""`
  - `actual_arrival`: `""`
- [x] Transformación al enviar: `estimated_arrival: values.estimated_arrival === "" ? null : values.estimated_arrival`, ídem para `actual_arrival`
- [x] `useMutation({ mutationFn: (payload: RouteStopPayload) => createRouteStop(routeId, payload) })`
- [x] `onSuccess`: `invalidateQueries({ queryKey: ['route', routeId] })` + toast "Parada agregada correctamente" + llamar `onClose()` + resetear formulario con `form.reset()`
- [x] `onError`: mapear errores DRF al campo correspondiente; `non_field_errors` → toast de error
- [x] Botón "Agregar" con estado loading durante `isPending`, deshabilitado durante mutación
- [x] Botón "Cancelar" llama a `onClose()` sin hacer nada más

### 10. Páginas

- [x] `app/(dashboard)/routes/page.tsx`:
  - Server Component (sin `'use client'`)
  - `searchParams: Promise<{ page?: string; search?: string; ordering?: string; status?: string }>` — usar `await searchParams`
  - Título "Rutas"
  - Link/botón "+ Nueva Ruta" apuntando a `/routes/new`
  - `<Suspense fallback={<Skeleton />}><RouteTable /></Suspense>`

- [x] `app/(dashboard)/routes/new/page.tsx`:
  - Server Component (sin `'use client'`)
  - Título "Nueva Ruta"
  - Link "← Volver" apuntando a `/routes`
  - `<RouteForm />`

- [x] `app/(dashboard)/routes/[id]/page.tsx`:
  - Server Component (sin `'use client'`)
  - `params: Promise<{ id: string }>` — obligatorio usar `await params` (Next.js 16 breaking change)
  - `const { id } = await params` — convertir a number con `Number(id)`
  - Título "Editar Ruta"
  - Link "← Volver" apuntando a `/routes`
  - `<RouteEdit id={Number(id)} />`

### 11. TanStack Query hooks

- [x] `useQuery(['routes', params])` en RouteTable — lista paginada con filtros
- [x] `useQuery(['transports-list'])` en RouteTable — para construir `transportsMap`
- [x] `useQuery(['warehouses-list'])` en RouteTable — para construir `warehousesMap`
- [x] `useQuery(['transports-list'])` en RouteForm — para poblar el select (comparte caché con el de la tabla)
- [x] `useQuery(['warehouses-list'])` en RouteForm — para poblar el select (comparte caché con el de la tabla)
- [x] `useQuery(['route', id])` en RouteEdit — detalle de una ruta, incluye `stops[]`
- [x] `useMutation(createRoute)` en RouteForm modo crear
- [x] `useMutation((p) => updateRoute(route.id, p))` en RouteForm modo editar
- [x] `useMutation(deleteRoute)` + `invalidateQueries({ queryKey: ['routes'] })` en DeleteRouteDialog
- [x] `useMutation((payload) => createRouteStop(routeId, payload))` + `invalidateQueries({ queryKey: ['route', routeId] })` en AddStopDialog

### 12. TanStack Table

- [x] `ColumnDef<Route>[]` generado por `getRouteColumns(transportsMap, warehousesMap)` — 7 columnas: `name`, `status`, `scheduled_date`, `transport`, `origin_warehouse`, `stops`, `actions`
- [x] `useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true, manualSorting: true, pageCount, state: { pagination, sorting } })` en RouteTable
- [x] Sorting habilitado en `status` y `scheduled_date` — al cambiar sorting state, actualizar `?ordering=` en la URL
- [x] `manualPagination: true` — el backend controla la cantidad total de páginas
- [x] Tabla de paradas en StopsPanel: `ColumnDef<RouteStop>[]` con 5 columnas: `stop_order`, `address`, `city`, `estimated_arrival`, `actual_arrival` — sin paginación, sin sorting manual (datos ya vienen ordenados por `stop_order`)

### 13. Zod schemas

**RouteForm schema:**

```ts
z.object({
  transport: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  scheduled_date: z.string().min(1, "Requerido"),
})
```

- [x] `transport`: `z.string().min(1, "Requerido")` — el select retorna string, se convierte a `Number()` antes de enviar
- [x] `origin_warehouse`: `z.string().min(1, "Requerido")` — ídem conversión a `Number()`
- [x] `name`: `z.string().min(1, "Requerido")`
- [x] `status`: `z.enum(["planned", "in_progress", "completed", "cancelled"])`
- [x] `scheduled_date`: `z.string().min(1, "Requerido")` — el input type="date" retorna string `YYYY-MM-DD`, se envía directamente sin conversión
- [x] Al hacer submit: `const payload: RoutePayload = { ...values, transport: Number(values.transport), origin_warehouse: Number(values.origin_warehouse) }`

**AddStop schema:**

```ts
z.object({
  stop_order: z.coerce.number().int().positive("Requerido"),
  address: z.string().min(1, "Requerido"),
  city: z.string().min(1, "Requerido"),
  estimated_arrival: z.string(),
  actual_arrival: z.string(),
})
```

- [x] `stop_order`: `z.coerce.number().int().positive("Requerido")` — `coerce` convierte el string del input a number automáticamente
- [x] `address`: `z.string().min(1, "Requerido")`
- [x] `city`: `z.string().min(1, "Requerido")`
- [x] `estimated_arrival`: `z.string()` — sin validación de mínimo, puede ser `""`
- [x] `actual_arrival`: `z.string()` — sin validación de mínimo, puede ser `""`
- [x] Al hacer submit: `const payload: RouteStopPayload = { ...values, estimated_arrival: values.estimated_arrival === "" ? null : values.estimated_arrival, actual_arrival: values.actual_arrival === "" ? null : values.actual_arrival }`

### 14. Casos borde

- [x] Skeleton en RouteTable mientras `isLoading` de routes, transports-list o warehouses-list
- [x] Skeleton en RouteForm mientras carga transports-list o warehouses-list
- [x] Lista vacía en RouteTable: "No hay rutas registradas"
- [x] Paradas vacías en StopsPanel: "Sin paradas registradas"
- [x] Ruta no encontrada en `/routes/[id]`: mensaje "Ruta no encontrada" con link "← Volver a rutas"
- [x] Error 401: gestionado por el interceptor de Axios en `lib/api/client.ts` — no requiere lógica adicional
- [x] `stop_order` duplicado en la misma ruta: DRF devuelve 400 con `{ stop_order: ["..."] }` → mapear a `form.setError('stop_order', ...)`
- [x] `estimated_arrival` y `actual_arrival` enviados como `null` cuando el campo del input está vacío, como string ISO cuando tiene valor
- [x] Filtro por `status` con estado visual activo (variante de botón diferente cuando el filtro está aplicado)
- [x] Botón submit del RouteForm deshabilitado durante `isPending` de la mutación
- [x] Botón "Agregar" del AddStopDialog deshabilitado durante `isPending` de la mutación
- [x] Confirmación antes de eliminar ruta (DeleteRouteDialog)
- [x] Al agregar una parada con éxito, el AddStopDialog se cierra, el formulario se resetea, y la lista de paradas en StopsPanel se actualiza automáticamente vía invalidación de `['route', routeId]`
- [x] `transportsMap` y `warehousesMap` construidos como `new Map()` vacíos mientras las queries de selectores cargan, para no bloquear el render de la tabla

### 15. Navegación

- [x] Verificar que el Sidebar incluye el link "Rutas" apuntando a `/routes` — si no existe, añadir la entrada al componente Sidebar del layout `app/(dashboard)/layout.tsx`

---

## Criterios de aceptación

- [x] Tabla de rutas con paginación, búsqueda por nombre, filtro por status y ordenamiento por fecha y estado
- [x] Badge de estado con color (planned=azul, in_progress=amarillo, completed=verde, cancelled=rojo)
- [x] Columna "Transporte" resuelve `plate_number` desde la lista de transportes
- [x] Columna "Almacén origen" resuelve `name` desde la lista de almacenes
- [x] Columna "Paradas" muestra el conteo de `stops.length`
- [x] Formulario de ruta con selector de transporte (requerido) y selector de almacén (requerido), ambos poblados desde la API
- [x] `transport` y `origin_warehouse` se envían como `number` al backend
- [x] `scheduled_date` se trata como string `YYYY-MM-DD` en todo el flujo
- [x] Vista de edición muestra el RouteForm con los datos actuales y el StopsPanel debajo
- [x] StopsPanel muestra las paradas existentes ordenadas por `stop_order`
- [x] Agregar parada desde el StopsPanel via AddStopDialog — formulario con los 5 campos de RouteStop
- [x] `estimated_arrival` y `actual_arrival` se envían como `null` si están vacíos, como string si tienen valor
- [x] CRUD completo de ruta con validaciones Zod, errores DRF mapeados a campos, toasts éxito/error
- [x] Eliminación de ruta con modal de confirmación
- [x] Loading skeletons en tabla, formulario de ruta y formulario de parada
- [x] `await params` en `[id]/page.tsx` (patrón Next.js 16 obligatorio)
