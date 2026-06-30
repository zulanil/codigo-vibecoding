# Control de Anomalías — Documentación del Proyecto
**Proyecto Final · Desarrollo Fullstack**

---

## Descripción General

Sistema web para detección automática de anomalías en datasets industriales o científicos. Implementa la metodología estadística de **Cartas de Control Shewhart** (Media ± σ) con una interfaz moderna de análisis, roles de usuario, y persistencia en base de datos cloud.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy |
| Base de datos | PostgreSQL en Neon (serverless) |
| Autenticación | JWT con python-jose (HS256, 8 horas) |
| Hash contraseñas | bcrypt 5.x (directo, sin passlib) |
| Frontend | Vite + React 19 + TypeScript |
| Estilos | Tailwind CSS 3 (glassmorphism dark mode) |
| Gráficas | Plotly.js / react-plotly.js |
| Testing Backend | pytest + httpx + FastAPI TestClient |
| Testing Frontend | Vitest |
| Deploy DB | Neon (serverless PostgreSQL, pool_pre_ping) |

---

## Arquitectura

```
anomalias-front/          ← SPA React + TypeScript
  src/
    components/           ← UI: Chart, Table, Cards, Forms
    contexts/             ← AuthContext (JWT en localStorage)
    services/             ← api.ts (fetch + auth headers)
    utils/                ← csv.ts (parse, filter, merge)
    types/                ← TypeScript interfaces

anomalias-api/            ← API REST FastAPI
  main.py                 ← app, CORS, startup, endpoints
  analytics.py            ← lógica Shewhart + downsampling
  models.py               ← User, Analysis (SQLAlchemy)
  database.py             ← engine Neon + get_db
  auth/
    jwt.py                ← hash/verify/token
    dependencies.py       ← get_current_user, require_role
    router.py             ← /api/auth/*
  schemas.py              ← Pydantic models
  tests/                  ← SDD test suite
```

---

## Funcionalidades Implementadas

### Autenticación y Roles

El sistema tiene 3 roles con permisos diferenciados:

| Rol | Permisos |
|-----|---------|
| **Admin** | Todo: cargar CSV, analizar, ajustar sigma (1-5σ), gestionar usuarios, cambiar roles |
| **Editor** | Cargar CSV, analizar datos, sigma fijo en 3.0 |
| **Viewer** | Solo lectura — sin acceso a análisis |

Usuarios demo creados al iniciar el servidor:
- `admin@anomalias.com` / `admin123`
- `editor@anomalias.com` / `editor123`
- `viewer@anomalias.com` / `viewer123`

### Flujo de Análisis

1. **Cargar CSV** → `/api/limpiar` → detección automática de separador (`,` o `;`), deduplicación, preview 10 filas
2. **Seleccionar columnas** → columna X (referencia) + 1 o más columnas Y (métricas)
3. **Configurar filtros** → filtros multicategoría: rango numérico, texto, categorías
4. **Analizar** → `/api/procesar` → Shewhart sobre dataset completo + downsampling para frontend
5. **Visualización** → gráfica Plotly interactiva + tabla de anomalías paginada + KPI cards

### Motor Shewhart (analytics.py)

El cálculo se realiza sobre el dataset **completo** para garantizar precisión estadística:

```
Media (μ) = promedio de todos los valores
Desviación estándar (σ) = std de todos los valores
LCS (Límite Control Superior) = μ + sigma × σ
LCI (Límite Control Inferior) = μ - sigma × σ
Anomalía si: valor > LCS  o  valor < LCI
```

**Optimización de rendimiento** para datasets grandes (872,815 puntos):
- Los estadísticos se calculan sobre el 100% de los datos
- Los puntos normales se downsamplea a máximo 3,000 puntos (muestreo uniforme)
- Las anomalías se preservan **completamente** en el payload
- Resultado: payload JSON pasa de ~280 MB a ~500 KB

### Persistencia en Neon

Cada análisis guarda metadatos en la tabla `analyses`:

| Campo | Descripción |
|-------|-------------|
| `user_id` | Usuario que ejecutó el análisis |
| `col_x` / `col_y` | Columnas analizadas |
| `sigma` | Multiplicador sigma usado |
| `total_puntos` | Puntos originales en dataset |
| `total_anomalias` | Anomalías detectadas |
| `puntos_display` | Puntos enviados al frontend |
| `downsampled` | Si se aplicó downsampling |
| `media` / `lcs` / `lci` | Estadísticos calculados |
| `created_at` | Timestamp UTC |

---

## API Endpoints

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| `GET` | `/` | No | — | Health check |
| `POST` | `/api/auth/register` | No | — | Crear cuenta |
| `POST` | `/api/auth/login` | No | — | Login → JWT |
| `GET` | `/api/auth/me` | Sí | todos | Perfil actual |
| `GET` | `/api/auth/users` | Sí | admin | Listar usuarios |
| `PATCH` | `/api/auth/users/{id}/role` | Sí | admin | Cambiar rol |
| `POST` | `/api/limpiar` | Sí | admin, editor | Limpiar CSV |
| `POST` | `/api/procesar` | Sí | admin, editor | Análisis Shewhart |

Documentación interactiva disponible en: `http://localhost:8000/docs`

---

## Gráfica de Control — Plotly.js

La visualización usa **Plotly.js** (equivalente científico de matplotlib en JavaScript):

- **Línea continua** → puntos normales (downsampled)
- **Marcadores rojos** → anomalías detectadas (100% preservadas)
- **Banda sombreada** → zona entre LCI y LCS
- **Líneas de control** → LCS (rojo), LCI (rojo), μ (color de la métrica)
- **Anotaciones** → etiquetas con valor exacto de cada límite
- **Interactividad** → zoom, pan, hover con detalle, exportar PNG

---

## Tests — Spec-Driven Development (SDD)

La metodología SDD valida cada endpoint contra su especificación OpenAPI (generada automáticamente por FastAPI en `/docs`). Los tests usan SQLite en memoria para independencia de Neon.

### Backend (pytest)

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

**Total backend: 30 tests** ✅ (30/30 pasan)

---

### Frontend (Vitest)

Tests unitarios sobre la lógica pura de `src/utils/csv.ts`:

#### `csv.test.ts` — 13 tests

| Función | Tests |
|---------|-------|
| `parseCsv` | Parsea cabecera/filas, devuelve [] sin datos, elimina comillas |
| `getUniqueValues` | Valores únicos de columna, orden numérico correcto |
| `applyFilters` | Sin filtros devuelve original, rango min/max, solo min, texto case-insensitive, categoría vacía, categoría con selección |
| `mergeResults` | Combina 2 columnas Y por colX, incluye flag anomalia por columna |

**Total frontend: 13 tests** ✅ (13/13 pasan)

**Estrategia de testing elegida:**
- ✅ **Unit tests** (Vitest) — lógica pura testeable en csv.ts
- ⚠️ **Integration** — no necesario, flujo simple cubierto con tests manuales
- ❌ **E2E** (Cypress/Playwright) — overhead no justificado para proyecto universitario de esta escala

---

## Problemas Técnicos Resueltos

| Problema | Causa | Solución |
|----------|-------|----------|
| CORS bloqueando :5173 | FastAPI allow_origins incompleto | Agregado `http://localhost:5173` a allow_origins |
| ESM PostCSS error | `"type": "module"` en package.json | Renombrar `.js` → `.cjs` para postcss y tailwind config |
| tsconfig Next.js en proyecto Vite | Artifacts `.next/` incluidos en tsconfig | Reescribir tsconfig: `"jsx": "react-jsx"`, excluir `.next`, agregar `vite-env.d.ts` |
| passlib + bcrypt 5.x | Incompatibilidad de versiones | Eliminar passlib, usar `import bcrypt` directo |
| ModuleNotFoundError fastapi | uvicorn fuera del venv | Instalar con `.venv\Scripts\pip install` |
| 872K puntos → latencia extrema | Payload JSON ~280 MB | Downsampling normales a 3K, anomalías 100% preservadas |
| LCS/LCI no visibles | YAxis Recharts auto-domain excluía valores | Migración a Plotly con `shapes` independientes del dominio |
| Botones sin respuesta | Race condition sin `disabled={loading}` | `disabled = !isAdmin \|\| loading` en FilterPanel |
| Plotly `Datum` type error | `p[key]` retorna `boolean` (flag anomalia) | Cast explícito `as string \| number \| null` en traces x/y |
| `@import` inválido en CSS | `@import` después de `@tailwind base` | Mover Google Fonts `@import` al tope del archivo |
| Viewer cambia a editor en tests | `test_change_role_admin` modificaba `viewer@test.com` | Usuario dedicado `roletest@test.com` para test de rol |
| SQLite file lock en Windows | Cleanup antes de dispose | `engine_test.dispose()` + `try/except PermissionError` |

---

## Mejoras UI/UX — ui-ux-pro-max

Análisis y mejoras aplicadas con metodología ui-ux-pro-max:

### LoginPage — rediseño visual
- Blobs de luz animados en background (cyan, violet, red) con CSS puro
- `prefers-reduced-motion` respetado (blobs estáticos si usuario lo prefiere)
- `role="alert"` en error, `htmlFor`/`id` en inputs para accesibilidad
- Lucide SVG icons en demo cards (ShieldCheck, Activity, Eye por rol)
- Tipografía `Fira Code` para nombre del producto (`Control de Anomalías`)

### StatCard — eliminación de emojis
- Reemplazados emojis (🔴 ✅ 📊 📈 ⚡) por SVG Lucide (`AlertCircle`, `BarChart2`, `Activity`, `Zap`)
- Icon box glassmorphism con color de variante (cyan, red, emerald, amber)
- Regla aplicada: `no-emoji-icons` del skill (SVG icons, no emojis)

### Step Indicator — progress bar
- Progress bar gradient `cyan → emerald` animada con `transition-all duration-500`
- Chips rediseñados: número circular para pasos pendientes, checkmark para completados
- Conector entre pasos cambia de color según progreso

### AnomalyTable — UX de datos
- `sticky top-0` en header con `backdrop-blur-sm` para scroll largo
- Scroll vertical `max-h-72` — tabla no ocupa pantalla completa
- Severity badges como pills coloreados (`● CRÍTICO` / `● ALTO`)
- Números con `.toFixed(4)` y clase `num` (Fira Code monospace)
- Hover row `hover:bg-red-500/8` más visible

### Tipografía — Fira Code
- Google Fonts cargado via `@import` al tope de `index.css`
- Clase `.num` usa `'Fira Code', 'Courier New', monospace`
- Aplicado en: StatCard valores, AnomalyTable celdas numéricas, LoginPage branding

---

## Variables de Entorno Requeridas

```env
# anomalias-api/.env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
SECRET_KEY="clave-secreta-minimo-32-chars"
```

> **Seguridad:** Nunca commitear `.env`. El `.gitignore` ya lo excluye.
> Rotar contraseña en Neon: Settings → Reset password.

---

## Comandos de Desarrollo

```bash
# Backend
cd anomalias-api
.venv\Scripts\uvicorn main:app --reload --port 8000

# Frontend
cd anomalias-front
npm run dev

# Tests backend (SDD)
cd anomalias-api
.venv\Scripts\pytest tests/ -v

# Tests frontend (unit)
cd anomalias-front
npm test
```

---

*Generado para proyecto final universitario · Fullstack FastAPI + React + Neon*
