# Spec: Suppliers

## API utilizada

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/suppliers/` | GET | Bearer | — | `PaginatedResponse<Supplier>` |
| `/suppliers/` | POST | Bearer | `SupplierPayload` | `Supplier` |
| `/suppliers/{id}/` | GET | Bearer | — | `Supplier` |
| `/suppliers/{id}/` | PUT | Bearer | `SupplierPayload` | `Supplier` |
| `/suppliers/{id}/` | PATCH | Bearer | `Partial<SupplierPayload>` | `Supplier` |
| `/suppliers/{id}/` | DELETE | Bearer | — | 204 |

Query params en GET lista: `?page=N` · `?search=` (name, email, contact_name) · `?ordering=name|-name|created_at|-created_at`

Tipos de `docs/models.ts`: `Supplier`, `SupplierPayload`, `PaginatedResponse`

## Rutas/páginas

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/suppliers` | `app/(dashboard)/suppliers/page.tsx` | Server Component | Listado paginado con tabla |
| `/suppliers/new` | `app/(dashboard)/suppliers/new/page.tsx` | Server Component | Renderiza `<SupplierForm />` para crear |
| `/suppliers/[id]` | `app/(dashboard)/suppliers/[id]/page.tsx` | Server Component | Renderiza `<SupplierEdit id={...} />` para editar |

## Estructura de archivos

```
lib/
  api/
    suppliers.ts                          ← funciones Axios tipadas

components/
  suppliers/
    SupplierTable.tsx                     ← 'use client' — TanStack Table con paginación/búsqueda
    SupplierForm.tsx                      ← 'use client' — shadcn Form crear/editar
    SupplierColumns.tsx                   ← definición de columnas TanStack Table
    DeleteSupplierDialog.tsx              ← 'use client' — modal confirmación de delete
    SupplierEdit.tsx                      ← 'use client' — wrapper que fetcha supplier y pasa a SupplierForm

app/
  (dashboard)/
    suppliers/
      page.tsx                            ← Server Component — listado
      new/
        page.tsx                          ← Server Component — página creación
      [id]/
        page.tsx                          ← Server Component — página detalle/edición
```

## Tareas

### Setup y tipos

- [x] Verificar que `Supplier` y `SupplierPayload` están re-exportados en `lib/types/index.ts`
- [x] Crear `lib/api/suppliers.ts` con las siguientes funciones tipadas usando `apiClient`:
  - `getSuppliers(params?: { page?: string; search?: string; ordering?: string }): Promise<PaginatedResponse<Supplier>>`
  - `getSupplier(id: number): Promise<Supplier>`
  - `createSupplier(payload: SupplierPayload): Promise<Supplier>`
  - `updateSupplier(id: number, payload: SupplierPayload): Promise<Supplier>`
  - `deleteSupplier(id: number): Promise<void>`

### Componentes

- [x] Crear `components/suppliers/SupplierColumns.tsx`:
  - Columna `name` — sortable, header "Nombre"
  - Columna `contact_name` — header "Contacto"
  - Columna `email` — header "Email"
  - Columna `phone` — header "Teléfono"
  - Columna `actions` — botones Editar (link a `/suppliers/{id}`) y Eliminar (abre `DeleteSupplierDialog`)

- [x] Crear `components/suppliers/SupplierTable.tsx` (`'use client'`):
  - Usa `useSearchParams()` para leer estado de URL, wrapped en Suspense desde la página
  - TanStack Table con `manualPagination: true`, `pageCount: Math.ceil(data.count / 20)`
  - Input de búsqueda con debounce (300ms) que actualiza query param `?search=`
  - Botones Anterior/Siguiente para paginación que actualizan `?page=`
  - Columna `name` sortable que actualiza `?ordering=`
  - shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
  - Estado de carga: skeleton rows cuando data está loading
  - Estado lista vacía: mensaje "No hay proveedores" cuando `data.results.length === 0`

- [x] Crear `components/suppliers/DeleteSupplierDialog.tsx` (`'use client'`):
  - shadcn `Dialog` con título "Eliminar proveedor" y mensaje de confirmación con el nombre
  - Botón "Cancelar" cierra el dialog
  - Botón "Eliminar" llama a `deleteSupplier(id)` via `useMutation`
  - En `onSuccess`: toast "Proveedor eliminado" + invalidar query `['suppliers']`
  - En `onError`: toast de error
  - Estado loading en botón Eliminar durante la mutación

- [x] Crear `components/suppliers/SupplierForm.tsx` (`'use client'`):
  - Recibe `supplier?: Supplier` (si tiene valor = modo edición, si no = modo creación)
  - shadcn `Form` con `react-hook-form` + zod schema
  - Campos: `name` (Input), `contact_name` (Input), `email` (Input type="email"), `phone` (Input), `address` (Textarea)
  - Validaciones zod: todos los campos requeridos, `email` válido
  - En modo creación: llama `createSupplier(payload)` via `useMutation`
  - En modo edición: llama `updateSupplier(id, payload)` via `useMutation`
  - `onSuccess` creación: toast "Proveedor creado" + `router.push('/suppliers')`
  - `onSuccess` edición: toast "Proveedor actualizado" + `router.push('/suppliers')`
  - Errores DRF: mapear `error.response.data` a campos del formulario con `setError` de react-hook-form
  - Botón submit con estado loading (`isPending`): texto "Guardando..." y deshabilitado
  - Botón "Cancelar" → `router.back()`

- [x] Crear `components/suppliers/SupplierEdit.tsx` (`'use client'`):
  - Recibe `id: number`, usa `useQuery(['supplier', id])` para fetchar proveedor
  - Muestra skeleton mientras carga
  - Muestra error si no existe
  - Renderiza `<SupplierForm supplier={data} />` al completar

### Páginas

- [x] Crear `app/(dashboard)/suppliers/page.tsx` (Server Component):
  - Botón "+ Nuevo Proveedor" link a `/suppliers/new` (usando `buttonVariants`)
  - Título de página "Proveedores"
  - Renderiza `<SupplierTable />` dentro de `<Suspense>` (necesario por `useSearchParams()`)

- [x] Crear `app/(dashboard)/suppliers/new/page.tsx` (Server Component):
  - Título "Nuevo Proveedor"
  - Renderiza `<SupplierForm />` sin props (modo creación)

- [x] Crear `app/(dashboard)/suppliers/[id]/page.tsx` (Server Component):
  - `params: Promise<{ id: string }>` — hacer `await params`
  - Título "Editar Proveedor"
  - Renderiza `<SupplierEdit id={Number(id)} />`

### TanStack Query hooks

- [x] En `SupplierTable.tsx`: `useQuery({ queryKey: ['suppliers', { page, search, ordering }], ... })`
  - `placeholderData: (prev) => prev` para transición suave entre páginas
  - Si `isLoading`: mostrar skeleton
  - Si `isError`: mostrar mensaje de error

- [x] En `SupplierEdit.tsx`: `useQuery({ queryKey: ['supplier', id], ... })`
- [x] En `SupplierForm.tsx` (modo creación): `useMutation(createSupplier)`
- [x] En `SupplierForm.tsx` (modo edición): `useMutation((payload) => updateSupplier(id, payload))`
- [x] En `DeleteSupplierDialog.tsx`: `useMutation(deleteSupplier)` + `queryClient.invalidateQueries(['suppliers'])`

### TanStack Table

- [x] `SupplierColumns.tsx`: `ColumnDef<Supplier>[]` con las 5 columnas descritas arriba
- [x] `SupplierTable.tsx`: `useReactTable` con `manualPagination: true`, `getCoreRowModel()`, `getSortedRowModel()`
- [x] Sorting server-side: al cambiar columna sortable, actualizar `?ordering=name` o `?ordering=-name`
- [x] Paginación: state `{ pageIndex: currentPage - 1, pageSize: 20 }`, botones prev/next actualizan URL

### Formularios

- [x] Zod schema en `SupplierForm.tsx`:
  ```ts
  const schema = z.object({
    name: z.string().min(1, "Requerido"),
    contact_name: z.string().min(1, "Requerido"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(1, "Requerido"),
    address: z.string().min(1, "Requerido"),
  });
  ```
- [x] `defaultValues` en modo edición: pre-poblar desde `supplier` prop
- [x] Mapeo de errores DRF a campos de formulario con `setError`

### Casos borde

- [x] Loading state: skeleton en tabla mientras carga la lista
- [x] Lista vacía: mensaje "No hay proveedores registrados"
- [x] Error 401: interceptor Axios redirige a `/login` automáticamente
- [x] Error en detalle (supplier no encontrado): SupplierEdit muestra mensaje de error
- [x] Email duplicado (DRF 400): mensaje en campo email del formulario
- [x] Confirmación antes de delete: `DeleteSupplierDialog` siempre aparece
- [x] Botón submit deshabilitado durante mutación activa

### Navegación

- [x] Link "Proveedores" en `components/dashboard/Sidebar.tsx` apunta a `/suppliers` — ya existía

## Criterios de aceptación

- [x] Tabla lista con paginación (20 por página), búsqueda por texto y ordenamiento por nombre
- [x] Crear supplier con validación: campos vacíos muestran error inline, email inválido bloqueado
- [x] Editar supplier: formulario pre-poblado con datos existentes
- [x] Eliminar supplier: modal de confirmación, desaparece de la lista (soft delete), toast de éxito
- [x] Manejo de errores DRF: email duplicado muestra mensaje en el campo email
- [x] Estado de carga visible en tabla (skeleton) y en botón submit del formulario
- [x] Toast de éxito/error en todas las operaciones mutación
- [x] Error 401 redirige a `/login` automáticamente vía interceptor
