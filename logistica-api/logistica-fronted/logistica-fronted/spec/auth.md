# Spec: Auth

## API utilizada

| Endpoint | Método | Auth requerida | Body | Response |
|----------|--------|---------------|------|----------|
| `/auth/token/` | POST | No | `{username, password}` | `{access, refresh}` |
| `/auth/token/refresh/` | POST | No | `{refresh}` | `{access}` |

Tipos: `TokenObtainPayload`, `TokenResponse`, `TokenRefreshPayload` de `docs/models.ts`

## Rutas/páginas

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/login` | `app/(auth)/login/page.tsx` | Server Component | Redirect si ya autenticado, sino renderiza LoginForm |
| `/` | `app/page.tsx` | Server Component | Redirect a `/dashboard` (o `/login` si no autenticado) |
| `/dashboard` | `app/(dashboard)/page.tsx` | Server Component | Página de bienvenida del dashboard |

## Estructura de archivos

```
middleware.ts                                  ← protección de rutas
app/
  page.tsx                                     ← redirect root
  providers.tsx                                ← QueryClientProvider wrapper ('use client')
  (auth)/
    layout.tsx                                 ← layout centrado sin navbar
    login/
      page.tsx                                 ← Server Component, redirect si autenticado
  (dashboard)/
    layout.tsx                                 ← layout con sidebar y logout ('use client')
    page.tsx                                   ← dashboard home
  api/
    auth/
      login/
        route.ts                               ← Route Handler: POST login → set cookies
      logout/
        route.ts                               ← Route Handler: POST logout → clear cookies
      refresh/
        route.ts                               ← Route Handler: POST refresh → update access cookie
lib/
  api/
    client.ts                                  ← Axios instance con interceptores
    auth.ts                                    ← funciones: login, logout, refresh
  stores/
    auth.ts                                    ← Zustand auth store
  types/
    index.ts                                   ← re-exporta desde docs/models.ts
components/
  auth/
    LoginForm.tsx                              ← Client Component, shadcn Form
  dashboard/
    Sidebar.tsx                                ← Client Component, navegación + logout
    LogoutButton.tsx                           ← Client Component, botón de logout
```

## Decisión de diseño: estrategia de cookies

- `access_token`: cookie NO httpOnly (JS-readable) — necesario para que Axios inyecte el header `Authorization: Bearer`. Expiración 15 min.
- `refresh_token`: cookie httpOnly — protegido de XSS. Solo accesible por el Route Handler de refresh. Expiración 7 días.
- Este es el patrón estándar JWT (Auth0, Cognito lo usan igual). El secreto valioso (refresh) está protegido.

## Tareas

### Tipos y configuración base

- [x] Crear `lib/types/index.ts` que re-exporte todas las interfaces de `docs/models.ts`
- [x] Crear `app/providers.tsx` como Client Component con `QueryClientProvider` y `ReactQueryDevtools`
- [x] Actualizar `app/layout.tsx` para envolver children con `<Providers>`

### Axios client (lib/api/client.ts)

- [x] Crear instancia Axios con `baseURL` desde `process.env.NEXT_PUBLIC_API_BASE_URL`
- [x] Interceptor de request: leer access token de cookie `access_token` e inyectar header `Authorization: Bearer <token>`
- [x] Interceptor de response: en 401, llamar a `/api/auth/refresh` para obtener nuevo access token, guardar en cookie y reintentar la request original una vez
- [x] En segundo 401 consecutivo (refresh también falló): llamar a `/api/auth/logout` y redirect a `/login`
- [x] Exportar `apiClient` como default

### API functions (lib/api/auth.ts)

- [x] Función `loginRequest(payload: TokenObtainPayload): Promise<void>` — llama a `POST /api/auth/login` (Route Handler) con username/password
- [x] Función `logoutRequest(): Promise<void>` — llama a `POST /api/auth/logout` (Route Handler)
- [x] Función `refreshRequest(): Promise<void>` — llama a `POST /api/auth/refresh` (Route Handler)

### Route Handlers (BFF — Next.js app/api/)

- [x] `app/api/auth/login/route.ts`: recibe `{username, password}`, llama a Django `POST /api/v1/auth/token/`, setea cookies `access_token` (no httpOnly, 15 min) y `refresh_token` (httpOnly, 7 días), responde 200 o 401 con mensaje de error
- [x] `app/api/auth/logout/route.ts`: limpia cookies `access_token` y `refresh_token`, responde 200
- [x] `app/api/auth/refresh/route.ts`: lee `refresh_token` (httpOnly) de cookie, llama a Django `POST /api/v1/auth/token/refresh/`, actualiza cookie `access_token`, responde 200 o 401

### Zustand Auth Store (lib/stores/auth.ts)

- [x] Interface `AuthStore`: `isAuthenticated: boolean`, `setAuthenticated(v: boolean): void`, `logout(): Promise<void>`
- [x] `logout()`: llama a `logoutRequest()`, setea `isAuthenticated: false`, hace `window.location.href = '/login'`
- [x] `useAuthStore` exportado
- [x] Inicialización: `isAuthenticated` derivado de presencia de cookie `access_token` en `document.cookie`

### Middleware (middleware.ts en raíz del proyecto)

- [x] Leer cookie `access_token` en cada request
- [x] Si ruta no es pública y no hay cookie → redirect a `/login`
- [x] Si ruta es `/login` y hay cookie válida → redirect a `/dashboard`
- [x] Configurar `matcher` para excluir rutas de `/_next/`, archivos estáticos
- [x] No verificar el JWT en el middleware (solo presencia de la cookie)

### Páginas

- [x] `app/page.tsx`: Server Component que hace redirect a `/dashboard` (o `/login` si no hay cookie)
- [x] `app/(auth)/layout.tsx`: layout sin navbar, centrado verticalmente, fondo limpio con shadcn
- [x] `app/(auth)/login/page.tsx`: Server Component, redirect a `/dashboard` si hay cookie `access_token`, sino renderiza `<LoginForm />`
- [x] `app/(dashboard)/page.tsx`: Server Component, página de bienvenida simple ("Dashboard")

### Componentes

- [x] `components/auth/LoginForm.tsx`: Client Component con `'use client'`
  - shadcn `Form` + `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage`
  - shadcn `Input` para username y password (type="password")
  - shadcn `Button` con loading state durante submit (`mutation.isPending`)
  - `useMutation` de TanStack Query para llamar a `loginRequest`
  - En `onSuccess`: `setAuthenticated(true)` en Zustand + `router.push('/dashboard')`
  - En `onError` 401: toast + mensaje en campos del formulario
  - Validación con `react-hook-form` + `zod`: username requerido, password requerido

- [x] `components/dashboard/Sidebar.tsx`: Client Component
  - Lista de links de navegación para los 8 módulos + Dashboard
  - Link activo destacado con `usePathname`
  - Sección inferior con `<LogoutButton />`

- [x] `components/dashboard/LogoutButton.tsx`: Client Component
  - shadcn `Button` variant="ghost" con icono `LogOut` de lucide-react
  - Al click: llama a `logout()` del Zustand auth store

### Layout dashboard

- [x] `app/(dashboard)/layout.tsx`: Server Component
  - Sidebar fijo a la izquierda + contenido principal a la derecha
  - Protección real manejada por `middleware.ts`
  - Renderiza `<Sidebar />` + `{children}`

### Casos borde

- [x] Login con credenciales inválidas → toast de error + mensaje en campos del formulario
- [x] Login con campos vacíos → validación inline con zod + shadcn FormMessage antes de hacer fetch
- [x] Estado de carga durante submit → botón deshabilitado + texto "Ingresando..."
- [x] Refresh token expirado → interceptor hace logout automático + redirect a `/login`
- [x] Cookie presente pero token inválido → backend retorna 401 → interceptor Axios hace logout

### Instalación de dependencias shadcn y zod

- [x] `react-hook-form`, `zod`, `@hookform/resolvers` instalados
- [x] Componentes shadcn instalados: form, input, button, badge, card, label, sonner
- [x] `@radix-ui/react-slot` y `@radix-ui/react-label` instalados

## Criterios de aceptación

- [x] Formulario de login funcional: envía `{username, password}` al Route Handler, recibe cookies, redirige a `/dashboard`
- [x] `refresh_token` en httpOnly cookie — `access_token` en cookie JS-readable (necesario para Axios)
- [x] Refresh automático transparente: si access token expira, la siguiente request dispara refresh y reintenta sin que el usuario lo note
- [x] Middleware protege todas las rutas no públicas: redirige a `/login` si no hay cookie
- [x] Redirect a `/login` si no autenticado. Redirect a `/dashboard` si ya hay cookie y visita `/login`
- [x] Botón de logout en sidebar: limpia cookies, resetea store, redirige a `/login`
- [x] Error 401 en login muestra mensaje en el formulario + toast
- [x] Loading state visible durante submit del formulario
