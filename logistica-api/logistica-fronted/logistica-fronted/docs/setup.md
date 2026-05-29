# Setup

## Prerequisitos

- Node.js 20+
- Backend Django corriendo en `http://localhost:8000` ([logistica-api](../../logistica-api))

## Instalación

```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Instalar el stack adicional
npm install @tanstack/react-query @tanstack/react-table axios zustand
npm install -D @tanstack/react-query-devtools

# 3. Inicializar shadcn/ui (interactivo — usar defaults para Next.js + Tailwind v4)
npx shadcn@latest init
```

> shadcn crea `components/ui/` y puede actualizar `globals.css`. Compatible con Tailwind v4.

Crear `.env.local` en la raíz del proyecto:

```env
API_BASE_URL=http://localhost:8000/api/v1
```

Si necesitas fetch desde el cliente (browser):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Correr el proyecto

```bash
npm run dev      # dev server con Turbopack → http://localhost:3000
npm run build    # build de producción
npm run start    # servir build de producción
npm run lint     # ESLint
```

## Backend API Explorer

Swagger UI disponible en el backend: `http://localhost:8000/api/v1/docs/`

Requiere que el backend esté corriendo. Util para probar endpoints manualmente.

## Notas importantes de esta versión

- **Next.js 16**: APIs y convenciones cambian respecto a versiones anteriores. Consultar `node_modules/next/dist/docs/` antes de escribir código específico de Next.js (ver `AGENTS.md`).
- **Tailwind v4**: no existe `tailwind.config.js`. Todo el tema personalizado va en `app/globals.css` dentro del bloque `@theme {}`.
- **`params` en rutas dinámicas**: es `Promise<{ id: string }>` — siempre hacer `await params` antes de usar.
