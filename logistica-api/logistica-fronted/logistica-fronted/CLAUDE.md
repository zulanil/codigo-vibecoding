@AGENTS.md

# Logística Frontend

Next.js 16.2.6 · React 19.2.4 · TypeScript 5 · Tailwind CSS v4 · App Router.
Consume el backend Django REST Framework en `http://localhost:8000/api/v1/`.
Backend: `../../logistica-api/` (8 módulos CRUD + JWT auth).

## Orquestador SDD

Para desarrollar un módulo de principio a fin:

```
@orchestrator <módulo>
```

Ej: `@orchestrator auth`, `@orchestrator suppliers`, `@orchestrator shipments`

El orquestador coordina: `@spec → (aprobación humana) → @implement → @validator`

**Regla de oro: nunca implementar código sin spec aprobado. Nunca entregar sin validación.**

## Documentación

| Archivo | Qué contiene |
|---------|-------------|
| [`docs/mvp.md`](docs/mvp.md) | Orden de módulos, pantallas, formularios, tablas, criterios de completitud |
| [`docs/setup.md`](docs/setup.md) | Instalación, env vars, cómo correr localmente |
| [`docs/api.md`](docs/api.md) | Todos los endpoints del backend, auth flow, campos por módulo |
| [`docs/models.ts`](docs/models.ts) | Interfaces TypeScript para los 8 módulos + auth |
| [`docs/architecture.md`](docs/architecture.md) | Stack, estructura de carpetas, patrones de Axios/TanStack Query/Zustand/shadcn |
| [`docs/workflows.md`](docs/workflows.md) | Metodología SDD, checklist por módulo |

**Leer `docs/api.md`, `docs/models.ts` y `docs/architecture.md` antes de cualquier tarea de desarrollo.**

## Stack

| Herramienta | Rol |
|-------------|-----|
| Next.js 16.2.6 | Framework, App Router |
| shadcn/ui | Todos los componentes UI |
| @tanstack/react-query v5 | Server state (fetch, cache, mutaciones) |
| @tanstack/react-table v8 | Todas las tablas |
| Axios | HTTP client (lib/api/client.ts) |
| Zustand v5 | Client state (auth + UI) |
| Tailwind CSS v4 | Estilos |

## Reglas rápidas

- Todos los endpoints protegidos requieren `Authorization: Bearer <access_token>`
- Auth: `POST /api/v1/auth/token/` → `{access, refresh}` · `POST /api/v1/auth/token/refresh/` → `{access}`
- Campos `DecimalField` llegan como **string** desde DRF — tipificar como `string`, nunca `number`
- FKs nullables: `driver` en Transport, `route` en Shipment → `number | null`
- **Tailwind v4**: sin `tailwind.config.js` — tokens en `app/globals.css` dentro de `@theme {}`
- **`params` en rutas dinámicas**: es `Promise<{id: string}>` — siempre hacer `await params`
- **`searchParams`**: también es `Promise<{...}>` — siempre hacer `await searchParams`
- JWT: httpOnly cookie via Route Handler — nunca `localStorage`
- No usar `fetch` nativo — usar Axios via `lib/api/client.ts`
- No usar `useState` para server state — usar TanStack Query
- shadcn/ui en lowercase: `components/ui/button.tsx` (no `Button.tsx`)
- Path alias: `@/*` → raíz del proyecto

## Separación de estado

| Estado | Herramienta |
|--------|-------------|
| Datos del servidor | TanStack Query (`useQuery`, `useMutation`) |
| Auth session | Zustand (`lib/stores/auth.ts`) |
| UI (modales) | Zustand (`lib/stores/ui.ts`) |
| Form inputs | react-hook-form (vía shadcn Form) |

## Metodología SDD

```
@spec <módulo>   → genera spec/<módulo>.md (NO escribe código)
                    ↓ aprobación humana
@implement       → implementa desde el spec
@validator       → verifica, marca ✅ o genera reporte de errores
```

## Estructura de carpetas (objetivo)

```
app/
  (auth)/login/            ← rutas públicas
  (dashboard)/             ← rutas protegidas con sidebar
    suppliers/, warehouses/, customers/, products/,
    drivers/, transports/, routes/, shipments/
  providers.tsx            ← QueryClientProvider + Zustand init
lib/
  api/client.ts            ← Axios instance con interceptores
  api/<módulo>.ts          ← funciones tipadas por módulo
  stores/auth.ts           ← Zustand auth store
  stores/ui.ts             ← Zustand UI store
  types/index.ts           ← re-exporta interfaces de docs/models.ts
components/
  ui/                      ← shadcn/ui (no modificar directamente)
  <módulo>/                ← Table, Form, Columns por módulo
spec/                      ← specs SDD (generados, no editar manualmente)
docs/                      ← esta documentación

```

## Módulos del backend

| App | Base URL | Nested |
|-----|----------|--------|
| Suppliers | `/suppliers/` | — |
| Warehouses | `/warehouses/` | — |
| Customers | `/customers/` | — |
| Products | `/products/` | — |
| Drivers | `/drivers/` | — |
| Transport | `/transports/` | — |
| Routes | `/routes/` | `GET/POST /routes/{id}/stops/` |
| Shipments | `/shipments/` | `GET/POST /shipments/{id}/items/` |

Todos: `GET/POST /<resource>/` · `GET/PUT/PATCH/DELETE /<resource>/{id}/`
Paginación: 20 items/página via `?page=N`
