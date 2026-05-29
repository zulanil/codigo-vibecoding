# Spec: Drivers

## API utilizada

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/drivers/` | GET | Bearer | — | `PaginatedResponse<Driver>` |
| `/drivers/` | POST | Bearer | `DriverPayload` | `Driver` |
| `/drivers/{id}/` | GET | Bearer | — | `Driver` |
| `/drivers/{id}/` | PUT | Bearer | `DriverPayload` | `Driver` |
| `/drivers/{id}/` | PATCH | Bearer | `Partial<DriverPayload>` | `Driver` |
| `/drivers/{id}/` | DELETE | Bearer | — | 204 |

Query params: `?page=N` · `?status=available|on_route|off_duty` · `?search=` (user__first_name, user__last_name, license_number) · `?ordering=status|-status|created_at|-created_at`

Tipos: `Driver`, `DriverPayload`, `DriverStatus`, `PaginatedResponse`

## Rutas/páginas

| Ruta | Archivo | Tipo |
|------|---------|------|
| `/drivers` | `app/(dashboard)/drivers/page.tsx` | Server Component |
| `/drivers/new` | `app/(dashboard)/drivers/new/page.tsx` | Server Component |
| `/drivers/[id]` | `app/(dashboard)/drivers/[id]/page.tsx` | Server Component |

## Estructura de archivos

```
lib/api/drivers.ts
components/drivers/
  DriverColumns.tsx
  DriverTable.tsx       ← 'use client'
  DriverForm.tsx        ← 'use client'
  DriverEdit.tsx        ← 'use client'
  DeleteDriverDialog.tsx ← 'use client'
app/(dashboard)/drivers/  page.tsx · new/page.tsx · [id]/page.tsx
```

## Tareas

### Setup y tipos

- [x] Verificar `Driver`, `DriverPayload`, `DriverStatus` en `lib/types/index.ts`
- [x] Crear `lib/api/drivers.ts`: `getDrivers`, `getDriver`, `createDriver`, `updateDriver`, `deleteDriver`

### Componentes

- [x] `DriverColumns.tsx`:
  - `license_number` — header "Licencia"
  - `phone` — header "Teléfono"
  - `status` — header "Estado", Badge con color:
    - `available` → variant `outline` + clase `text-green-600 border-green-600`
    - `on_route` → variant `outline` + clase `text-yellow-600 border-yellow-600`
    - `off_duty` → variant `secondary`
  - `actions` — link Editar + botón Eliminar

- [x] `DriverTable.tsx` (`'use client'`):
  - `useSearchParams()` para `page`, `search`, `ordering`, `status`
  - `useQuery(['drivers', { page, search, ordering, status }])`
  - Botones filtro estado: "Todos" | "Disponible" | "En ruta" | "No disponible"
  - Input búsqueda debounce 300ms
  - TanStack Table `manualPagination`, `manualSorting`
  - Sorting en `status` → `?ordering=`
  - Skeleton, mensaje vacío, paginación

- [x] `DeleteDriverDialog.tsx`: Dialog + `useMutation(deleteDriver)` + `invalidateQueries(['drivers'])`

- [x] `DriverForm.tsx` (`'use client'`):
  - Campos: `user` (Input type="number", requerido), `license_number` (Input), `phone` (Input), `status` (botones toggle: available|on_route|off_duty)
  - Zod: `user: z.coerce.number().int().positive("Requerido")`, otros campos `z.string().min(1)`
  - `status` default: `"available"`
  - Al enviar: payload con `user` como number (ya lo hace zod coerce)
  - onSuccess: toast + `router.push('/drivers')`
  - onError: errores DRF → `setError`

- [x] `DriverEdit.tsx`: `useQuery(['driver', id])` → skeleton → `<DriverForm driver={data} />`

### Páginas

- [x] `drivers/page.tsx`: título "Conductores", link "+ Nuevo Conductor", `<Suspense><DriverTable /></Suspense>`
- [x] `drivers/new/page.tsx`: título "Nuevo Conductor", back link, `<DriverForm />`
- [x] `drivers/[id]/page.tsx`: `await params`, título "Editar Conductor", `<DriverEdit id={...} />`

### TanStack Query

- [x] `useQuery(['drivers', params])` en DriverTable
- [x] `useQuery(['driver', id])` en DriverEdit
- [x] `useMutation` create/update en DriverForm
- [x] `useMutation(deleteDriver)` + `invalidateQueries(['drivers'])` en DeleteDriverDialog

### TanStack Table

- [x] `ColumnDef<Driver>[]` con 4 columnas
- [x] Badge de estado con color

### Formulario Zod schema

```ts
z.object({
  user: z.coerce.number().int().positive("Requerido"),
  license_number: z.string().min(1, "Requerido"),
  phone: z.string().min(1, "Requerido"),
  status: z.enum(["available", "on_route", "off_duty"]),
})
```

### Casos borde

- [x] Skeleton tabla, lista vacía "No hay conductores registrados"
- [x] Error 401 interceptor, conductor no encontrado
- [x] Licencia duplicada → mensaje en campo
- [x] Filtro estado con estado activo visual
- [x] Confirmación delete, submit deshabilitado durante mutación

### Navegación

- [x] Link "Conductores" en Sidebar → `/drivers` ya existe

## Criterios de aceptación

- [x] Tabla con filtro por estado, búsqueda, paginación
- [x] Badge de estado con color (verde/amarillo/gris)
- [x] CRUD completo, validaciones, errores DRF, toasts
