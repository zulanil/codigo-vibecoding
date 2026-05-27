# CLAUDE.md

Este archivo le da instrucciones a Claude Code (claude.ai/code) para trabajar en este repositorio.

## Documentación de referencia

Leer antes de trabajar en el proyecto:

**Leer ambos documentos antes de cualquier tarea de desarrollo, sin excepción:**

| Documento | Qué define |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Stack, estructura de carpetas, patrones de implementación, endpoints, convenciones de código, flujo de desarrollo |
| [`docs/schema.md`](docs/schema.md) | Tablas, columnas, tipos, restricciones y relaciones de la base de datos |

## Contexto del proyecto

API REST de logística para gestión de envíos de productos tecnológicos. Construida con Django REST Framework siguiendo buenas prácticas (serializers, viewsets, routers, permisos, validaciones en capa correcta).

### Módulos del sistema

| App Django | Entidad | Responsabilidad |
|---|---|---|
| `apps.customers` | Customer | Empresa o persona que genera envíos |
| `apps.shipments` | Shipment | Unidad central de negocio — origen, destino, estado, fecha de entrega, costo calculado |
| `apps.products` | Product | Productos tecnológicos que se envían |
| `apps.transport` | Transport | Medio de entrega de productos al cliente |
| `apps.drivers` | Driver | Persona asignada a un transporte |
| `apps.routes` | Route, RouteStop | Secuencia de paradas de un transporte |
| `apps.warehouses` | Warehouse | Punto de partida y almacenamiento de productos |
| `apps.suppliers` | Supplier | Empresas que venden los productos |

`Shipment` es la entidad central — la mayoría de módulos se relacionan con ella.

## Metodología SDD (Spec Driven Development)

**Este proyecto usa SDD. Para cualquier módulo nuevo o tarea de desarrollo, seguir el flujo de los agentes en orden estricto.**

### Flujo obligatorio

```
@spec <módulo>  →  @implement <módulo>  →  @validator <módulo>
```

1. **`@spec`** — Lee `docs/architecture.md`, `docs/schema.md` y `docs/mvp-scope.md`. Genera `spec/<módulo>.md` con lista exacta de tareas.
2. **`@implement`** — Lee `spec/<módulo>.md` y escribe el código Django del módulo (model, admin, serializer, viewset, urls).
3. **`@validator`** — Revisa el código implementado contra el spec y los docs. Si hay errores, crea `spec/<módulo>-validation-report.md`. Si está OK, confirma con mensaje.
4. Si el validator reporta errores → volver a `@implement` con el reporte → volver a `@validator`.

### Agente Orquestador

El agente **`@orchestrator`** coordina el flujo completo. Para desarrollar un módulo de principio a fin:

```
@orchestrator customers
```

El orquestador invocará a `@spec`, `@implement` y `@validator` en el orden correcto, incluyendo el loop de corrección si el validator encuentra errores.

### Archivos del sistema SDD

| Carpeta/Archivo | Propósito |
|---|---|
| `.claude/agents/orchestrator.md` | Coordinador del flujo SDD |
| `.claude/agents/spec.md` | Genera specs por módulo |
| `.claude/agents/implement.md` | Implementa código desde spec |
| `.claude/agents/validator.md` | Valida implementación |
| `spec/<módulo>.md` | Tareas de implementación del módulo |
| `spec/<módulo>-validation-report.md` | Errores encontrados por el validator |
| `docs/mvp-scope.md` | Alcance del MVP |

### Regla de oro

**Nunca implementar código sin spec. Nunca entregar código sin validación.**

---

## Skills activos

**django-skills:** este proyecto usa el marketplace `saaspegasus/django-skills`. Siempre usar las skills de Django disponibles al trabajar con modelos, vistas, serializers, migraciones, URLs o cualquier tarea relacionada con Django/DRF.

## Reglas del proyecto

**Idioma — comunicación y documentación:** todo texto dirigido a personas (comentarios explicativos, documentación, mensajes de respuesta, este archivo) se escribe en **español**.

**Idioma — código:** todo lo relacionado con desarrollo se escribe en **inglés**: nombres de variables, funciones, clases, archivos, carpetas, tablas de base de datos, columnas, ramas de git, endpoints, etc.

**Entorno virtual:** antes de ejecutar cualquier comando dentro del proyecto, siempre activar el entorno virtual (`.venv\Scripts\activate` en Windows).

**Servidor de desarrollo:** Claude **nunca** ejecuta `python manage.py runserver`. Ese comando lo corre el desarrollador manualmente. Todos los demás comandos (`migrate`, `test`, `shell`, etc.) sí puede ejecutarlos Claude cuando sea necesario.

## Stack

Python 3.14 · Django 6.0.5 · Django REST Framework 3.17.1 · simplejwt · drf-spectacular · django-filter · django-cors-headers · SQLite (desarrollo) · PostgreSQL (producción) · python-decouple

## Comandos

Todos los comandos se ejecutan desde la raíz del repo con `.venv` activo.

```bash
# Activar venv (Windows)
.venv\Scripts\activate

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Correr todos los tests
python manage.py test

# Correr tests de una sola app
python manage.py test apps.shipments

# Shell de Django
python manage.py shell

# Crear superusuario
python manage.py createsuperuser
```

## Arquitectura

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── base.py          ← settings comunes (DJANGO_SETTINGS_MODULE=config.settings.development)
│   │   ├── development.py   ← SQLite, DEBUG=True
│   │   └── production.py    ← PostgreSQL, DEBUG=False
│   └── urls.py              ← URL raíz (/api/v1/)
├── apps/                    ← todas las apps de dominio
│   ├── customers/
│   ├── suppliers/
│   ├── warehouses/
│   ├── products/
│   ├── drivers/
│   ├── transport/
│   ├── routes/
│   └── shipments/
├── docs/                    ← documentación del proyecto
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── .env                     ← nunca commitear
├── .env.example             ← sí commitear
└── manage.py
```

Cada app tiene: `models.py` → `serializers.py` → `views.py` (ModelViewSet) → `urls.py` (router) → `admin.py` → `tests/`

## Convenciones

- Variables de entorno con `python-decouple` (`from decouple import config`) — nunca hardcodear secrets
- `is_active = BooleanField(default=True)` en modelos — soft delete, ViewSets filtran `is_active=True`
- `db_table` explícito en `Meta` de cada modelo — coincide con `docs/schema.md`
- `select_related` / `prefetch_related` obligatorio en querysets con FK
- Settings de entorno: `DJANGO_SETTINGS_MODULE=config.settings.development` (dev) / `config.settings.production` (prod)
