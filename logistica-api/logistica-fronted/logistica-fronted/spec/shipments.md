# Spec: Shipments

## Información del módulo

- App Next.js: `app/(dashboard)/shipments/`
- Dependencias:
  - `customers` (módulo ya validado — selector de cliente)
  - `warehouses` (módulo ya validado — selector de almacén de origen)
  - `routes` (módulo ya validado — selector de ruta, nullable)
  - `products` (módulo ya validado — selector de producto en AddItemDialog)
- MVP order: #9 (último módulo — todos sus módulos dependientes ya deben estar validados)

## Estado

- [x] Pendiente de aprobación
- [x] Aprobado — listo para implementar
- [x] Implementado
- [x] Validado

---

## API utilizada

### Endpoints de Shipments

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/shipments/` | GET | Bearer | — | `PaginatedResponse<Shipment>` |
| `/shipments/` | POST | Bearer | `ShipmentPayload` | `Shipment` |
| `/shipments/{id}/` | GET | Bearer | — | `Shipment` (incluye `shipment_products[]`) |
| `/shipments/{id}/` | PUT | Bearer | `ShipmentPayload` | `Shipment` |
| `/shipments/{id}/` | PATCH | Bearer | `Partial<ShipmentPayload>` | `Shipment` |
| `/shipments/{id}/` | DELETE | Bearer | — | 204 |

Query params de `GET /shipments/`:
- `?page=N` — paginación (20 items/página)
- `?status=pending|assigned|in_transit|delivered|cancelled`
- `?customer=<id>`
- `?origin_warehouse=<id>`
- `?route=<id>`
- `?search=` — busca en `tracking_number`, `destination_address`
- `?ordering=status|-status|scheduled_delivery_date|-scheduled_delivery_date|created_at|-created_at`

### Endpoints de items anidados

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/shipments/{id}/items/` | GET | Bearer | — | `ShipmentProduct[]` |
| `/shipments/{id}/items/` | POST | Bearer | `ShipmentProductPayload` | `ShipmentProduct` |

Nota: los productos del envío también se incluyen dentro del objeto `Shipment` en la respuesta de `GET /shipments/{id}/` como campo `shipment_products: ShipmentProduct[]`. En la vista de detalle se leerá directamente ese campo; el endpoint `/shipments/{id}/items/` se usa para agregar nuevos productos.

### Dependencias de selectores

| Endpoint | Propósito | Query key |
|----------|-----------|-----------|
| `GET /customers/` | Poblar selector de cliente y resolver nombre en tabla | `['customers-list']` |
| `GET /warehouses/` | Poblar selector de almacén y resolver nombre en tabla | `['warehouses-list']` |
| `GET /routes/` | Poblar selector de ruta (nullable) | `['routes-list']` |
| `GET /products/` | Poblar selector de producto en AddItemDialog | `['products-list']` |

Tipos de `docs/models.ts`:
`Shipment`, `ShipmentPayload`, `ShipmentProduct`, `ShipmentProductPayload`, `ShipmentStatus`,
`Customer`, `Warehouse`, `Route`, `Product`, `PaginatedResponse`

---

## Rutas / páginas

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/shipments` | `app/(dashboard)/shipments/page.tsx` | Server Component | Listado de envíos con tabla y filtros |
| `/shipments/new` | `app/(dashboard)/shipments/new/page.tsx` | Server Component | Formulario de creación |
| `/shipments/[id]` | `app/(dashboard)/shipments/[id]/page.tsx` | Server Component | Edición de envío + panel de productos |

---

## Estructura de archivos

```
lib/
  api/
    shipments.ts

components/
  shipments/
    ShipmentColumns.tsx
    ShipmentTable.tsx          ← 'use client'
    ShipmentForm.tsx           ← 'use client'
    ShipmentEdit.tsx           ← 'use client'
    DeleteShipmentDialog.tsx   ← 'use client'
    ShipmentItemsPanel.tsx     ← 'use client'
    AddItemDialog.tsx          ← 'use client'

app/
  (dashboard)/
    shipments/
      page.tsx
      new/page.tsx
      [id]/page.tsx
```

---

## Tareas

### 1. Setup y tipos

- [x] Verificar que `Shipment`, `ShipmentPayload`, `ShipmentProduct`, `ShipmentProductPayload`, `ShipmentStatus` están re-exportados en `lib/types/index.ts`
- [x] Verificar que `Customer`, `Warehouse`, `Route` y `Product` también están disponibles en `lib/types/index.ts` (necesarios para los selectores)

### 2. API functions — `lib/api/shipments.ts`

- [x] Crear función `getShipments(params?: { page?: string; search?: string; ordering?: string; status?: string; customer?: string; origin_warehouse?: string; route?: string }): Promise<PaginatedResponse<Shipment>>` — usa `apiClient.get('/shipments/', { params })`
- [x] Crear función `getShipment(id: number): Promise<Shipment>` — usa `apiClient.get('/shipments/{id}/')`, la respuesta incluye el campo `shipment_products: ShipmentProduct[]`
- [x] Crear función `createShipment(payload: ShipmentPayload): Promise<Shipment>` — usa `apiClient.post('/shipments/', payload)`
- [x] Crear función `updateShipment(id: number, payload: ShipmentPayload): Promise<Shipment>` — usa `apiClient.put('/shipments/{id}/', payload)`
- [x] Crear función `deleteShipment(id: number): Promise<void>` — usa `apiClient.delete('/shipments/{id}/')`, retorna `void`
- [x] Crear función `getShipmentItems(shipmentId: number): Promise<ShipmentProduct[]>` — usa `apiClient.get('/shipments/{shipmentId}/items/')`
- [x] Crear función `createShipmentItem(shipmentId: number, payload: ShipmentProductPayload): Promise<ShipmentProduct>` — usa `apiClient.post('/shipments/{shipmentId}/items/', payload)`
- [x] Todas las funciones usan `apiClient` de `lib/api/client.ts`, nunca `fetch` ni `axios` directamente

### 3. Componente ShipmentColumns — `components/shipments/ShipmentColumns.tsx`

- [x] Exportar función `getShipmentColumns(customersMap: Map<number, string>): ColumnDef<Shipment>[]`
- [x] Columna `tracking_number` — header "Tracking", no sortable
- [x] Columna `customer` — header "Cliente", no sortable, resolver nombre via `customersMap.get(row.original.customer) ?? String(row.original.customer)`
- [x] Columna `status` — header "Estado", sortable (`enableSorting: true`), Badge con colores:
  - `pending` → variant `outline` + clase `text-gray-600 border-gray-400`
  - `assigned` → variant `outline` + clase `text-blue-600 border-blue-600`
  - `in_transit` → variant `outline` + clase `text-yellow-600 border-yellow-600`
  - `delivered` → variant `outline` + clase `text-green-600 border-green-600`
  - `cancelled` → variant `outline` + clase `text-red-600 border-red-600`
- [x] Columna `destination_address` — header "Destino", no sortable
- [x] Columna `scheduled_delivery_date` — header "Entrega programada", sortable (`enableSorting: true`), mostrar el string `YYYY-MM-DD` directamente; si es `null` mostrar "—"
- [x] Columna `shipping_cost` — header "Costo", no sortable, mostrar el valor string directamente (viene como string del backend, ej. `"150.00"`)
- [x] Columna `actions` — id `"actions"`, header "Acciones", celda con: link a `/shipments/{id}` (Editar) + `<DeleteShipmentDialog id={id} />`

### 4. Componente ShipmentTable — `components/shipments/ShipmentTable.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Leer `page`, `search`, `ordering`, `status` desde `useSearchParams()`
- [x] `useQuery({ queryKey: ['shipments', { page, search, ordering, status }], queryFn: () => getShipments({ page, search, ordering, status }) })` para la lista paginada
- [x] `useQuery({ queryKey: ['customers-list'], queryFn: () => getCustomers(), staleTime: 5 * 60 * 1000 })` — para resolver nombres de cliente
- [x] Construir `customersMap: Map<number, string>` desde customers data: clave = `customer.id`, valor = `customer.name`; inicializar como `new Map()` mientras carga
- [x] Pasar `customersMap` a `getShipmentColumns(customersMap)` para construir las columnas
- [x] `placeholderData: (prev) => prev` en la query de shipments para evitar flash al paginar
- [x] Botones de filtro por `status`: "Todos" | "Pendiente" | "Asignado" | "En tránsito" | "Entregado" | "Cancelado" — al hacer click actualizar `?status=` en la URL via `router.push` con `useRouter()`
- [x] Input de búsqueda con debounce 300ms → actualiza `?search=` en la URL
- [x] TanStack Table con `manualPagination: true`, `manualSorting: true`
- [x] `pageCount: Math.ceil(data.count / 20)`
- [x] `state: { pagination: { pageIndex: Number(page ?? 1) - 1, pageSize: 20 } }`
- [x] Sorting en `status` y `scheduled_delivery_date` → actualiza `?ordering=` en la URL (con `-` para descendente)
- [x] Mostrar skeleton mientras `isLoading`
- [x] Mostrar mensaje "No hay envíos registrados" si `data.results.length === 0`
- [x] Controles de paginación: botón Anterior (deshabilitado si `page === 1`) y Siguiente (deshabilitado si no hay `data.next`)

### 5. Componente DeleteShipmentDialog — `components/shipments/DeleteShipmentDialog.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `id: number`
- [x] shadcn `Dialog` con trigger (botón "Eliminar"), título "Confirmar eliminación", descripción "Esta acción no se puede deshacer"
- [x] `useMutation({ mutationFn: () => deleteShipment(id), onSuccess: ..., onError: ... })`
- [x] `onSuccess`: cerrar dialog + `invalidateQueries({ queryKey: ['shipments'] })` + toast de éxito "Envío eliminado correctamente"
- [x] `onError`: toast de error con el mensaje del backend si disponible
- [x] Botón "Confirmar" con estado loading (`isPending`) y deshabilitado durante mutación
- [x] Botón "Cancelar" cierra el dialog sin hacer nada

### 6. Componente ShipmentForm — `components/shipments/ShipmentForm.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `shipment?: Shipment` (opcional — ausente = modo crear, presente = modo editar)
- [x] `useQuery({ queryKey: ['customers-list'], queryFn: () => getCustomers(), staleTime: 5 * 60 * 1000 })` para poblar el select de cliente
- [x] `useQuery({ queryKey: ['warehouses-list'], queryFn: () => getWarehouses(), staleTime: 5 * 60 * 1000 })` para poblar el select de almacén de origen
- [x] `useQuery({ queryKey: ['routes-list'], queryFn: () => getRoutes(), staleTime: 5 * 60 * 1000 })` para poblar el select de ruta (nullable)
- [x] Mostrar skeleton mientras carga cualquiera de las tres listas
- [x] Campos del formulario con shadcn `Form` (react-hook-form + zod):
  - `customer` — shadcn `Select`, **requerido**: una opción por cliente con texto = `customer.name`, value = `String(customer.id)`; sin opción vacía
  - `origin_warehouse` — shadcn `Select`, **requerido**: una opción por almacén con texto = `warehouse.name`, value = `String(warehouse.id)`; sin opción vacía
  - `route` — shadcn `Select`, **nullable (opcional)**: primera opción = "Sin ruta" con value = `""`, luego una opción por ruta con texto = `route.name`, value = `String(route.id)`
  - `status` — shadcn `Select`, requerido, opciones: "Pendiente" (`pending`), "Asignado" (`assigned`), "En tránsito" (`in_transit`), "Entregado" (`delivered`), "Cancelado" (`cancelled`)
  - `origin_address` — shadcn `Textarea`, requerido
  - `destination_address` — shadcn `Textarea`, requerido
  - `scheduled_delivery_date` — shadcn `Input` type="date", requerido, retorna string `YYYY-MM-DD`
  - `weight_kg` — shadcn `Input` type="number", requerido, step="0.01", min="0.01"
  - `declared_value` — shadcn `Input` type="number", requerido, step="0.01", min="0.01"
  - `shipping_cost` — shadcn `Input` type="number", requerido, step="0.01", min="0.01"
  - `notes` — shadcn `Textarea`, opcional
- [x] `tracking_number` NO aparece en el formulario (lo genera el servidor)
- [x] Zod schema (ver sección Zod schemas — ShipmentForm)
- [x] `defaultValues` en modo edición:
  - `customer`: `String(shipment.customer)`
  - `origin_warehouse`: `String(shipment.origin_warehouse)`
  - `route`: shipment.route !== null ? `String(shipment.route)` : `""`
  - `status`: `shipment.status`
  - `origin_address`: `shipment.origin_address`
  - `destination_address`: `shipment.destination_address`
  - `scheduled_delivery_date`: `shipment.scheduled_delivery_date ?? ""`
  - `weight_kg`: `shipment.weight_kg`
  - `declared_value`: `shipment.declared_value`
  - `shipping_cost`: `shipment.shipping_cost`
  - `notes`: `shipment.notes ?? ""`
- [x] `defaultValues` en modo creación: todos los campos de texto = `""`, `status` = `"pending"`
- [x] Transformación al enviar:
  - `customer: Number(values.customer)`
  - `origin_warehouse: Number(values.origin_warehouse)`
  - `route: values.route === "" ? null : Number(values.route)`
  - `weight_kg: values.weight_kg` (string, se envía directo al backend como string)
  - `declared_value: values.declared_value` (string)
  - `shipping_cost: values.shipping_cost` (string)
  - `scheduled_delivery_date: values.scheduled_delivery_date`
  - `notes: values.notes === "" ? "" : values.notes`
- [x] `useMutation(createShipment)` en modo crear, `useMutation((p) => updateShipment(shipment.id, p))` en modo editar
- [x] `onSuccess` en modo crear: toast "Envío creado correctamente" + `router.push('/shipments')`
- [x] `onSuccess` en modo editar: toast "Envío actualizado correctamente" + `router.push('/shipments')`
- [x] `onError`: mapear errores DRF al campo correspondiente via `form.setError(...)` ; `non_field_errors` → toast de error
- [x] Botón "Guardar" con estado loading durante `isPending`, deshabilitado durante mutación
- [x] Botón "Cancelar" con `router.back()`
- [x] En modo editar, NO renderizar `ShipmentItemsPanel` dentro de este componente — el panel de productos lo renderiza `ShipmentEdit`

### 7. Componente ShipmentEdit — `components/shipments/ShipmentEdit.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `id: number`
- [x] `useQuery({ queryKey: ['shipment', id], queryFn: () => getShipment(id) })` — la respuesta incluye `shipment_products: ShipmentProduct[]`
- [x] Mientras `isLoading`: mostrar skeleton de formulario
- [x] Si `isError` o no hay data: mostrar mensaje "Envío no encontrado" con link "← Volver a envíos"
- [x] Cuando hay data: renderizar `<ShipmentForm shipment={data} />` seguido de `<ShipmentItemsPanel shipmentId={id} items={data.shipment_products} />`
- [x] `ShipmentItemsPanel` se muestra debajo del formulario, separado visualmente (margen o divisor)

### 8. Componente ShipmentItemsPanel — `components/shipments/ShipmentItemsPanel.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `shipmentId: number`, `items: ShipmentProduct[]`
- [x] Mostrar sección con título "Productos del envío" y contador "(N productos)"
- [x] `useQuery({ queryKey: ['products-list'], queryFn: () => getProducts(), staleTime: 5 * 60 * 1000 })` — para resolver nombre del producto en la tabla; construir `productsMap: Map<number, string>` con clave = `product.id`, valor = `product.name`
- [x] Tabla de items usando TanStack Table con columnas:
  - `product` — header "Producto", resolver nombre via `productsMap.get(item.product) ?? String(item.product)`
  - `quantity` — header "Cantidad"
  - `unit_price` — header "Precio unitario", mostrar el string directamente (viene como string del backend)
  - `total` — header "Total", calculado como `(item.quantity * parseFloat(item.unit_price)).toFixed(2)` — columna virtual, no existe en el tipo `ShipmentProduct`
- [x] Mostrar mensaje "Sin productos registrados" si `items.length === 0`
- [x] Botón "+ Agregar producto" que abre `AddItemDialog`
- [x] Estado local `open: boolean` controlado via `useState` para el dialog
- [x] Al cerrar `AddItemDialog` con éxito, la query `['shipment', shipmentId]` ya fue invalidada — el componente padre `ShipmentEdit` se re-renderiza con los items actualizados

### 9. Componente AddItemDialog — `components/shipments/AddItemDialog.tsx` (`'use client'`)

- [x] Declarar `'use client'` al inicio del archivo
- [x] Props: `shipmentId: number`, `open: boolean`, `onClose: () => void`
- [x] shadcn `Dialog` controlado por prop `open`, `onOpenChange` llama a `onClose`
- [x] Título del dialog: "Agregar producto al envío"
- [x] `useQuery({ queryKey: ['products-list'], queryFn: () => getProducts(), staleTime: 5 * 60 * 1000 })` para poblar el select de producto
- [x] Campos del formulario con shadcn `Form` (react-hook-form + zod):
  - `product` — shadcn `Select`, requerido: una opción por producto con texto = `product.name` (y SKU entre paréntesis: `product.name (product.sku)`), value = `String(product.id)`
  - `quantity` — shadcn `Input` type="number", min="1", step="1", requerido
  - `unit_price` — shadcn `Input` type="number", step="0.01", min="0.01", requerido (snapshot del precio — el usuario lo ingresa manualmente para capturar el precio al momento del envío)
- [x] Zod schema (ver sección Zod schemas — AddItem)
- [x] `defaultValues`: `product: ""`, `quantity: ""`, `unit_price: ""`
- [x] Transformación al enviar:
  - `product: Number(values.product)`
  - `quantity: Number(values.quantity)` (entero)
  - `unit_price: values.unit_price` (string — se envía como string al backend)
- [x] `useMutation({ mutationFn: (payload: ShipmentProductPayload) => createShipmentItem(shipmentId, payload) })`
- [x] `onSuccess`: `invalidateQueries({ queryKey: ['shipment', shipmentId] })` + toast "Producto agregado correctamente" + llamar `onClose()` + resetear formulario con `form.reset()`
- [x] `onError`: mapear errores DRF al campo correspondiente; `non_field_errors` → toast de error
- [x] Botón "Agregar" con estado loading durante `isPending`, deshabilitado durante mutación
- [x] Botón "Cancelar" llama a `onClose()` sin hacer nada más
- [x] Mostrar skeleton mientras carga la lista de productos

### 10. Páginas

- [x] `app/(dashboard)/shipments/page.tsx`:
  - Server Component (sin `'use client'`)
  - `searchParams: Promise<{ page?: string; search?: string; ordering?: string; status?: string }>` — usar `await searchParams`
  - Título "Envíos"
  - Link/botón "+ Nuevo Envío" apuntando a `/shipments/new`
  - `<Suspense fallback={<Skeleton />}><ShipmentTable /></Suspense>`

- [x] `app/(dashboard)/shipments/new/page.tsx`:
  - Server Component (sin `'use client'`)
  - Título "Nuevo Envío"
  - Link "← Volver" apuntando a `/shipments`
  - `<ShipmentForm />`

- [x] `app/(dashboard)/shipments/[id]/page.tsx`:
  - Server Component (sin `'use client'`)
  - `params: Promise<{ id: string }>` — obligatorio usar `await params` (Next.js 16 breaking change)
  - `const { id } = await params` — pasar como `Number(id)` a ShipmentEdit
  - Título "Editar Envío"
  - Link "← Volver" apuntando a `/shipments`
  - `<ShipmentEdit id={Number(id)} />`

### 11. TanStack Query hooks

- [x] `useQuery(['shipments', params])` en ShipmentTable — lista paginada con filtros
- [x] `useQuery(['customers-list'])` en ShipmentTable — para construir `customersMap`
- [x] `useQuery(['customers-list'])` en ShipmentForm — comparte caché con el de la tabla
- [x] `useQuery(['warehouses-list'])` en ShipmentForm — comparte caché con módulo warehouses
- [x] `useQuery(['routes-list'])` en ShipmentForm — para poblar el select de ruta
- [x] `useQuery(['shipment', id])` en ShipmentEdit — detalle de un envío, incluye `shipment_products[]`
- [x] `useQuery(['products-list'])` en ShipmentItemsPanel — para construir `productsMap`
- [x] `useQuery(['products-list'])` en AddItemDialog — comparte caché con ShipmentItemsPanel
- [x] `useMutation(createShipment)` en ShipmentForm modo crear
- [x] `useMutation((p) => updateShipment(shipment.id, p))` en ShipmentForm modo editar
- [x] `useMutation(deleteShipment)` + `invalidateQueries({ queryKey: ['shipments'] })` en DeleteShipmentDialog
- [x] `useMutation((payload) => createShipmentItem(shipmentId, payload))` + `invalidateQueries({ queryKey: ['shipment', shipmentId] })` en AddItemDialog

### 12. TanStack Table

- [x] `ColumnDef<Shipment>[]` generado por `getShipmentColumns(customersMap)` — 7 columnas: `tracking_number`, `customer`, `status`, `destination_address`, `scheduled_delivery_date`, `shipping_cost`, `actions`
- [x] `useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true, manualSorting: true, pageCount, state: { pagination, sorting } })` en ShipmentTable
- [x] Sorting habilitado en `status` y `scheduled_delivery_date` — al cambiar sorting state, actualizar `?ordering=` en la URL
- [x] `manualPagination: true` — el backend controla el total de páginas
- [x] Tabla de productos en ShipmentItemsPanel: `ColumnDef<ShipmentProduct>[]` con 4 columnas: `product` (nombre resuelto), `quantity`, `unit_price`, `total` (calculado) — sin paginación, sin sorting manual

### 13. Zod schemas

**ShipmentForm schema:**

```ts
z.object({
  customer: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  route: z.string(),
  status: z.enum(["pending", "assigned", "in_transit", "delivered", "cancelled"]),
  origin_address: z.string().min(1, "Requerido"),
  destination_address: z.string().min(1, "Requerido"),
  scheduled_delivery_date: z.string().min(1, "Requerido"),
  weight_kg: z.string().min(1, "Requerido"),
  declared_value: z.string().min(1, "Requerido"),
  shipping_cost: z.string().min(1, "Requerido"),
  notes: z.string(),
})
```

- [x] `customer`: `z.string().min(1, "Requerido")` — el select retorna string, se convierte a `Number()` antes de enviar
- [x] `origin_warehouse`: `z.string().min(1, "Requerido")` — ídem conversión a `Number()`
- [x] `route`: `z.string()` — sin validación de mínimo; `""` significa null; se convierte a `null` o `Number()` antes de enviar
- [x] `status`: `z.enum(["pending", "assigned", "in_transit", "delivered", "cancelled"])`
- [x] `origin_address`: `z.string().min(1, "Requerido")`
- [x] `destination_address`: `z.string().min(1, "Requerido")`
- [x] `scheduled_delivery_date`: `z.string().min(1, "Requerido")` — el input type="date" retorna string `YYYY-MM-DD`, se envía directamente sin conversión
- [x] `weight_kg`: `z.string().min(1, "Requerido")` — los campos decimales se envían como string al backend (no convertir a number)
- [x] `declared_value`: `z.string().min(1, "Requerido")` — ídem
- [x] `shipping_cost`: `z.string().min(1, "Requerido")` — ídem
- [x] `notes`: `z.string()` — sin validación de mínimo, puede ser `""`
- [x] Al hacer submit:
  ```ts
  const payload: ShipmentPayload = {
    ...values,
    customer: Number(values.customer),
    origin_warehouse: Number(values.origin_warehouse),
    route: values.route === "" ? null : Number(values.route),
  }
  ```

**AddItem schema:**

```ts
z.object({
  product: z.string().min(1, "Requerido"),
  quantity: z.coerce.number().int().positive("Debe ser mayor a 0"),
  unit_price: z.string().min(1, "Requerido"),
})
```

- [x] `product`: `z.string().min(1, "Requerido")` — el select retorna string, se convierte a `Number()` antes de enviar
- [x] `quantity`: `z.coerce.number().int().positive("Debe ser mayor a 0")` — `coerce` convierte el string del input a number automáticamente; debe ser entero positivo
- [x] `unit_price`: `z.string().min(1, "Requerido")` — se envía como string al backend (campo DecimalField)
- [x] Al hacer submit:
  ```ts
  const payload: ShipmentProductPayload = {
    product: Number(values.product),
    quantity: values.quantity,   // ya es number por z.coerce
    unit_price: values.unit_price,
  }
  ```

### 14. Casos borde

- [x] Skeleton en ShipmentTable mientras `isLoading` de shipments o customers-list
- [x] Skeleton en ShipmentForm mientras carga customers-list, warehouses-list o routes-list
- [x] Skeleton en AddItemDialog mientras carga products-list
- [x] Lista vacía en ShipmentTable: mostrar mensaje "No hay envíos registrados"
- [x] Items vacíos en ShipmentItemsPanel: mostrar mensaje "Sin productos registrados"
- [x] Envío no encontrado en `/shipments/[id]`: mensaje "Envío no encontrado" con link "← Volver a envíos"
- [x] Error 401: gestionado por el interceptor de Axios en `lib/api/client.ts` — no requiere lógica adicional
- [x] `route` enviado como `null` cuando el select queda en "Sin ruta" (`""`)
- [x] `scheduled_delivery_date` enviado como string `YYYY-MM-DD`; si viene `null` del backend en modo edición, el input muestra `""`
- [x] `weight_kg`, `declared_value`, `shipping_cost`, `unit_price` en ShipmentProduct: todos son `string` — no convertir a `number` excepto para la columna `total` calculada en la tabla (usar `parseFloat()` solo ahí)
- [x] Columna `total` en tabla de productos: `(item.quantity * parseFloat(item.unit_price)).toFixed(2)` — si `unit_price` no es parseable, mostrar "—"
- [x] `tracking_number` es read-only — no aparece en el formulario, solo en la tabla del listado y en la vista de detalle (como campo informativo)
- [x] `shipping_cost` es calculado por el backend — aparece en el formulario como campo editable según `docs/mvp.md` (el MVP lo incluye), pero no se genera automáticamente en el frontend
- [x] Filtro por `status` con estado visual activo (variante de botón diferente cuando el filtro está aplicado)
- [x] Botón submit del ShipmentForm deshabilitado durante `isPending` de la mutación
- [x] Botón "Agregar" del AddItemDialog deshabilitado durante `isPending` de la mutación
- [x] Confirmación antes de eliminar envío (DeleteShipmentDialog)
- [x] Al agregar un producto con éxito, el AddItemDialog se cierra, el formulario se resetea, y la lista de productos en ShipmentItemsPanel se actualiza automáticamente vía invalidación de `['shipment', shipmentId]`
- [x] `customersMap` construido como `new Map()` vacío mientras la query de customers-list carga, para no bloquear el render de la tabla
- [x] `productsMap` construido como `new Map()` vacío mientras la query de products-list carga, para no bloquear el render del panel de items

### 15. Navegación

- [x] Verificar que el Sidebar ya incluye el link "Envíos" apuntando a `/shipments` (ya existe en `components/dashboard/Sidebar.tsx` con icono `ShoppingBag`) — no requiere cambios

---

## Criterios de aceptación

- [x] Tabla de envíos con paginación, búsqueda por tracking_number/destination_address, filtro por status, ordenamiento por scheduled_delivery_date y status
- [x] Badge de estado con color: pending=gris, assigned=azul, in_transit=amarillo, delivered=verde, cancelled=rojo
- [x] Columna "Cliente" resuelve el nombre desde la lista de customers
- [x] Columna "Entrega programada" muestra string `YYYY-MM-DD` o "—" si es null
- [x] Columna "Costo" muestra el string directamente (sin conversión de tipo)
- [x] Formulario de envío con selectores de customer (requerido), origin_warehouse (requerido) y route (nullable con opción "Sin ruta"), todos poblados desde la API
- [x] `tracking_number` no aparece en el formulario de creación/edición
- [x] `customer` y `origin_warehouse` se envían como `number` al backend; `route` se envía como `number` o `null`
- [x] `weight_kg`, `declared_value`, `shipping_cost` se envían como `string` al backend
- [x] Vista de edición muestra el ShipmentForm con los datos actuales y el ShipmentItemsPanel debajo
- [x] ShipmentItemsPanel muestra los productos del envío con columnas: Producto (nombre), Cantidad, Precio unitario, Total (calculado)
- [x] Columna "Total" calcula `quantity × unit_price` con `parseFloat` solo para aritmética
- [x] Agregar producto desde el ShipmentItemsPanel via AddItemDialog — formulario con los 3 campos: product (select con nombre+SKU), quantity (entero), unit_price (string)
- [x] `unit_price` en AddItemDialog se envía como `string` al backend
- [x] CRUD completo de envío con validaciones Zod, errores DRF mapeados a campos, toasts éxito/error
- [x] Eliminación de envío con modal de confirmación (DeleteShipmentDialog)
- [x] Loading skeletons en tabla, formulario de envío y AddItemDialog
- [x] `await params` en `[id]/page.tsx` (patrón Next.js 16 obligatorio)
- [x] Sidebar ya tiene el link "Envíos" — no requiere modificaciones
