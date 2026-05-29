# Arquitectura Frontend — Logística

## Stack (versiones fijas)

| Tecnología | Versión | Rol |
|------------|---------|-----|
| Next.js | 16.2.6 | Framework — App Router únicamente |
| React | 19.2.4 | |
| TypeScript | 5 | strict mode activo |
| Tailwind CSS | 4 | Estilos — sin tailwind.config.js |
| shadcn/ui | latest | Componentes UI (Button, Input, Select, Dialog, Table, Badge, Form, Toast) |
| @tanstack/react-query | 5.x | Server state — fetch, cache, mutaciones |
| @tanstack/react-table | 8.x | Todas las tablas del proyecto |
| Axios | 1.x | HTTP client — reemplaza native fetch |
| Zustand | 5.x | Client state — auth session + UI state (modales, etc.) |

### Separación de estado

| Estado | Herramienta | Ejemplos |
|--------|-------------|----------|
| Server state | TanStack Query | Listas de suppliers, datos de un shipment, resultados de búsqueda |
| Client state | Zustand | Token JWT, isAuthenticated, modal abierto, filtros persistentes |
| Form state | react-hook-form (via shadcn Form) | Inputs, validaciones inline |
| UI local | React useState | Toggles simples dentro de un componente |

**Regla:** No usar `useState` para datos que vienen del servidor. No usar TanStack Query para estado de UI.

## Diferencias críticas respecto a versiones anteriores

### Next.js 16
- **`params` en rutas dinámicas es una Promise**: `Promise<{ id: string }>`. Siempre usar `await params`.
  ```typescript
  // CORRECTO
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }

  // MAL — patrón de versiones anteriores
  export default function Page({ params }: { params: { id: string } }) {
    const { id } = params; // error en Next.js 16
  }
  ```
- Consultar `node_modules/next/dist/docs/` ante cualquier duda sobre el API de Next.js 16.

### Tailwind v4
- **No existe `tailwind.config.js`**. El archivo habría sido ignorado igualmente.
- Tokens personalizados van dentro del bloque `@theme {}` en `app/globals.css`:
  ```css
  @import "tailwindcss";

  @theme {
    --color-brand: #0070f3;
    --font-sans: "Inter", sans-serif;
  }
  ```
- Ya hay variables `--color-background` y `--color-foreground` definidas en `globals.css`.

---

## Estructura de carpetas (objetivo)

```
logistica-fronted/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx          ← layout sin navbar (centrado)
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← layout con sidebar de navegación
│   │   ├── suppliers/
│   │   │   ├── page.tsx        ← listado
│   │   │   ├── new/page.tsx    ← formulario de creación
│   │   │   └── [id]/page.tsx   ← detalle + edición
│   │   ├── warehouses/         ← misma estructura
│   │   ├── customers/
│   │   ├── products/
│   │   ├── drivers/
│   │   ├── transports/
│   │   ├── routes/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── stops/page.tsx   ← paradas anidadas
│   │   └── shipments/
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── items/page.tsx   ← productos del envío
│   ├── globals.css
│   ├── layout.tsx              ← root layout (fonts, metadata)
│   └── page.tsx                ← redirect a /login o dashboard
├── lib/
│   ├── api/
│   │   ├── client.ts           ← fetch wrapper base (auth header + refresh)
│   │   ├── auth.ts             ← obtener/renovar tokens
│   │   ├── suppliers.ts
│   │   ├── warehouses.ts
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   ├── drivers.ts
│   │   ├── transports.ts
│   │   ├── routes.ts
│   │   └── shipments.ts
│   └── types/
│       └── index.ts            ← re-exporta interfaces de docs/models.ts
├── components/
│   ├── ui/                     ← primitivos genéricos (Button, Input, Table, Badge, Modal)
│   ├── suppliers/              ← componentes de feature
│   ├── warehouses/
│   ├── customers/
│   ├── products/
│   ├── drivers/
│   ├── transports/
│   ├── routes/
│   └── shipments/
├── spec/                       ← archivos SDD generados (no editar manualmente)
└── docs/                       ← esta documentación
```

---

## Reglas Server Component vs Client Component

| Caso | Tipo | Razón |
|------|------|-------|
| Página de listado | Server Component | fetch directo, sin estado interactivo |
| Página de detalle | Server Component | idem |
| Formulario (crear/editar) | Client Component (`'use client'`) | necesita estado y eventos |
| Modal de confirmación (delete) | Client Component | interacción usuario |
| Input de búsqueda con debounce | Client Component | estado local |
| Sidebar de navegación | Client Component | tracking de ruta activa |

**Regla de oro:** empezar como Server Component. Agregar `'use client'` solo cuando se necesite estado, efectos, o event handlers.

### Datos en Server Components

```typescript
// app/(dashboard)/suppliers/page.tsx — Server Component
import { getSuppliers } from '@/lib/api/suppliers';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page, search } = await searchParams;
  const data = await getSuppliers({ page: page ?? '1', search });
  return <SupplierList data={data} />;
}
```

---

## JWT Storage

**Estrategia: httpOnly cookies via Route Handler (BFF pattern)**

- El cliente llama a `/api/auth/login` (Next.js Route Handler).
- El Route Handler llama a `POST /api/v1/auth/token/` del backend.
- El Route Handler setea una cookie httpOnly con el token.
- Las Server Actions y Server Components leen la cookie via `cookies()` de Next.js.
- **Nunca** guardar JWT en `localStorage` — no accesible desde Server Components y expuesto a XSS.

---

## Variables de entorno

| Variable | Acceso | Uso |
|----------|--------|-----|
| `API_BASE_URL` | Solo servidor | fetch desde Server Components / Route Handlers |
| `NEXT_PUBLIC_API_BASE_URL` | Servidor + browser | Axios desde Client Components |

---

## Path alias

`@/*` → raíz del proyecto (ya configurado en `tsconfig.json`).

```typescript
import { getSuppliers } from '@/lib/api/suppliers';
import { Button } from '@/components/ui/button';  // shadcn usa lowercase
```

---

## Patrón: Axios client (lib/api/client.ts)

Instancia centralizada de Axios con interceptores para auth y refresh automático:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// request: inyectar Bearer token
apiClient.interceptors.request.use((config) => {
  const token = getAccessTokenFromCookieOrStore();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// response: 401 → intentar refresh → reintentar → redirect a login
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // refresh logic aquí
    }
    return Promise.reject(error);
  }
);
```

**Todas las funciones en `lib/api/*.ts` usan `apiClient`, no `fetch` ni `axios` directamente.**

---

## Patrón: TanStack Query setup

`QueryClientProvider` va en el root layout (Client Component wrapper):

```typescript
// app/providers.tsx  ← 'use client'
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

```typescript
// app/layout.tsx  ← envuelve con Providers
import { Providers } from './providers';
// ...
<body><Providers>{children}</Providers></body>
```

---

## Patrón: Zustand stores

```
lib/stores/
  auth.ts    ← token, isAuthenticated, logout()
  ui.ts      ← modales abiertos, confirmaciones pendientes
```

Solo accesibles desde Client Components (`'use client'`).

```typescript
// lib/stores/auth.ts
import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  logout: () => {
    // limpiar cookies + redirect
    set({ isAuthenticated: false });
  },
}));
```

---

## Patrón: TanStack Table con paginación server-side

```typescript
// components/<módulo>/<Módulo>Table.tsx  ← 'use client'
import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Supplier>[] = [
  { accessorKey: 'name', header: 'Nombre', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  { id: 'actions', cell: ({ row }) => <Actions item={row.original} /> },
];

// manualPagination: true — el servidor controla las páginas
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  pageCount: Math.ceil(totalCount / 20),
  state: { pagination: { pageIndex: page - 1, pageSize: 20 } },
});
```

---

## shadcn/ui — reglas

- Componentes se generan en `components/ui/` con `npx shadcn add <component>`
- Nunca modificar los archivos de `components/ui/` directamente
- Nombres de archivo en lowercase (ej. `components/ui/button.tsx`, no `Button.tsx`)
- Para personalizar estilos: usar las props `className` o `variant` de shadcn
