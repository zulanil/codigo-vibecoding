# Spec: Products

## API utilizada

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/products/` | GET | Bearer | — | `PaginatedResponse<Product>` |
| `/products/` | POST | Bearer | `ProductPayload` | `Product` |
| `/products/{id}/` | GET | Bearer | — | `Product` |
| `/products/{id}/` | PUT | Bearer | `ProductPayload` | `Product` |
| `/products/{id}/` | PATCH | Bearer | `Partial<ProductPayload>` | `Product` |
| `/products/{id}/` | DELETE | Bearer | — | 204 |

Query params: `?page=N` · `?supplier=<id>` · `?search=` (name, sku, description) · `?ordering=name|-name|sku|-sku|unit_price|-unit_price|created_at|-created_at`

Dependencia: también usa `/suppliers/` para poblar el selector y resolver nombres en tabla.

Tipos de `docs/models.ts`: `Product`, `ProductPayload`, `PaginatedResponse`, `Supplier`

## Rutas/páginas

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/products` | `app/(dashboard)/products/page.tsx` | Server Component | Listado con tabla |
| `/products/new` | `app/(dashboard)/products/new/page.tsx` | Server Component | Formulario de creación |
| `/products/[id]` | `app/(dashboard)/products/[id]/page.tsx` | Server Component | Wrapper para edición |

## Estructura de archivos

```
lib/
  api/
    products.ts

components/
  products/
    ProductTable.tsx         ← 'use client'
    ProductForm.tsx          ← 'use client'
    ProductColumns.tsx
    DeleteProductDialog.tsx  ← 'use client'
    ProductEdit.tsx          ← 'use client'

app/
  (dashboard)/
    products/
      page.tsx
      new/page.tsx
      [id]/page.tsx
```

## Tareas

### Setup y dependencias shadcn

- [x] Instalar componente shadcn `select`: `npx shadcn@latest add select`
- [x] Verificar que `Product`, `ProductPayload` están re-exportados en `lib/types/index.ts`

### API functions

- [x] Crear `lib/api/products.ts` con funciones tipadas:
  - `getProducts(params?: { page?: string; search?: string; ordering?: string; supplier?: string }): Promise<PaginatedResponse<Product>>`
  - `getProduct(id: number): Promise<Product>`
  - `createProduct(payload: ProductPayload): Promise<Product>`
  - `updateProduct(id: number, payload: ProductPayload): Promise<Product>`
  - `deleteProduct(id: number): Promise<void>`

### Componentes

- [x] Crear `components/products/ProductColumns.tsx`:
  - Columna `sku` — sortable, header "SKU"
  - Columna `name` — sortable, header "Nombre"
  - Columna `supplier` — header "Proveedor", recibe `suppliersMap: Map<number, string>` para resolver nombre desde ID
  - Columna `weight_kg` — header "Peso (kg)"
  - Columna `unit_price` — sortable, header "Precio"
  - Columna `actions` — link Editar + botón Eliminar

- [x] Crear `components/products/ProductTable.tsx` (`'use client'`):
  - `useSearchParams()` para `page`, `search`, `ordering`, `supplier`
  - `useQuery({ queryKey: ['products', { page, search, ordering, supplier }] })` para productos
  - `useQuery({ queryKey: ['suppliers-list'] }, () => getSuppliers())` para resolver nombres de proveedores (primera página, suficiente para selector y tabla)
  - Construir `suppliersMap: Map<number, string>` desde suppliers data para columna Proveedor
  - `placeholderData: (prev) => prev`
  - TanStack Table `manualPagination: true`, `manualSorting: true`
  - Input búsqueda con debounce 300ms → `?search=`
  - Select nativo de shadcn para filtrar por proveedor → `?supplier=<id>`
  - Sorting en `sku`, `name`, `unit_price` → `?ordering=`
  - Paginación prev/next, skeleton, mensaje vacío

- [x] Crear `components/products/DeleteProductDialog.tsx` (`'use client'`):
  - shadcn Dialog, `useMutation(deleteProduct)` + `invalidateQueries(['products'])`
  - Toast éxito/error, loading state

- [x] Crear `components/products/ProductForm.tsx` (`'use client'`):
  - Props: `product?: Product`
  - `useQuery({ queryKey: ['suppliers-list'] })` para poblar el select de proveedor
  - shadcn `Select` para campo `supplier` (id numérico)
  - Campos:
    - `supplier` — shadcn Select, requerido
    - `name` — Input, requerido
    - `sku` — Input, requerido
    - `description` — Textarea, opcional
    - `weight_kg` — Input type="number", requerido, > 0, enviado como string
    - `length_cm` — Input type="number", requerido, > 0, enviado como string
    - `width_cm` — Input type="number", requerido, > 0, enviado como string
    - `height_cm` — Input type="number", requerido, > 0, enviado como string
    - `unit_price` — Input type="number", requerido, > 0, enviado como string
  - Todos los campos decimales: `z.string().min(1).refine(v => parseFloat(v) > 0, "Debe ser > 0")`
  - `supplier` en zod: `z.string().min(1)` (el select retorna string, se convierte a number al enviar)
  - `useMutation` create/update según modo
  - onSuccess: toast + `router.push('/products')`
  - onError: errores DRF → `setError`, `non_field_errors` → toast
  - Botón submit con loading + Cancelar

- [x] Crear `components/products/ProductEdit.tsx` (`'use client'`):
  - `useQuery(['product', id])` → skeleton → error → `<ProductForm product={data} />`

### Páginas

- [x] `app/(dashboard)/products/page.tsx`: título "Productos", link "+ Nuevo Producto", Suspense + `<ProductTable />`
- [x] `app/(dashboard)/products/new/page.tsx`: título "Nuevo Producto", back link, `<ProductForm />`
- [x] `app/(dashboard)/products/[id]/page.tsx`: `await params`, título "Editar Producto", `<ProductEdit id={...} />`

### TanStack Query hooks

- [x] `useQuery(['products', params])` en ProductTable
- [x] `useQuery(['suppliers-list'])` en ProductTable (para nombres) y en ProductForm (para selector)
- [x] `useQuery(['product', id])` en ProductEdit
- [x] `useMutation(createProduct)` / `useMutation((p) => updateProduct(id, p))` en ProductForm
- [x] `useMutation(deleteProduct)` + `invalidateQueries(['products'])` en DeleteProductDialog

### TanStack Table

- [x] `ColumnDef<Product>[]` con 6 columnas
- [x] Columna supplier resuelve nombre via `suppliersMap` pasado como parámetro a `getProductColumns`
- [x] `useReactTable` con `manualPagination: true`, `manualSorting: true`
- [x] Sorting en `sku`, `name`, `unit_price`

### Formularios

- [x] Zod schema:
  ```ts
  z.object({
    supplier: z.string().min(1, "Requerido"),
    name: z.string().min(1, "Requerido"),
    sku: z.string().min(1, "Requerido"),
    description: z.string(),
    weight_kg: z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser > 0"),
    length_cm: z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser > 0"),
    width_cm: z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser > 0"),
    height_cm: z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser > 0"),
    unit_price: z.string().min(1, "Requerido").refine(v => parseFloat(v) > 0, "Debe ser > 0"),
  })
  ```
- [x] Al enviar al backend: convertir `supplier` de string a number (`Number(values.supplier)`)
- [x] `defaultValues` en modo edición: `supplier` como `String(product.supplier)`
- [x] Mapeo errores DRF → `setError`

### Casos borde

- [x] Skeleton en tabla y en formulario mientras carga suppliers
- [x] Lista vacía: "No hay productos registrados"
- [x] Error 401: interceptor Axios
- [x] SKU duplicado (DRF 400) → mensaje en campo sku
- [x] Confirmación antes de delete
- [x] Botón submit deshabilitado durante mutación

### Navegación

- [x] Link "Productos" en Sidebar apunta a `/products` — ya existe

## Criterios de aceptación

- [x] Tabla con paginación, búsqueda, filtro por proveedor y ordenamiento
- [x] Nombre del proveedor visible en tabla (resuelto desde suppliers data)
- [x] Select de proveedor en formulario poblado desde API
- [x] CRUD completo con todos los campos decimales como string
- [x] SKU duplicado muestra mensaje en campo
- [x] Loading skeleton, toasts éxito/error, confirmación delete
