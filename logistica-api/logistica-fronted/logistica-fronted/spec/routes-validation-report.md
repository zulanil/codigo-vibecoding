# Reporte de Validación — Routes

Fecha: 2026-05-28
Estado: ERRORES ENCONTRADOS

---

## Errores

### [ERROR-01] `getRoutes` construye la query string manualmente en vez de usar el parámetro `params` de Axios

- Archivo: `lib/api/routes.ts` — líneas 22-33
- Problema: La función construye un objeto `URLSearchParams` manualmente, lo convierte a string y lo concatena en la URL: `apiClient.get(\`/routes/${query ? \`?${query}\` : ""}\`)`. El spec especifica explícitamente el patrón `apiClient.get('/routes/', { params })`, que delega la serialización de query params a Axios.
- Referencia: `spec/routes.md` — Tarea 2: "Crear función `getRoutes(params?...): Promise<PaginatedResponse<Route>>` — usa `apiClient.get('/routes/', { params })`"
- Corrección requerida: Reemplazar la construcción manual de `URLSearchParams` por `apiClient.get<PaginatedResponse<Route>>('/routes/', { params })`, pasando directamente el objeto `params` como segundo argumento de Axios. Axios serializa automáticamente los params omitiendo los valores `undefined`.

---

### [ERROR-02] Zod schema de `stop_order` en `AddStopDialog` no coincide con el spec

- Archivo: `components/routes/AddStopDialog.tsx` — líneas 30-33
- Problema: El schema implementado es:
  ```ts
  stop_order: z.string().min(1, "Requerido").refine(
    (v) => Number.isInteger(Number(v)) && Number(v) > 0,
    "Debe ser un número entero positivo"
  ),
  ```
  El spec requiere:
  ```ts
  stop_order: z.coerce.number().int().positive("Requerido"),
  ```
  Con `z.string()`, el tipo inferido del campo en `FormValues` es `string`, lo que obliga a convertir manualmente `Number(values.stop_order)` en `handleSubmit`. Con `z.coerce.number()`, la coerción ocurre automáticamente a nivel de Zod y el tipo inferido es `number`, alineado con `RouteStopPayload.stop_order: number`. El spec define explícitamente el schema exacto a usar, incluyendo el uso de `z.coerce`.
- Referencia: `spec/routes.md` — Tarea 13 (Zod schemas — AddStop): "`stop_order`: `z.coerce.number().int().positive("Requerido")` — `coerce` convierte el string del input a number automáticamente"
- Corrección requerida: Cambiar el campo `stop_order` del schema a `z.coerce.number().int().positive("Requerido")`. Actualizar el tipo `FormValues` en consecuencia (el campo pasará a ser `number` en el tipo inferido). El `defaultValues.stop_order` deberá ser `undefined` o eliminarse para ser compatible con `z.coerce.number()`. Eliminar la conversión manual `Number(values.stop_order)` en `handleSubmit` ya que el valor ya llegará como `number` desde Zod.

---

### [ERROR-03] `app/(dashboard)/routes/page.tsx` no recibe ni usa la prop `searchParams`

- Archivo: `app/(dashboard)/routes/page.tsx` — líneas 6-28
- Problema: El componente de página se define como `export default function RoutesPage()` sin ningún parámetro. El spec requiere que la página reciba `searchParams: Promise<{ page?: string; search?: string; ordering?: string; status?: string }>` y use `await searchParams`. La firma correcta es:
  ```ts
  export default async function RoutesPage({
    searchParams,
  }: {
    searchParams: Promise<{ page?: string; search?: string; ordering?: string; status?: string }>;
  }) {
    const { page, search, ordering, status } = await searchParams;
    ...
  }
  ```
  Actualmente, la página es una función sincrónica sin props. En Next.js 16, `searchParams` es una `Promise` que debe ser `await`-ada en el Server Component antes de pasarla al componente cliente; no hacerlo es incorrecto según el API de Next.js 16.
- Referencia: `spec/routes.md` — Tarea 10: "`app/(dashboard)/routes/page.tsx`: `searchParams: Promise<{ page?: string; search?: string; ordering?: string; status?: string }>` — usar `await searchParams`"; `docs/architecture.md` — "Next.js 16: `searchParams` también es `Promise<{...}>` — siempre hacer `await searchParams`"
- Corrección requerida: Convertir `RoutesPage` en función `async`, añadir el parámetro `searchParams: Promise<{...}>` y hacer `await searchParams`. Los valores resueltos pueden pasarse como props a `<RouteTable />` o simplemente ser obtenidos para cumplir con el contrato del framework. Si `RouteTable` ya los lee con `useSearchParams()`, el `await searchParams` sigue siendo necesario en el Server Component padre para cumplir con el patrón de Next.js 16.

---

### [ERROR-04] `RouteForm` usa una sola `useMutation` con lógica condicional en lugar de dos mutaciones separadas por modo

- Archivo: `components/routes/RouteForm.tsx` — líneas 75-104
- Problema: La implementación usa una única llamada `useMutation` cuya `mutationFn` decide entre `createRoute` y `updateRoute` mediante el flag `isEdit`. El spec define dos mutaciones distintas según el modo del componente:
  - Modo crear: `useMutation(createRoute)`
  - Modo editar: `useMutation((p) => updateRoute(route.id, p))`
  Al tener una sola mutación compartida, el tipo del argumento de `mutationFn` no corresponde exactamente a `RoutePayload` (porque recibe `FormValues` y hace la transformación internamente), lo que difiere del patrón esperado.
- Referencia: `spec/routes.md` — Tarea 6: "`useMutation(createRoute)` en modo crear, `useMutation((p) => updateRoute(route.id, p))` en modo editar"
- Corrección requerida: Separar en dos `useMutation` calls según el modo:
  ```ts
  const createMutation = useMutation({ mutationFn: (payload: RoutePayload) => createRoute(payload), ... });
  const updateMutation = useMutation({ mutationFn: (payload: RoutePayload) => updateRoute(route!.id, payload), ... });
  const { mutate, isPending } = isEdit ? updateMutation : createMutation;
  ```
  La transformación de `FormValues` a `RoutePayload` (conversión de `transport` y `origin_warehouse` a `number`) debe ocurrir en el `onSubmit` handler antes de llamar a `mutate`.
