# Control de Anomalías — Documentación del Proyecto
**Proyecto Final · Desarrollo Fullstack · Universidad**

---

## Descripción General

Sistema web para detección automática de anomalías en datasets industriales o científicos. Implementa la metodología estadística de **Cartas de Control Shewhart** (Media ± σ) con una interfaz moderna de análisis, roles de usuario diferenciados, persistencia en base de datos cloud, análisis compartibles entre usuarios, y filtros avanzados con segmentación de datos.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI 0.11x (Python 3.11) |
| ORM | SQLAlchemy |
| Base de datos | PostgreSQL en Neon (serverless, pool_pre_ping) |
| Autenticación | JWT con python-jose (HS256, 8 horas) |
| Hash contraseñas | bcrypt 5.x (directo, sin passlib) |
| Frontend | Vite + React 19 + TypeScript |
| Estilos | Tailwind CSS 3 · glassmorphism dark mode |
| Gráficas | Plotly.js / react-plotly.js |
| Testing Backend | pytest + httpx + FastAPI TestClient + SQLite in-memory |
| Testing Frontend | Vitest |
| Deploy Backend | Railway (nixpacks, Python 3.11, uvicorn) |
| Deploy Frontend | Vercel (Vite build estático) |
| Repo | GitHub (`zulanil/codigo-vibecoding`) |

---

## Arquitectura

```
anomalias-front/                ← SPA React + TypeScript
  src/
    components/
      AnomalyChart.tsx          ← Plotly: un chart por métrica, LCS/LCI/media
      AnomalyTable.tsx          ← Tabla paginada con sticky header
      AdminPanel.tsx            ← Gestión de usuarios (admin)
      ReportsPanel.tsx          ← Análisis compartidos (todos los roles)
      FilterPanel.tsx           ← Filtros multicategoría + segmentación
      StatCard.tsx              ← KPI cards con Lucide icons
      LoginPage.tsx             ← Auth con blobs animados
      FileUpload.tsx
      ColumnSelector.tsx
    contexts/
      AuthContext.tsx           ← JWT en localStorage, getAuthHeader()
    services/
      api.ts                    ← fetch + auth: limpiar, procesar, usuarios, reportes
    utils/
      csv.ts                    ← parseCsv, applyFilters, mergeResults, getUniqueValues
    types/
      index.ts                  ← Role, AuthUser, AnalysisResult, FilterConfig, UserRecord, ReportRecord

anomalias-api/                  ← API REST FastAPI
  main.py                       ← app, CORS, startup/seed, endpoints análisis
  analytics.py                  ← lógica Shewhart + downsampling + _safe() NaN guard
  models.py                     ← User, Analysis, Report (SQLAlchemy)
  database.py                   ← engine Neon + get_db
  auth/
    jwt.py                      ← hash_password, verify_password, create_token
    dependencies.py             ← get_current_user, require_role
    router.py                   ← /api/auth/* (login, register, users CRUD)
  reports/
    router.py                   ← /api/reports (guardar/listar/ver/eliminar)
  schemas.py                    ← Pydantic: UserRegister, UserLogin, UserOut, TokenResponse
  tests/                        ← SDD test suite (30 tests pytest)
```

---

## Funcionalidades Implementadas

### Autenticación y Roles

| Rol | Permisos |
|-----|---------|
| **Admin** | Todo: análisis, sigma 1-5σ, gestión de usuarios, crear/eliminar cuentas, eliminar reportes |
| **Editor** | Cargar CSV, analizar datos, guardar análisis para compartir, sigma máx 3σ |
| **Viewer** | Ver análisis compartidos guardados por editor/admin |

Usuarios demo (creados/actualizados en cada startup con upsert):

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@anomalias.com` | `Admin2024!` | Admin |
| `editor1@anomalias.com` | `Editor2024!` | Editor |
| `editor2@anomalias.com` | `Editor2024!` | Editor |
| `viewer1@anomalias.com` | `Viewer2024!` | Viewer |
| `viewer2@anomalias.com` | `Viewer2024!` | Viewer |

### Flujo de Análisis (4 pasos)

```
Paso 1 — Cargar CSV
  → POST /api/limpiar
  → Detecta separador (, o ;), deduplica, devuelve columnas + preview 10 filas

Paso 2 — Columnas
  → Seleccionar colX (eje X) + una o más colsY (métricas a analizar)

Paso 3 — Filtros y configuración
  → Filtros tipo: rango numérico, texto, categorías, ⚡ Segmentar por
  → Chip resumen por filtro (color según tipo: azul=rango, cyan=categoría, violeta=segmentar)
  → Sigma ajustable (admin 1–5σ, editor fijo 3σ)

Paso 4 — Resultado
  → Gráficas Shewhart (primero, una por métrica/segmento)
  → KPI cards (puntos, métricas, anomalías, sigma)
  → Tabla de anomalías paginada
  → Botón "Guardar análisis" (compartir con otros usuarios)
  → Botón "Descargar reporte" (print/PDF)
```

### Segmentación de Datos

El filtro **⚡ Segmentar por** genera un análisis Shewhart independiente por cada valor de la columna seleccionada:

```
Ejemplo: colsY=["Value"], segmentar por "metric_type" con valores [Paid_Ruby, Free_Ruby]
→ Resultado: "Value [Paid_Ruby]" + "Value [Free_Ruby]" — dos gráficas independientes
```

### Motor Shewhart (`analytics.py`)

```
μ  = mean(serie completa)
σ  = std(serie completa)
LCS = μ + sigma × σ       ← rojo punteado
LCI = μ - sigma × σ       ← rojo punteado
Anomalía: valor > LCS o valor < LCI

Optimización para datasets grandes:
  - stats: 100% de los datos
  - normales: downsample a máx 3,000 puntos (paso uniforme)
  - anomalías: 100% preservadas
  - payload: de ~280 MB → ~500 KB
```

NaN/Inf guard: función `_safe()` en `analytics.py` convierte valores inválidos antes de serializar JSON.

### Análisis Compartidos (Reports)

```
Editor/Admin:
  POST /api/reports → guarda título + colX + colsY + sigma + results_json
  → Botón "Guardar análisis" en paso 4

Todos los roles:
  GET  /api/reports     → lista de reportes (sin datos pesados)
  GET  /api/reports/{id} → reporte completo con gráficas
  → Panel "Reportes" en header, disponible siempre

Admin:
  DELETE /api/reports/{id} → eliminar reporte
```

### Panel de Administración de Usuarios

Exclusivo para admin, accessible desde botón **Usuarios** en header:

- Lista de todos los usuarios con avatar de iniciales, badge de rol
- Cambiar rol en línea (dropdown + botón Guardar)
- Eliminar usuario (doble clic para confirmar)
- Modal **Crear usuario** con nombre, email, contraseña y rol

---

## API Endpoints

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| `GET` | `/` | No | — | Health check |
| `POST` | `/api/auth/register` | No | — | Registro → siempre rol viewer |
| `POST` | `/api/auth/login` | No | — | Login → JWT 8h |
| `GET` | `/api/auth/me` | Sí | todos | Perfil actual |
| `GET` | `/api/auth/users` | Sí | admin | Listar usuarios |
| `POST` | `/api/auth/users` | Sí | admin | Crear usuario con rol |
| `PATCH` | `/api/auth/users/{id}/role` | Sí | admin | Cambiar rol (no self) |
| `DELETE` | `/api/auth/users/{id}` | Sí | admin | Eliminar usuario (no self) |
| `POST` | `/api/limpiar` | Sí | admin, editor | Limpiar y parsear CSV |
| `POST` | `/api/procesar` | Sí | admin, editor | Análisis Shewhart |
| `POST` | `/api/reports` | Sí | admin, editor | Guardar análisis |
| `GET` | `/api/reports` | Sí | todos | Listar reportes guardados |
| `GET` | `/api/reports/{id}` | Sí | todos | Ver reporte completo |
| `DELETE` | `/api/reports/{id}` | Sí | admin | Eliminar reporte |

Documentación Swagger/OpenAPI: `https://<railway-url>/docs`

---

## Gráfica de Control — Plotly.js

Migración de Recharts → Plotly por su modelo de `shapes` independiente del dominio del eje Y:

| Elemento | Implementación |
|----------|---------------|
| Línea continua | `trace type:'scatter', mode:'lines'` — puntos normales (downsampled) |
| Marcadores rojos | Trace separado `mode:'markers'` — anomalías (100% preservadas) |
| Banda control | `shape type:'rect'` entre LCI y LCS (`fillcolor` rojo translúcido) |
| LCS / LCI | `shape type:'line'` con `xref:'paper'` (independiente del zoom) |
| μ (media) | `shape type:'line'` punteado |
| Etiquetas | `annotations` con valor exacto de cada límite |
| Interactividad | Zoom, pan, hover tooltip, export PNG con `displayModeBar` |

**Un `<Plot>` por métrica** — cada colY o segmento tiene su propio chart con su propio eje Y, LCS/LCI y media independientes. Solo el último chart muestra el eje X con etiquetas.

---

## Tests — Spec-Driven Development (SDD)

La metodología SDD valida cada endpoint contra su especificación OpenAPI (generada automáticamente por FastAPI en `/docs`). Los tests usan SQLite en memoria para independencia completa de Neon.

### Backend (pytest) — 30 tests ✅

#### `test_health.py` — 1 test
| Test | Descripción |
|------|-------------|
| `test_health_ok` | GET / → 200, body con estado/docs/version |

#### `test_auth.py` — 13 tests
| Test | Descripción |
|------|-------------|
| `test_login_admin_ok` | Login admin → 200 + token + role |
| `test_login_editor_ok` | Login editor → 200 |
| `test_login_wrong_password` | Contraseña errónea → 401 |
| `test_login_unknown_email` | Email inexistente → 401 |
| `test_register_nuevo_usuario` | Registro exitoso → 200 + token |
| `test_register_email_duplicado` | Email duplicado → 400 |
| `test_me_sin_token` | GET /me sin token → 403 |
| `test_me_con_token` | GET /me con token → 200 + email + role |
| `test_me_token_invalido` | Token inválido → 401 |
| `test_list_users_admin` | Admin lista usuarios → 200 + array ≥3 |
| `test_list_users_editor_forbidden` | Editor lista usuarios → 403 |
| `test_change_role_admin` | Admin cambia rol → 200 + nuevo rol |
| `test_change_role_rol_invalido` | Rol no permitido → 400 |

#### `test_limpiar.py` — 6 tests
| Test | Descripción |
|------|-------------|
| `test_limpiar_sin_token` | Sin auth → 403 |
| `test_limpiar_viewer_forbidden` | Viewer → 403 |
| `test_limpiar_editor_csv_valido` | CSV válido → 200 + columnas + preview |
| `test_limpiar_admin_csv_valido` | Admin también puede → 200 |
| `test_limpiar_csv_con_semicolons` | Separador `;` + deduplicación |
| `test_limpiar_preview_max_10_filas` | Preview limitado a 10 filas |

#### `test_procesar.py` — 9 tests
| Test | Descripción |
|------|-------------|
| `test_procesar_sin_token` | Sin auth → 403 |
| `test_procesar_viewer_forbidden` | Viewer → 403 |
| `test_procesar_editor_ok` | Editor + datos → 200 + campos completos |
| `test_procesar_admin_ok` | Admin + datos → 200 |
| `test_procesar_detecta_anomalias` | Dataset con outliers → total_anomalias ≥ 2 |
| `test_procesar_estadisticos_coherentes` | LCS > μ > LCI, σ > 0 |
| `test_procesar_editor_sigma_cap` | Editor sigma=5 → servidor aplica cap=3.0 |
| `test_procesar_admin_sigma_libre` | Admin sigma=5 → LCS mayor que sigma=3 |
| `test_procesar_columna_inexistente` | Columna no encontrada → 400 |

**Total backend: 30/30 tests ✅**

---

### Frontend (Vitest) — 13 tests ✅

Tests unitarios sobre lógica pura en `src/utils/csv.ts`:

| Función | Tests |
|---------|-------|
| `parseCsv` | Parsea cabecera/filas, devuelve [] sin datos, elimina comillas |
| `getUniqueValues` | Valores únicos de columna, orden numérico correcto |
| `applyFilters` | Sin filtros devuelve original, rango min/max, solo min, texto case-insensitive, categoría vacía, categoría con selección |
| `mergeResults` | Combina 2 columnas Y por colX, incluye flag anomalia por columna |

**Total frontend: 13/13 tests ✅**

---

## Deploy — Railway (Backend)

### Herramientas instaladas
- Railway CLI v5.12.0 (`npm install -g @railway/cli`)

### Archivos de configuración
```toml
# anomalias-api/nixpacks.toml
[phases.setup]
nixPkgs = ["python311"]
[phases.install]
cmds = ["pip install -r requirements.txt"]
[start]
cmd = "uvicorn main:app --host 0.0.0.0 --port $PORT"
```
```
# anomalias-api/Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Pasos realizados

1. `railway login` — autenticación en terminal del usuario
2. `railway init` desde `anomalias-api/` → creó proyecto `control-de-anomalias`
3. `railway up --service "control-de-anomalias"` → primer deploy (build nixpacks)
4. Variables de entorno configuradas en Railway dashboard:
   - `DATABASE_URL` → URL de Neon PostgreSQL
   - `SECRET_KEY` → clave JWT
5. Re-deploy en cada cambio: `railway up --service "control-de-anomalias"`
6. URL producción: `https://anomalias-api-production.up.railway.app` (asignada por Railway)

### Problemas y soluciones en Railway

| Problema | Solución |
|----------|----------|
| "Multiple services found" | Usar flag `--service "control-de-anomalias"` |
| "Project has no services" al setear vars | Correr `railway up` primero para crear el servicio |
| Backend no arrancaba | Procfile + nixpacks.toml con Python 3.11 y comando uvicorn |

---

## Deploy — Vercel (Frontend)

### Herramientas instaladas
- Vercel CLI v54.14.0 (`npm install -g vercel`)

### Pasos realizados

1. `vercel login` — autenticación en terminal del usuario
2. `vercel link` desde `anomalias-front/` → linked al proyecto `anomalias-front` en Vercel
   - Nota: el `.vercel/project.json` se crea en la carpeta del frontend, no en la raíz
3. Variable de entorno configurada: `VITE_API_URL=https://<railway-url>` (en Vercel dashboard)
4. Deploy a producción: `vercel --prod`
5. URL producción: `https://anomalias-front-*.vercel.app`

### Problema y solución en Vercel

| Problema | Solución |
|----------|----------|
| Vercel apuntaba al proyecto equivocado (`logistica-fronted`) | Correr `vercel link` dentro de `anomalias-front/` para crear `.vercel/project.json` local |

---

## Mejoras UI/UX — Skill `ui-ux-pro-max`

Se utilizó el skill **`/ui-ux-pro-max`** (versión 2.6.2) para analizar la interfaz y aplicar mejoras siguiendo sus 99 guías de UX, 50+ estilos, y reglas de accesibilidad. El skill cubre 10 categorías prioritarias: Accesibilidad, Táctil/Interacción, Performance, Estilo, Layout, Tipografía, Animación, Formularios, Navegación, y Charts.

### Reglas aplicadas del skill

| Regla | Categoría | Aplicación |
|-------|-----------|-----------|
| `no-emoji-icons` | Estilo | StatCard: reemplazados 🔴 ✅ 📊 ⚡ por SVG Lucide |
| `aria-labels` + `form-labels` | Accesibilidad | LoginPage: `htmlFor`/`id` en inputs, `role="alert"` en errores |
| `reduced-motion` | Animación | Blobs CSS: `@media (prefers-reduced-motion: reduce)` → animación desactivada |
| `loading-buttons` | Interacción | FilterPanel: `disabled={!isAdmin \|\| loading}` en todos los controles |
| `multi-step-progress` | Formularios | Step progress bar gradient cyan→emerald con connectors animados |
| `duration-timing` | Animación | Transiciones 150–300ms en todos los botones y hover states |
| `number-tabular` | Tipografía | Clase `.num` con `Fira Code` monospace para todos los valores numéricos |
| `sticky-header` | UX | AnomalyTable: `sticky top-0 backdrop-blur-sm` en header de tabla |
| `elevation-consistent` | Estilo | Glassmorphism uniforme: `bg-slate-900/65 backdrop-blur-[16px] border border-white/[0.06]` |

### Componentes rediseñados

**LoginPage:**
- 3 blobs de luz animados en background (cyan `#22d3ee`, violet `#8b5cf6`, red `#FF0033`)
- Animación CSS `blob-drift` con `transform: translate + scale` (GPU-only, no layout reflow)
- Demo cards con icono Lucide por rol: `ShieldCheck` (admin), `Activity` (editor), `Eye` (viewer)
- Tipografía `Fira Code` para el nombre del producto

**StatCard:**
- Icon box con color de variante (cyan, red, emerald, amber) en fondo glassmorphism
- Variantes: `default`, `danger`, `success`, `warning`

**AnomalyTable:**
- Sticky header con blur al hacer scroll
- Max height `max-h-72` con scroll interno
- Severity pills: `● CRÍTICO` (rojo) / `● ALTO` (naranja)

**FilterPanel:**
- `FilterSummaryChip` sobre cada filtro activo con descripción coloreada:
  - Azul → rango numérico con valores exactos
  - Cyan → categorías seleccionadas
  - Violeta → segmentar por (con valores o "todos")

**AdminPanel:**
- Avatar de iniciales con color de rol
- Role badge con borde y fondo por rol
- Inline role selector con Guardar inline
- Eliminación con doble-click de confirmación

---

## Herramientas y Tecnologías Usadas

### Backend
| Herramienta | Uso |
|-------------|-----|
| **FastAPI** | Framework API REST con validación Pydantic automática y docs Swagger |
| **SQLAlchemy** | ORM: modelos `User`, `Analysis`, `Report` + queries |
| **Neon PostgreSQL** | Base de datos serverless cloud con `pool_pre_ping` para reconexión |
| **python-jose** | Tokens JWT HS256, expiración 8h |
| **bcrypt 5.x** | Hash seguro de contraseñas (sin passlib) |
| **pandas** | Limpieza de CSV, detección de separador, deduplicación |
| **numpy** | Cálculos estadísticos Shewhart (mean, std) |
| **uvicorn** | ASGI server para FastAPI |
| **nixpacks** | Build system de Railway — Python 3.11 sin Dockerfile |
| **pytest + httpx** | Test suite SDD — TestClient + SQLite in-memory |

### Frontend
| Herramienta | Uso |
|-------------|-----|
| **Vite** | Build tool — hot reload en dev, bundle optimizado en prod |
| **React 19** | SPA con hooks (useState, useEffect, useMemo, useCallback) |
| **TypeScript** | Tipado estático en todos los componentes y servicios |
| **Tailwind CSS 3** | Estilos utility-first — glassmorphism, dark mode |
| **Plotly.js / react-plotly.js** | Gráficas científicas interactivas (equivalente matplotlib para web) |
| **Lucide React** | SVG icons consistentes (sin emojis) |
| **Vitest** | Unit tests para lógica pura csv.ts |
| **Vercel CLI** | Deploy continuo del frontend estático |

### Infraestructura
| Herramienta | Uso |
|-------------|-----|
| **Railway** | Hosting backend FastAPI — auto-build con nixpacks, env vars |
| **Vercel** | Hosting frontend estático — CDN global, preview por deploy |
| **Neon** | PostgreSQL serverless — auto-suspend, pool_pre_ping para reconexión |
| **GitHub** | Repositorio `zulanil/codigo-vibecoding` — fuente de verdad |

### Skill utilizado
| Skill | Versión | Uso |
|-------|---------|-----|
| **`ui-ux-pro-max`** | 2.6.2 | Análisis de interfaz + aplicación de 99 guías UX: accesibilidad, animación, tipografía, estilos, interacción táctil, charts |

---

## Problemas Técnicos Resueltos

| Problema | Causa | Solución |
|----------|-------|----------|
| CORS bloqueando frontend | `allow_origins` incompleto | `allow_origins=["*"]` en CORS middleware |
| ESM PostCSS error | `"type": "module"` en package.json | Renombrar config `.js` → `.cjs` |
| tsconfig con artifacts Next.js | `.next/` y `"jsx": "preserve"` en tsconfig | Reescribir tsconfig para Vite: `"jsx": "react-jsx"`, `vite-env.d.ts` |
| passlib + bcrypt 5.x | Incompatibilidad de versiones | Usar `import bcrypt` directo sin passlib |
| 872K puntos → 280 MB payload | Sin optimización | Downsampling normales a 3K, anomalías 100% preservadas |
| NaN en JSON (500 error) | `round(nan)` lanza ValueError | Función `_safe()` convierte nan/inf → 0 antes de serializar |
| LCS/LCI invisibles en gráfica | YAxis Recharts auto-domain excluía valores | Migración a Plotly con `shapes` de `xref:'paper'` |
| Multi-métrica sin gráficas | `AnomalyChart` iteraba `colsY` en vez de `results` | Iterar sobre `results` directamente |
| Segmentación sin datos | `mergeResults` usaba `colY` label como key en API response | Campo `originalColY` para lookup correcto en `SeriePunto` |
| Botones sin respuesta durante carga | Sin `disabled={loading}` | `disabled = !isAdmin \|\| loading` en todos los controles de FilterPanel |
| Plotly `Datum` type error | `p[key]` retorna `boolean` asignable a traces | Cast explícito `as string \| number \| null` |
| `@import` CSS inválido | `@import` después de `@tailwind base` | Mover Google Fonts `@import` al tope de `index.css` |
| Vercel proyecto incorrecto | `.vercel/repo.json` en raíz apuntaba a otro proyecto | `vercel link` dentro de `anomalias-front/` |
| Railway "Multiple services found" | Proyecto con múltiples servicios | Flag `--service "control-de-anomalias"` en `railway up` |
| Viewer cambia a editor en tests | Test compartía usuario | Usuario dedicado `roletest@test.com` para test de rol |
| SQLite file lock en Windows | Cleanup antes de dispose | `engine_test.dispose()` + `try/except PermissionError` |

---

## Seguridad implementada

- `POST /api/auth/register` siempre crea `role="viewer"` — nadie puede auto-asignarse admin
- Admin no puede eliminar ni cambiar su propio rol (protección de cuenta)
- Reports no son públicos — requieren JWT válido para cualquier endpoint
- `.env` excluido de git con `.gitignore`
- `SECRET_KEY` y `DATABASE_URL` solo en variables de entorno Railway/Vercel

---

## Variables de Entorno

```env
# anomalias-api (Railway)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
SECRET_KEY="clave-secreta-minimo-32-chars"

# anomalias-front (Vercel)
VITE_API_URL="https://<railway-url>"
```

---

## Comandos de Desarrollo

```bash
# Backend local
cd anomalias-api
.venv\Scripts\uvicorn main:app --reload --port 8000

# Frontend local
cd anomalias-front
npm run dev

# Tests backend (SDD)
cd anomalias-api
.venv\Scripts\pytest tests/ -v

# Tests frontend (unit)
cd anomalias-front
npm test

# Deploy backend
cd anomalias-api
railway up --service "control-de-anomalias"

# Deploy frontend
cd anomalias-front
vercel --prod
```

---

*Proyecto final universitario · Fullstack FastAPI + React + Neon · Deploy Railway + Vercel*
