# Workflows — SDD y patrones de implementación

## Metodología SDD (Spec Driven Development)

```
@spec <módulo>  →  @implement <módulo>  →  @validator <módulo>
```

1. **`@spec`** — Lee `docs/api.md` y `docs/models.ts`. Genera `spec/<módulo>.md` con el diseño completo de UI, componentes, flujo de datos y casos borde. **No escribe código.**
2. **`@implement`** — Lee `spec/<módulo>.md` e implementa todos los archivos. No se desvía del spec sin actualizarlo primero.
3. **`@validator`** — Revisa la implementación contra el spec, `docs/api.md` y `docs/models.ts`. Si hay errores genera `spec/<módulo>-validation-report.md`. Si está OK lo confirma.

Si el validator reporta errores → volver a `@implement` con el reporte → volver a `@validator`.

**Regla de oro: nunca implementar código sin spec. Nunca entregar código sin validación.**

---

## Template para `spec/<módulo>.md`

```markdown
# Spec: <Módulo>

## API utilizada
- Endpoints: listar aquí (ej. GET /suppliers/, POST /suppliers/, etc.)
- Tipos: importar de docs/models.ts

## Rutas/páginas
- /suppliers/ → SuppliersPage
- /suppliers/new → NewSupplierPage
- /suppliers/[id] → SupplierDetailPage

## Árbol de componentes
SuppliersPage (Server)
  └── SupplierList (Server)
        ├── SupplierRow (Client) — botones de editar/eliminar
        └── Pagination (Client)

## Funciones API requeridas (lib/api/suppliers.ts)
- getSuppliers(params: { page, search, ordering })
- getSupplier(id: number)
- createSupplier(data: SupplierPayload)
- updateSupplier(id: number, data: Partial<SupplierPayload>)
- deleteSupplier(id: number)

## Estado y mutaciones
- Lista: Server Component, refetch via router.refresh() tras mutación
- Formulario: Client Component con Server Action para submit

## Casos borde
- Lista vacía: mostrar mensaje vacío
- Error de red: mostrar error genérico
- 401: redirigir a /login
- Errores de validación DRF: mapear { field: ["msg"] } a campos del form
- Delete: confirmar con modal antes de llamar la API

## Criterios de aceptación
- [ ] Listar con paginación de 20 items
- [ ] Buscar por nombre/email/contact_name
- [ ] Crear nuevo supplier
- [ ] Editar supplier existente
- [ ] Eliminar (soft delete — desaparece de la lista)
```

---

## Checklist estándar por módulo

Para cualquier módulo CRUD nuevo, en orden:

1. Verificar/agregar interfaces TypeScript en `lib/types/index.ts`
2. Crear `lib/api/<módulo>.ts` con funciones tipadas
3. Crear página de listado `app/(dashboard)/<módulo>/page.tsx`
4. Crear página de detalle/edición `app/(dashboard)/<módulo>/[id]/page.tsx`
5. Crear página de creación `app/(dashboard)/<módulo>/new/page.tsx`
6. Crear componente de formulario `components/<módulo>/<Módulo>Form.tsx`
7. Agregar link de navegación al sidebar layout
8. Si tiene recursos anidados (routes/stops, shipments/items): agregar página nested

---

## Patrón: `lib/api/client.ts`

```typescript
// lib/api/client.ts
const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000/api/v1';

async function getAccessToken(): Promise<string | null> {
  // leer token de cookie httpOnly via Server Action o pasado como parámetro
  // implementar según la estrategia de auth elegida
  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    // intentar refresh, reintentar una vez
    // si falla, redirect a login
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw error;
  }

  if (response.status === 204) return null as T;
  return response.json();
}
```

---

## Patrón: módulo de API tipado

```typescript
// lib/api/suppliers.ts
import { apiFetch } from './client';
import type { Supplier, SupplierPayload, PaginatedResponse } from '@/lib/types';

interface ListParams {
  page?: string;
  search?: string;
  ordering?: string;
}

export function getSuppliers(params?: ListParams) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch<PaginatedResponse<Supplier>>(`/suppliers/${qs ? `?${qs}` : ''}`);
}

export function getSupplier(id: number) {
  return apiFetch<Supplier>(`/suppliers/${id}/`);
}

export function createSupplier(data: SupplierPayload) {
  return apiFetch<Supplier>('/suppliers/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateSupplier(id: number, data: Partial<SupplierPayload>) {
  return apiFetch<Supplier>(`/suppliers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteSupplier(id: number) {
  return apiFetch<null>(`/suppliers/${id}/`, { method: 'DELETE' });
}
```

---

## Manejo de errores DRF en formularios

DRF devuelve errores de validación así:

```json
{
  "email": ["Este campo debe ser único."],
  "name": ["Este campo es requerido."],
  "non_field_errors": ["Error que no pertenece a un campo."]
}
```

Patrón para Server Actions:

```typescript
// En Server Action
try {
  await createSupplier(formData);
} catch (errors: unknown) {
  if (typeof errors === 'object' && errors !== null) {
    // errors ya tiene la shape de DRF — pasar al formulario como actionState
    return { errors: errors as Record<string, string[]> };
  }
  return { errors: { non_field_errors: ['Error de conexión'] } };
}
```

---

## Patrón de paginación

```typescript
// app/(dashboard)/suppliers/page.tsx
export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page = '1', search } = await searchParams;
  const data = await getSuppliers({ page, search });

  return (
    <>
      <SupplierList results={data.results} />
      <Pagination
        currentPage={parseInt(page)}
        totalCount={data.count}
        pageSize={20}
        hasNext={!!data.next}
        hasPrevious={!!data.previous}
      />
    </>
  );
}
```

---

## Recursos anidados

Los endpoints anidados son **rutas separadas** — no se escriben dentro del payload del padre.

```typescript
// lib/api/routes.ts
export function getRouteStops(routeId: number) {
  return apiFetch<RouteStop[]>(`/routes/${routeId}/stops/`);
}

export function createRouteStop(routeId: number, data: RouteStopPayload) {
  return apiFetch<RouteStop>(`/routes/${routeId}/stops/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

Mismo patrón para `/shipments/{id}/items/`.
