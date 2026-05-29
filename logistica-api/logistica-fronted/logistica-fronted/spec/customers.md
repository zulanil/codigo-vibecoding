# Spec: Customers

## API utilizada

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/customers/` | GET | Bearer | — | `PaginatedResponse<Customer>` |
| `/customers/` | POST | Bearer | `CustomerPayload` | `Customer` |
| `/customers/{id}/` | GET | Bearer | — | `Customer` |
| `/customers/{id}/` | PUT | Bearer | `CustomerPayload` | `Customer` |
| `/customers/{id}/` | PATCH | Bearer | `Partial<CustomerPayload>` | `Customer` |
| `/customers/{id}/` | DELETE | Bearer | — | 204 |

Query params: `?page=N` · `?customer_type=individual|company` · `?search=` (name, email, company_name) · `?ordering=name|-name|created_at|-created_at`

Tipos de `docs/models.ts`: `Customer`, `CustomerPayload`, `CustomerType`, `PaginatedResponse`

## Rutas/páginas

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/customers` | `app/(dashboard)/customers/page.tsx` | Server Component | Listado paginado con tabla |
| `/customers/new` | `app/(dashboard)/customers/new/page.tsx` | Server Component | Renderiza `<CustomerForm />` para crear |
| `/customers/[id]` | `app/(dashboard)/customers/[id]/page.tsx` | Server Component | Renderiza `<CustomerEdit id={...} />` para editar |

## Estructura de archivos

```
lib/
  api/
    customers.ts

components/
  customers/
    CustomerTable.tsx        ← 'use client'
    CustomerForm.tsx         ← 'use client'
    CustomerColumns.tsx
    DeleteCustomerDialog.tsx ← 'use client'
    CustomerEdit.tsx         ← 'use client'

app/
  (dashboard)/
    customers/
      page.tsx
      new/page.tsx
      [id]/page.tsx
```

## Tareas

### Setup y tipos

- [x] Verificar que `Customer`, `CustomerPayload`, `CustomerType` están re-exportados en `lib/types/index.ts`
- [x] Crear `lib/api/customers.ts` con funciones tipadas:
  - `getCustomers(params?: { page?: string; search?: string; ordering?: string; customer_type?: string }): Promise<PaginatedResponse<Customer>>`
  - `getCustomer(id: number): Promise<Customer>`
  - `createCustomer(payload: CustomerPayload): Promise<Customer>`
  - `updateCustomer(id: number, payload: CustomerPayload): Promise<Customer>`
  - `deleteCustomer(id: number): Promise<void>`

### Componentes

- [x] Crear `components/customers/CustomerColumns.tsx`:
  - Columna `name` — sortable, header "Nombre"
  - Columna `company_name` — header "Empresa"
  - Columna `customer_type` — header "Tipo", renderiza shadcn `Badge`:
    - `individual` → variant `secondary`, texto "Individual"
    - `company` → variant `default`, texto "Empresa"
  - Columna `email` — header "Email"
  - Columna `phone` — header "Teléfono"
  - Columna `actions` — link Editar + botón Eliminar

- [x] Crear `components/customers/CustomerTable.tsx` (`'use client'`):
  - `useSearchParams()` para leer `page`, `search`, `ordering`, `customer_type`
  - `useQuery({ queryKey: ['customers', { page, search, ordering, customer_type }] })`
  - `placeholderData: (prev) => prev`
  - TanStack Table `manualPagination: true`, `manualSorting: true`
  - Input búsqueda con debounce 300ms → `?search=`
  - Botones de filtro por tipo: "Todos" | "Individual" | "Empresa" que actualizan `?customer_type=`
  - Sorting en columna `name` → `?ordering=`
  - Paginación prev/next
  - Skeleton loading (5 filas), mensaje vacío
  - shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`

- [x] Crear `components/customers/DeleteCustomerDialog.tsx` (`'use client'`):
  - shadcn `Dialog`, mensaje con nombre del cliente
  - `useMutation(deleteCustomer)` + `invalidateQueries(['customers'])` en onSuccess
  - Toast éxito/error, loading state en botón

- [x] Crear `components/customers/CustomerForm.tsx` (`'use client'`):
  - Props: `customer?: Customer`
  - Zod schema + react-hook-form + zodResolver
  - Campos:
    - `name` — Input, requerido
    - `company_name` — Input, opcional
    - `customer_type` — botones radio o select nativo: `individual` | `company`, requerido
    - `email` — Input type="email", requerido
    - `phone` — Input, requerido
    - `address` — Textarea, requerido
  - `user` se omite del formulario (FK interna, no expuesta al usuario)
  - `useMutation` create o update según modo
  - onSuccess: toast + `router.push('/customers')`
  - onError: mapear errores DRF a campos con `setError`
  - Botón submit con loading + botón Cancelar

- [x] Crear `components/customers/CustomerEdit.tsx` (`'use client'`):
  - `useQuery(['customer', id])` → skeleton → error → `<CustomerForm customer={data} />`

### Páginas

- [x] Crear `app/(dashboard)/customers/page.tsx` (Server Component):
  - Título "Clientes"
  - Link "+ Nuevo Cliente" con `buttonVariants()`
  - `<Suspense>` wrapeando `<CustomerTable />`

- [x] Crear `app/(dashboard)/customers/new/page.tsx` (Server Component):
  - Título "Nuevo Cliente", back link → `/customers`
  - `<CustomerForm />`

- [x] Crear `app/(dashboard)/customers/[id]/page.tsx` (Server Component):
  - `await params`, título "Editar Cliente"
  - Back link → `/customers`
  - `<CustomerEdit id={Number(id)} />`

### TanStack Query hooks

- [x] `useQuery(['customers', { page, search, ordering, customer_type }])` en CustomerTable
- [x] `useQuery(['customer', id])` en CustomerEdit
- [x] `useMutation(createCustomer)` / `useMutation((p) => updateCustomer(id, p))` en CustomerForm
- [x] `useMutation(deleteCustomer)` + `invalidateQueries(['customers'])` en DeleteCustomerDialog

### TanStack Table

- [x] `ColumnDef<Customer>[]` con 6 columnas (name, company_name, customer_type, email, phone, actions)
- [x] `useReactTable` con `manualPagination: true`, `manualSorting: true`
- [x] Badge en columna `customer_type`
- [x] Sorting en `name` actualiza `?ordering=`

### Formularios

- [x] Zod schema:
  ```ts
  z.object({
    name: z.string().min(1, "Requerido"),
    company_name: z.string().optional().default(""),
    customer_type: z.enum(["individual", "company"], { message: "Requerido" }),
    email: z.string().email("Email inválido"),
    phone: z.string().min(1, "Requerido"),
    address: z.string().min(1, "Requerido"),
  })
  ```
- [x] `user` se envía como `null` al crear (backend acepta null)
- [x] `defaultValues` en modo edición desde `customer` prop
- [x] Mapeo errores DRF → `setError`

### Casos borde

- [x] Loading skeleton en tabla
- [x] Lista vacía: "No hay clientes registrados"
- [x] Error 401: interceptor Axios
- [x] Cliente no encontrado: CustomerEdit muestra error
- [x] Filtro por tipo: botones "Todos / Individual / Empresa" con estado activo visual
- [x] Confirmación antes de delete
- [x] Botón submit deshabilitado durante mutación

### Navegación

- [x] Link "Clientes" en Sidebar apunta a `/customers` — ya existe

## Criterios de aceptación

- [x] Tabla con paginación, búsqueda, filtro por tipo y ordenamiento
- [x] Badge de tipo (individual/empresa) en tabla
- [x] Crear cliente con validación
- [x] Editar cliente con formulario pre-poblado
- [x] Eliminar con modal de confirmación y toast
- [x] Errores DRF en formulario
- [x] Loading skeleton, toasts éxito/error
