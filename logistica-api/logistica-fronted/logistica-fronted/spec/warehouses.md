# Spec: Warehouses

## API utilizada

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/warehouses/` | GET | Bearer | — | `PaginatedResponse<Warehouse>` |
| `/warehouses/` | POST | Bearer | `WarehousePayload` | `Warehouse` |
| `/warehouses/{id}/` | GET | Bearer | — | `Warehouse` |
| `/warehouses/{id}/` | PUT | Bearer | `WarehousePayload` | `Warehouse` |
| `/warehouses/{id}/` | PATCH | Bearer | `Partial<WarehousePayload>` | `Warehouse` |
| `/warehouses/{id}/` | DELETE | Bearer | — | 204 |

Query params: `?page=N` · `?city=` · `?country=` · `?search=` (name, city, country) · `?ordering=name|-name|city|-city|created_at|-created_at`

Tipos de `docs/models.ts`: `Warehouse`, `WarehousePayload`, `PaginatedResponse`

## Rutas/páginas

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/warehouses` | `app/(dashboard)/warehouses/page.tsx` | Server Component | Listado paginado con tabla |
| `/warehouses/new` | `app/(dashboard)/warehouses/new/page.tsx` | Server Component | Renderiza `<WarehouseForm />` para crear |
| `/warehouses/[id]` | `app/(dashboard)/warehouses/[id]/page.tsx` | Server Component | Renderiza `<WarehouseEdit id={...} />` para editar |

## Estructura de archivos

```
lib/
  api/
    warehouses.ts

components/
  warehouses/
    WarehouseTable.tsx       ← 'use client' — TanStack Table con paginación/búsqueda/filtros
    WarehouseForm.tsx        ← 'use client' — shadcn Form crear/editar
    WarehouseColumns.tsx     ← definición de columnas
    DeleteWarehouseDialog.tsx ← 'use client' — modal confirmación
    WarehouseEdit.tsx        ← 'use client' — wrapper que fetcha y pasa a WarehouseForm

app/
  (dashboard)/
    warehouses/
      page.tsx
      new/page.tsx
      [id]/page.tsx
```

## Tareas

### Setup y tipos

- [x] Verificar que `Warehouse` y `WarehousePayload` están re-exportados en `lib/types/index.ts`
- [x] Crear `lib/api/warehouses.ts` con funciones tipadas:
  - `getWarehouses(params?: { page?: string; search?: string; ordering?: string; city?: string; country?: string }): Promise<PaginatedResponse<Warehouse>>`
  - `getWarehouse(id: number): Promise<Warehouse>`
  - `createWarehouse(payload: WarehousePayload): Promise<Warehouse>`
  - `updateWarehouse(id: number, payload: WarehousePayload): Promise<Warehouse>`
  - `deleteWarehouse(id: number): Promise<void>`

### Componentes

- [x] Crear `components/warehouses/WarehouseColumns.tsx`:
  - Columna `name` — sortable, header "Nombre"
  - Columna `city` — sortable, header "Ciudad"
  - Columna `country` — header "País"
  - Columna `capacity_kg` — header "Capacidad (kg)"
  - Columna `actions` — link Editar + botón Eliminar

- [x] Crear `components/warehouses/WarehouseTable.tsx` (`'use client'`):
  - `useSearchParams()` para leer `page`, `search`, `ordering`, `city`, `country`
  - `useQuery({ queryKey: ['warehouses', { page, search, ordering, city, country }] })`
  - `placeholderData: (prev) => prev`
  - TanStack Table `manualPagination: true`, `manualSorting: true`
  - Input búsqueda con debounce 300ms → `?search=`
  - Select filtro por `city` y `country` (inputs de texto que actualizan URL params)
  - Sorting en columnas `name` y `city` → `?ordering=`
  - Paginación prev/next
  - Skeleton loading (5 filas), mensaje vacío
  - shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`

- [x] Crear `components/warehouses/DeleteWarehouseDialog.tsx` (`'use client'`):
  - shadcn `Dialog`, mensaje con nombre del almacén
  - `useMutation(deleteWarehouse)` + `invalidateQueries(['warehouses'])` en onSuccess
  - Toast éxito/error, loading state en botón

- [x] Crear `components/warehouses/WarehouseForm.tsx` (`'use client'`):
  - Props: `warehouse?: Warehouse`
  - Zod schema + react-hook-form + zodResolver
  - Campos: `name` (Input), `address` (Textarea), `city` (Input), `country` (Input), `capacity_kg` (Input type="number", min > 0)
  - `capacity_kg` se envía como string al backend (DRF DecimalField)
  - `useMutation` create o update según modo
  - onSuccess: toast + `router.push('/warehouses')`
  - onError: mapear errores DRF a campos con `setError`, `non_field_errors` → toast
  - Botón submit con loading + botón Cancelar

- [x] Crear `components/warehouses/WarehouseEdit.tsx` (`'use client'`):
  - `useQuery(['warehouse', id])` → skeleton → error → `<WarehouseForm warehouse={data} />`

### Páginas

- [x] Crear `app/(dashboard)/warehouses/page.tsx` (Server Component):
  - Título "Almacenes"
  - Link "+ Nuevo Almacén" → `/warehouses/new` con `buttonVariants()`
  - `<Suspense>` wrapeando `<WarehouseTable />`

- [x] Crear `app/(dashboard)/warehouses/new/page.tsx` (Server Component):
  - Título "Nuevo Almacén"
  - Back link → `/warehouses`
  - `<WarehouseForm />`

- [x] Crear `app/(dashboard)/warehouses/[id]/page.tsx` (Server Component):
  - `await params`, título "Editar Almacén"
  - Back link → `/warehouses`
  - `<WarehouseEdit id={Number(id)} />`

### TanStack Query hooks

- [x] `useQuery(['warehouses', { page, search, ordering, city, country }])` en WarehouseTable
- [x] `useQuery(['warehouse', id])` en WarehouseEdit
- [x] `useMutation(createWarehouse)` en WarehouseForm (crear)
- [x] `useMutation((p) => updateWarehouse(id, p))` en WarehouseForm (editar)
- [x] `useMutation(deleteWarehouse)` + `invalidateQueries(['warehouses'])` en DeleteWarehouseDialog

### TanStack Table

- [x] `ColumnDef<Warehouse>[]` con 5 columnas
- [x] `useReactTable` con `manualPagination: true`, `manualSorting: true`
- [x] Sorting en `name` y `city` actualiza `?ordering=`
- [x] Paginación server-side con botones prev/next

### Formularios

- [x] Zod schema:
  ```ts
  z.object({
    name: z.string().min(1, "Requerido"),
    address: z.string().min(1, "Requerido"),
    city: z.string().min(1, "Requerido"),
    country: z.string().min(1, "Requerido"),
    capacity_kg: z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser mayor a 0"),
  })
  ```
- [x] `defaultValues` en modo edición pre-poblados desde `warehouse` prop
- [x] Mapeo errores DRF → `setError` por campo

### Casos borde

- [x] Loading state: skeleton en tabla
- [x] Lista vacía: "No hay almacenes registrados"
- [x] Error 401: interceptor Axios redirige a `/login`
- [x] Warehouse no encontrado: WarehouseEdit muestra error
- [x] Confirmación antes de delete
- [x] Botón submit deshabilitado durante mutación

### Navegación

- [x] Link "Almacenes" en Sidebar apunta a `/warehouses` — ya existe

## Criterios de aceptación

- [x] Tabla con paginación, búsqueda, filtro por ciudad/país y ordenamiento
- [x] Crear almacén con validación (capacity_kg > 0)
- [x] Editar almacén con formulario pre-poblado
- [x] Eliminar con modal de confirmación y toast
- [x] Errores DRF en formulario
- [x] Loading skeleton visible
- [x] Toast éxito/error en mutaciones
