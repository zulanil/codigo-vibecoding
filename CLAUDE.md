# Task Manager — Guía del proyecto

Monorepo con dos proyectos relacionados. Desde esta raíz se pueden levantar ambos en paralelo con un solo comando.

## Estructura del repositorio

```
vide-coding/
├── task-manager-backend/   # API REST en Node.js + Express
├── task-manager-fronted/   # SPA en React + Vite (nota: typo intencional en el nombre de la carpeta)
└── package.json            # Orquestador — `npm run dev` levanta ambos
```

## Comandos raíz

> **IMPORTANTE — ejecución manual únicamente**
> Estos comandos los ejecuta **siempre el desarrollador**, nunca la IA.
> Claude no debe correr `npm run dev` ni ningún servidor de desarrollo de forma autónoma.

```bash
# Desde la raíz — levanta ambos en paralelo
npm run dev

# O individualmente desde cada carpeta
cd task-manager-backend && npm run dev   # API en :3000
cd task-manager-fronted && npm run dev   # SPA en :5173
```

---

## Backend — `task-manager-backend/`

**Stack:** Node.js · Express 4 · Prisma 7 · PostgreSQL (Neon) · JavaScript ES Modules

| Aspecto | Detalle |
|---------|---------|
| Puerto | `3000` |
| Entry point | `index.js` |
| Dev script | `npm run dev` (tsx --watch) — **ejecutar manualmente** |
| ORM | Prisma — schema en `prisma/schema.prisma` |
| Base de datos | PostgreSQL hosteada en Neon |
| Auth | Token Base64 personalizado + bcryptjs |
| Docs API | Swagger en `GET /api-docs` |

### Endpoints disponibles

```
POST   /user/register     — registro (name, lastname, email, password)
POST   /user/login        — login → devuelve token Base64

GET    /task              — listar todas las tareas (requiere auth)
POST   /task              — crear tarea (title, description?)
GET    /task/:id          — detalle de tarea
PUT    /task/:id          — actualizar tarea
DELETE /task/:id          — eliminar tarea (204)
```

**Auth header:** `Authorization: Bearer <token>`

### Capas de código

```
src/
├── app.js                  — setup de Express, CORS, registro de routers
├── tasks/
│   ├── task.router.js      — rutas /task
│   ├── task.controller.js  — lógica de negocio
│   └── task.repository.js  — queries a la DB (Prisma)
├── users/
│   ├── user.router.js
│   ├── user.controller.js
│   └── user.repository.js
├── middlewares/auth.js     — valida Bearer token en cada request protegido
├── db/prisma.js            — instancia del cliente Prisma
└── docs/swagger.js         — especificación OpenAPI 3.0
```

### Variables de entorno requeridas

```
DATABASE_URL=<neon-postgres-url>
PORT=3000
SWAGGER_USER=admin
SWAGGER_PASS=admin
```

---

## Frontend — `task-manager-fronted/`

**Stack:** React 19 · Vite 8 · React Router 7 · Tailwind CSS 4 · Lucide React · JavaScript

| Aspecto | Detalle |
|---------|---------|
| Puerto | `5173` (Vite default) |
| Entry point | `src/main.jsx` |
| Dev script | `npm run dev` — **ejecutar manualmente** |
| HTTP client | Fetch API nativa |
| Base URL API | `http://localhost:3000/task` (hardcodeada en `src/services/taskService.js`) |

### Rutas de la SPA

```
/               — TaskListPage   (listado con CRUD de tareas)
/tasks/:id      — TaskDetailPage (detalle de tarea)
/login          — LoginPage      (formulario de autenticación)
```

### Capas de código

```
src/
├── main.jsx                — entrada React DOM
├── App.jsx                 — configuración de rutas
├── pages/
│   ├── TaskListPage.jsx    — pantalla principal, fetch + CRUD
│   ├── TaskDetailPage.jsx  — vista individual de tarea
│   └── LoginPage.jsx       — formulario de login (⚠️ handleSubmit pendiente de implementar)
├── components/
│   ├── Dialog.jsx          — wrapper de modal
│   ├── TaskCard.jsx        — tarjeta de tarea individual
│   └── TaskForm.jsx        — formulario reutilizable crear/editar
└── services/
    └── taskService.js      — cliente HTTP (getAll, getById, create, update, delete)
```

---

## Cómo dividir el trabajo al implementar una nueva feature

Toda feature nueva toca ambos proyectos. Esta es la separación de responsabilidades:

### Lo que va en el **backend**

- Nuevo endpoint o ruta en Express
- Nueva tabla o campo en `prisma/schema.prisma` + migración (`npx prisma migrate dev`)
- Lógica de negocio y validaciones en el controller
- Queries en el repository
- Actualizar Swagger (`src/docs/swagger.js`) si hay endpoint nuevo

### Lo que va en el **frontend**

- Llamada HTTP en `src/services/taskService.js`
- Página nueva en `src/pages/`
- Componente nuevo en `src/components/`
- Ruta nueva en `src/App.jsx`
- Manejo de estado local con React hooks

### Ejemplo — feature "marcar tarea como completada"

| Proyecto | Tarea |
|----------|-------|
| Backend | Verificar que `PUT /task/:id` ya acepta el campo `done: boolean` ✓ |
| Backend | Validar que auth middleware protege el endpoint ✓ |
| Frontend | Agregar botón toggle en `TaskCard.jsx` |
| Frontend | Llamar `taskService.update(id, { done: true })` |
| Frontend | Actualizar estado local sin re-fetch completo |

---

## Estado actual y deuda técnica conocida

| Ítem | Proyecto | Descripción |
|------|---------|-------------|
| Login sin implementar | Frontend | `handleSubmit` en `LoginPage.jsx` es un stub — no hace llamada al backend |
| Token no persistido | Frontend | No se guarda el token en localStorage ni en Context |
| Sin contexto de usuario | Frontend | No hay estado global del usuario autenticado |
| Token no estándar | Backend | Se usa Base64 custom en lugar de `jsonwebtoken` (HS256) |
| CORS abierto | Backend | Permite todos los orígenes — restringir en producción |

---

## Flujo de comunicación

```
Frontend :5173          Backend :3000          PostgreSQL (Neon)
     │                       │                        │
     │  POST /user/login      │                        │
     │──────────────────────>│                        │
     │  ← token (Base64)     │                        │
     │                       │                        │
     │  GET /task             │                        │
     │  Authorization: Bearer │                        │
     │──────────────────────>│── Prisma query ───────>│
     │  ← JSON array         │<── rows ───────────────│
     │<──────────────────────│                        │
     │                       │                        │
     │  POST /task            │                        │
     │  { title, description }│                        │
     │──────────────────────>│── INSERT ─────────────>│
     │  ← 201 + task object  │<── new row ────────────│
     │<──────────────────────│                        │
```
