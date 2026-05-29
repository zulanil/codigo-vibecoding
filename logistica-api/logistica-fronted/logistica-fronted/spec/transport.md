# Spec: Transport

## Información del módulo

- App Next.js: `app/(dashboard)/transports/`
- Dependencias: `drivers` (módulo ya implementado — selector de conductor en formulario y resolución de nombre en tabla)
- MVP order: #7 (después de Drivers, antes de Routes)

## Estado

- [x] Pendiente de aprobación
- [x] Aprobado — listo para implementar
- [x] Implementado
- [x] Validado

---

## API utilizada

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/transports/` | GET | Bearer | — | `PaginatedResponse<Transport>` |
| `/transports/` | POST | Bearer | `TransportPayload` | `Transport` |
| `/transports/{id}/` | GET | Bearer | — | `Transport` |
| `/transports/{id}/` | PUT | Bearer | `TransportPayload` | `Transport` |
| `/transports/{id}/` | PATCH | Bearer | `Partial<TransportPayload>` | `Transport` |
| `/transports/{id}/` | DELETE | Bearer | — | 204 |

Query params:
- `?page=N` — paginación (20 items/página)
- `?status=available|in_use|maintenance`
- `?vehicle_type=truck|van|motorcycle`
- `?driver=<id>`
- `?search=` — busca en `plate_number`
- `?ordering=plate_number|-plate_number|vehicle_type|-vehicle_type|status|-status`

Dependencia adicional: `GET /drivers/` — para poblar el selector en el formulario y resolver el nombre del conductor en la tabla. Usar `useQuery(['drivers-list'])` igual que `['suppliers-list']` en Products.

Tipos de `docs/models.ts`: `Transport`, `TransportPayload`, `VehicleType`, `TransportStatus`, `Driver`, `PaginatedResponse`

---

## Rutas / páginas

| Ruta | Archivo | Tipo |
|------|---------|------|
| `/transports` | `app/(dashboard)/transports/page.tsx` | Server Component |
| `/transports/new` | `app/(dashboard)/transports/new/page.tsx` | Server Component |
| `/transports/[id]` | `app/(dashboard)/transports/[id]/page.tsx` | Server Component |

---

## Estructura de archivos

```
lib/
  api/
    transports.ts

components/
  transports/
    TransportColumns.tsx
    TransportTable.tsx        ← 'use client'
    TransportForm.tsx         ← 'use client'
    TransportEdit.tsx         ← 'use client'
    DeleteTransportDialog.tsx ← 'use client'

app/
  (dashboard)/
    transports/
      page.tsx
      new/page.tsx
      [id]/page.tsx
```

---

## Tareas

### 1. Setup y tipos

- [x] Verificar que `Transport`, `TransportPayload`, `VehicleType`, `TransportStatus` están re-exportados en `lib/types/index.ts`
- [x] Verificar que `Driver` y `DriverPayload` también están disponibles en `lib/types/index.ts` (necesarios para construir el selector)

### 2. API functions — `lib/api/transports.ts`

- [x] Crear función `getTransports(params?: { page?: string; search?: string; ordering?: string; status?: string; vehicle_type?: string; driver?: string }): Promise<PaginatedResponse<Transport>>` — usa `apiClient.get('/transports/', { params })`
- [x] Crear función `getTransport(id: number): Promise<Transport>` — usa `apiClient.get('/transports/{id}/')`
- [x] Crear función `createTransport(payload: TransportPayload): Promise<Transport>` — usa `apiClient.post('/transports/', payload)`
- [x] Crear función `updateTransport(id: number, payload: TransportPayload): Promise<Transport>` — usa `apiClient.put('/transports/{id}/', payload)`
- [x] Crear función `deleteTransport(id: number): Promise<void>` — usa `apiClient.delete('/transports/{id}/')`, retorna `void`
- [x] Todas las funciones usan `apiClient` de `lib/api/client.ts`, nunca `fetch` ni `axios` directamente

### 3. Componente TransportColumns — `components/transports/TransportColumns.tsx`

- [x] Exportar función `getTransportColumns(driversMap: Map<number, string>): ColumnDef<Transport>[]`
- [x] Columna `plate_number` — header "Placa", sortable (`enableSorting: true`)
- [x] Columna `vehicle_type` — header "Tipo de Vehículo", no sortable, Badge con display en español:
  - `truck` → label "Camión", variant `secondary`
  - `van` → label "Furgoneta", variant `secondary`
  - `motorcycle` → label "Moto", variant `secondary`
- [x] Columna `capacity_kg` — header "Capacidad (kg)", no sortable, muestra el string directamente (no parsear)
- [x] Columna `status` — header "Estado", sortable (`enableSorting: true`), Badge con color:
  - `available` → variant `outline` + clase `text-green-600 border-green-600`
  - `in_use` → variant `outline` + clase `text-yellow-600 border-yellow-600`
  - `maintenance` → variant `outline` + clase `text-red-600 border-red-600`
- [x] Columna `driver` — header "Conductor", no sortable, resolver nombre via `driversMap.get(row.original.driver ?? -1) ?? "Sin asignar"` — cuando `driver` es `null` mostrar texto "Sin asignar"
- [x] Columna `actions` — id `"actions"`, header "Acciones", celda con: link a `/transports/{id}` (Editar) + `<DeleteTransportDialog id={id} />`

### 4. Componente TransportTable — `components/transports/TransportTable.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Leer `page`, `search`, `ordering`, `status`, `vehicle_type` desde `useSearchParams()`
- [x] `useQuery({ queryKey: ['transports', { page, search, ordering, status, vehicle_type }], queryFn: () => getTransports({ page, search, ordering, status, vehicle_type }) })` para la lista paginada
- [x] `useQuery({ queryKey: ['drivers-list'], queryFn: () => getDrivers() })` para resolver nombres de conductores — misma estrategia que `['suppliers-list']` en ProductTable
- [x] Construir `driversMap: Map<number, string>` desde drivers data: clave = `driver.id`, valor = `driver.license_number` (campo disponible sin necesidad de resolver FK de user)
- [x] Pasar `driversMap` a `getTransportColumns(driversMap)` para construir las columnas
- [x] `placeholderData: (prev) => prev` en la query de transports para evitar flash
- [x] Botones de filtro por `status`: "Todos" | "Disponible" | "En uso" | "Mantenimiento" — al hacer click actualizar `?status=` en la URL via `router.push` con `useRouter()`
- [x] Botones de filtro por `vehicle_type`: "Todos" | "Camión" | "Furgoneta" | "Moto" — al hacer click actualizar `?vehicle_type=` en la URL
- [x] Input de búsqueda con debounce 300ms → actualiza `?search=` en la URL
- [x] TanStack Table con `manualPagination: true`, `manualSorting: true`
- [x] `pageCount: Math.ceil(data.count / 20)`
- [x] `state: { pagination: { pageIndex: Number(page ?? 1) - 1, pageSize: 20 } }`
- [x] Sorting en `plate_number` y `status` → actualiza `?ordering=` en la URL (con `-` para descendente)
- [x] Mostrar skeleton mientras `isLoading`
- [x] Mostrar mensaje "No hay transportes registrados" si `data.results.length === 0`
- [x] Controles de paginación: botón Anterior (deshabilitado si `page === 1`) y Siguiente (deshabilitado si no hay `data.next`)

### 5. Componente DeleteTransportDialog — `components/transports/DeleteTransportDialog.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `id: number`
- [x] shadcn `Dialog` con trigger (botón "Eliminar"), título "Confirmar eliminación", descripción "Esta acción no se puede deshacer"
- [x] `useMutation({ mutationFn: () => deleteTransport(id), onSuccess: ..., onError: ... })`
- [x] `onSuccess`: cerrar dialog + `invalidateQueries({ queryKey: ['transports'] })` + toast de éxito
- [x] `onError`: toast de error con el mensaje del backend si disponible
- [x] Botón "Confirmar" con estado loading (`isPending`) y deshabilitado durante mutación
- [x] Botón "Cancelar" cierra el dialog sin hacer nada

### 6. Componente TransportForm — `components/transports/TransportForm.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `transport?: Transport` (opcional — ausente = modo crear, presente = modo editar)
- [x] `useQuery({ queryKey: ['drivers-list'], queryFn: () => getDrivers() })` para poblar el select de conductor
- [x] Mostrar skeleton mientras carga la lista de drivers
- [x] Campos del formulario con shadcn `Form` (react-hook-form + zod):
  - `driver` — shadcn `Select`, **opcional/nullable**: incluir opción "Sin asignar" con value `""` al inicio de la lista, luego una opción por driver con texto = `driver.license_number`, value = `String(driver.id)`
  - `plate_number` — shadcn `Input`, requerido
  - `vehicle_type` — shadcn `Select`, requerido, opciones: "Camión" (`truck`), "Furgoneta" (`van`), "Moto" (`motorcycle`)
  - `capacity_kg` — shadcn `Input` type="number", requerido, > 0, el valor se envía al backend como string
  - `status` — shadcn `Select`, requerido, opciones: "Disponible" (`available`), "En uso" (`in_use`), "Mantenimiento" (`maintenance`)
- [x] Zod schema (ver sección Formulario Zod schema)
- [x] `defaultValues` en modo edición:
  - `driver`: `transport.driver !== null ? String(transport.driver) : ""`
  - `plate_number`: `transport.plate_number`
  - `vehicle_type`: `transport.vehicle_type`
  - `capacity_kg`: `transport.capacity_kg` (ya es string)
  - `status`: `transport.status`
- [x] `defaultValues` en modo creación:
  - `driver`: `""`
  - `plate_number`: `""`
  - `vehicle_type`: `"truck"`
  - `capacity_kg`: `""`
  - `status`: `"available"`
- [x] Transformación al enviar: `driver: Number(values.driver) || null` — si `values.driver` es `""` o `"0"` enviar `null`, de lo contrario enviar `Number(values.driver)`
- [x] `capacity_kg` se envía como string directamente (no parsear)
- [x] `useMutation(createTransport)` en modo crear, `useMutation((p) => updateTransport(transport.id, p))` en modo editar
- [x] `onSuccess`: toast "Transporte creado/actualizado correctamente" + `router.push('/transports')`
- [x] `onError`: mapear errores DRF al campo correspondiente via `form.setError('plate_number', ...)` etc.; `non_field_errors` → toast
- [x] Botón "Guardar" con estado loading durante `isPending`, deshabilitado durante mutación
- [x] Botón "Cancelar" con `router.back()`

### 7. Componente TransportEdit — `components/transports/TransportEdit.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `id: number`
- [x] `useQuery({ queryKey: ['transport', id], queryFn: () => getTransport(id) })`
- [x] Mientras `isLoading`: mostrar skeleton de formulario
- [x] Si `isError` o no hay data: mostrar mensaje "Transporte no encontrado" con link para volver
- [x] Cuando hay data: renderizar `<TransportForm transport={data} />`

### 8. Páginas

- [x] `app/(dashboard)/transports/page.tsx`:
  - Server Component (sin `'use client'`)
  - `searchParams: Promise<{ page?: string; search?: string; ... }>` — NO desestructurar sin `await`
  - Título "Transportes"
  - Link/botón "+ Nuevo Transporte" apuntando a `/transports/new`
  - `<Suspense fallback={<Skeleton />}><TransportTable /></Suspense>`

- [x] `app/(dashboard)/transports/new/page.tsx`:
  - Server Component (sin `'use client'`)
  - Título "Nuevo Transporte"
  - Link "← Volver" apuntando a `/transports`
  - `<TransportForm />`

- [x] `app/(dashboard)/transports/[id]/page.tsx`:
  - Server Component (sin `'use client'`)
  - `params: Promise<{ id: string }>` — obligatorio usar `await params` (Next.js 16 breaking change)
  - `const { id } = await params` — convertir a number con `Number(id)`
  - Título "Editar Transporte"
  - Link "← Volver" apuntando a `/transports`
  - `<TransportEdit id={Number(id)} />`

### 9. TanStack Query hooks

- [x] `useQuery(['transports', params])` en TransportTable — lista paginada con filtros
- [x] `useQuery(['drivers-list'])` en TransportTable — para construir `driversMap` de nombres
- [x] `useQuery(['drivers-list'])` en TransportForm — para poblar el select de conductor (puede compartir caché con el de la tabla)
- [x] `useQuery(['transport', id])` en TransportEdit — detalle de un transporte
- [x] `useMutation(createTransport)` en TransportForm modo crear
- [x] `useMutation((p) => updateTransport(transport.id, p))` en TransportForm modo editar
- [x] `useMutation(deleteTransport)` + `invalidateQueries({ queryKey: ['transports'] })` en DeleteTransportDialog

### 10. TanStack Table

- [x] `ColumnDef<Transport>[]` generado por `getTransportColumns(driversMap)` — 6 columnas: `plate_number`, `vehicle_type`, `capacity_kg`, `status`, `driver`, `actions`
- [x] `useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true, manualSorting: true, pageCount, state: { pagination, sorting } })`
- [x] Sorting habilitado en `plate_number` y `status` — al cambiar sorting state, actualizar `?ordering=` en la URL
- [x] `manualPagination: true` — el backend controla la cantidad total de páginas

### 11. Formulario Zod schema

```ts
z.object({
  driver: z.string(), // "" significa sin asignar; convertir a Number||null antes de enviar
  plate_number: z.string().min(1, "Requerido"),
  vehicle_type: z.enum(["truck", "van", "motorcycle"]),
  capacity_kg: z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser > 0"),
  status: z.enum(["available", "in_use", "maintenance"]),
})
```

- [x] `driver`: `z.string()` sin validación de mínimo — puede ser `""` (sin asignar)
- [x] `plate_number`: `z.string().min(1, "Requerido")`
- [x] `vehicle_type`: `z.enum(["truck", "van", "motorcycle"])`
- [x] `capacity_kg`: `z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser > 0")`
- [x] `status`: `z.enum(["available", "in_use", "maintenance"])`
- [x] Al hacer submit: `const payload: TransportPayload = { ...values, driver: Number(values.driver) || null, capacity_kg: values.capacity_kg }`

### 12. Casos borde

- [x] `driver` nullable: cuando un transporte no tiene conductor asignado (`driver === null`), la columna de la tabla muestra "Sin asignar"; el select del formulario muestra la opción "Sin asignar" seleccionada
- [x] Skeleton en tabla mientras `isLoading` de transports o de drivers-list
- [x] Skeleton en formulario mientras carga la lista de drivers
- [x] Lista vacía: "No hay transportes registrados"
- [x] Error 401: gestionado por el interceptor de Axios en `lib/api/client.ts` — no requiere lógica adicional
- [x] Transporte no encontrado en `/transports/[id]`: mensaje "Transporte no encontrado" con link para volver
- [x] Placa duplicada (`plate_number` único en backend): DRF devuelve 400 con `{ plate_number: ["..."] }` → mapear a `form.setError('plate_number', ...)`
- [x] Filtros `status` y `vehicle_type` con estado visual activo (variante de botón diferente cuando el filtro está aplicado)
- [x] Botón submit deshabilitado durante `isPending` de la mutación
- [x] Confirmación antes de eliminar (DeleteTransportDialog)

### 13. Navegación

- [x] Verificar que el Sidebar incluye el link "Transportes" apuntando a `/transports` — si no existe, añadir la entrada al componente Sidebar del layout `app/(dashboard)/layout.tsx`

---

## Criterios de aceptación

- [x] Tabla con paginación, búsqueda por placa, filtros por status y vehicle_type
- [x] Badge de estado con color (available=verde, in_use=amarillo, maintenance=rojo)
- [x] Badge de tipo de vehículo con label en español
- [x] Columna "Conductor" resuelve el nombre del driver desde la lista de drivers; muestra "Sin asignar" cuando `driver` es `null`
- [x] Selector de conductor en formulario: nullable, opción "Sin asignar" seleccionable, lista poblada desde la API
- [x] `driver` se envía como `number` cuando está asignado y como `null` cuando no lo está
- [x] `capacity_kg` se trata como string en todo el flujo (tipado, formulario, payload)
- [x] CRUD completo con validaciones Zod, errores DRF mapeados a campos, toasts éxito/error
- [x] Eliminación con modal de confirmación
- [x] Loading skeletons en tabla y formulario
- [x] `await params` en `[id]/page.tsx` (patrón Next.js 16 obligatorio)
