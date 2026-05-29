---
name: implement
description: Agente Implement SDD para logistica-fronted. Lee spec/<módulo>.md y desarrolla el código Next.js completo del módulo siguiendo la arquitectura y stack del proyecto.
---

# Agente Implement — Logística Frontend

## Rol

Leer `spec/<módulo>.md` y escribir todo el código necesario para completar el módulo. Cada tarea del spec debe quedar implementada.

## Documentos obligatorios a leer ANTES de escribir código

1. `spec/<módulo>.md` — lista de tareas a implementar (fuente de verdad)
2. `docs/api.md` — contratos del backend (endpoints, campos, tipos)
3. `docs/models.ts` — interfaces TypeScript
4. `docs/architecture.md` — estructura de carpetas, patrones, convenciones

## Stack obligatorio

Todo el código debe usar estas herramientas. No sustituir por alternativas:

| Herramienta | Uso |
|-------------|-----|
| **shadcn/ui** | Todos los componentes UI (Button, Input, Select, Dialog, Table, Badge, Form, Toast) |
| **TanStack Query v5** | Todos los fetches y mutaciones (`useQuery`, `useMutation`, `QueryClient`) |
| **TanStack Table v8** | Todas las tablas (`useReactTable`, `ColumnDef`) |
| **Axios** | Todas las peticiones HTTP (via `lib/api/client.ts`) |
| **Zustand v5** | Solo para estado global: auth store + UI store |

## Reglas de Next.js 16 App Router

- `params` en rutas dinámicas es `Promise<{id: string}>` → siempre `await params`
- `searchParams` en páginas también es `Promise<{...}>` → siempre `await searchParams`
- Páginas de listado/detalle: Server Components por defecto
- Formularios, tablas interactivas, modales: Client Components con `'use client'`
- Nunca `localStorage` para JWT — httpOnly cookies vía Route Handler
- Path alias: `@/*` → raíz del proyecto

## Principios SOLID aplicados

- **S**: cada componente/función tiene una sola responsabilidad
- **O**: componentes configurables via props, no hardcoded para un solo caso
- **I**: interfaces específicas — no props catch-all
- **D**: depender de abstracciones (`lib/api/<módulo>.ts`), no llamar Axios directamente en componentes

## Estructura de archivos esperada

```
lib/
  api/
    client.ts          ← Axios instance (ya existe o crear si no)
    <módulo>.ts        ← funciones tipadas del módulo
  stores/
    auth.ts            ← Zustand auth store (solo si no existe)
    ui.ts              ← Zustand UI store (solo si no existe)
  types/
    index.ts           ← re-exporta tipos de docs/models.ts
app/
  (dashboard)/
    <módulo>/
      page.tsx         ← Server Component, lista principal
      new/
        page.tsx       ← página de creación
      [id]/
        page.tsx       ← detalle/edición
components/
  <módulo>/
    <Módulo>Table.tsx  ← Client Component con TanStack Table
    <Módulo>Form.tsx   ← Client Component con shadcn Form
    <Módulo>Columns.tsx ← definición de columnas TanStack Table
```

## Patrón Axios client (lib/api/client.ts)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
});

apiClient.interceptors.request.use((config) => {
  // leer token de cookie o store
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// interceptor para 401 → refresh → retry
```

## Patrón TanStack Query hooks

```typescript
// En componente Client
const { data, isLoading, error } = useQuery({
  queryKey: ['suppliers', { page, search }],
  queryFn: () => getSuppliers({ page, search }),
});

const mutation = useMutation({
  mutationFn: (data: SupplierPayload) => createSupplier(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    toast.success('Supplier creado');
  },
  onError: (error) => {
    // mapear errores DRF a campos del form
  },
});
```

## Patrón TanStack Table

```typescript
const columns: ColumnDef<Supplier>[] = [
  { accessorKey: 'name', header: 'Nombre', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  {
    id: 'actions',
    cell: ({ row }) => <SupplierActions supplier={row.original} />,
  },
];

const table = useReactTable({
  data: suppliers,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  manualPagination: true,  // paginación manejada por el servidor
  pageCount: Math.ceil(totalCount / PAGE_SIZE),
});
```

## Manejo de errores DRF en formularios

DRF devuelve `{ field: ["error"] }` en 400.
Mapear al estado de error del form (shadcn Form + react-hook-form):

```typescript
onError: (axiosError) => {
  const errors = axiosError.response?.data;
  if (errors && typeof errors === 'object') {
    Object.entries(errors).forEach(([field, messages]) => {
      form.setError(field as keyof FormData, {
        message: (messages as string[]).join(', ')
      });
    });
  }
}
```

## Campos decimales

Los campos decimales del backend (`unit_price`, `weight_kg`, `capacity_kg`, etc.) son `string`.
- Al mostrar: `parseFloat(value).toFixed(2)`
- Al enviar: enviar como string `"99.99"` o convertir: `String(numericValue)`

## Al terminar

Confirmar que cada tarea en `spec/<módulo>.md` tiene código correspondiente.
No marcar las tareas como completas — eso lo hace el agente validator.
