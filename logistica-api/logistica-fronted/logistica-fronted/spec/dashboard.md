# Spec: Dashboard

## Información del módulo

- Ruta Next.js: `app/(dashboard)/dashboard/page.tsx`
- Componentes nuevos: `components/dashboard/KpiCard.tsx`, `components/dashboard/DashboardCharts.tsx`, `components/dashboard/charts/ShipmentStatusChart.tsx`, `components/dashboard/charts/ShipmentsOverTimeChart.tsx`, `components/dashboard/charts/RevenueOverTimeChart.tsx`, `components/dashboard/charts/TopCustomersChart.tsx`
- Helper nuevo: `lib/api/dashboard.ts`
- Dependencias: `lib/api/shipments.ts`, `lib/api/customers.ts`, `lib/api/drivers.ts`, `lib/api/transports.ts`, `lib/types/index.ts`

## API utilizada

- `GET /shipments/` — con `?status=` y `?page=` para KPIs y gráficos
- `GET /customers/` — para KPI count y para resolver nombres en TopCustomers
- `GET /drivers/?status=available` — KPI conductores disponibles
- `GET /transports/?status=available` — KPI vehículos disponibles
- Todos los endpoints devuelven `PaginatedResponse<T>` con campo `count`
- Paginación: 20 items/página, param `?page=N`

## Rutas / páginas

- `/dashboard` → `DashboardPage` (Server Component, reemplaza el placeholder)

## Árbol de componentes

```
DashboardPage (Server Component — solo layout, SIN fetch)
  ├── DashboardKpis (Client Component 'use client')
  │     ├── KpiCard x6 (presentacional, sin hooks)
  │     └── TanStack Query para los 5 counts + fetchAllPages para ingresos
  └── DashboardCharts (Client Component 'use client')
        ├── filtro de fechas — dos <input type="date"> con state dateFrom/dateTo
        ├── ShipmentStatusChart (Client Component 'use client') — DonutChart
        ├── ShipmentsOverTimeChart (Client Component 'use client') — AreaChart
        ├── RevenueOverTimeChart (Client Component 'use client') — AreaChart
        └── TopCustomersChart (Client Component 'use client') — BarChart horizontal
```

**IMPORTANTE — por qué NO fetch en Server Component:**
`lib/api/client.ts` usa `document.cookie` para leer el token. En Server Components `document` no existe → token siempre `null` → 401. Todo fetch va en Client Components con TanStack Query (ejecuta en el browser).

## Estado

- Pendiente de aprobación

## Estado y flujo de datos

### KPIs (en DashboardPage — Server Component)
- Los 5 KPIs de count se obtienen con una sola llamada `page=1` y leyendo `response.count`
- KPI de ingresos totales requiere `fetchAllPages` sobre todos los shipments para sumar `shipping_cost`
- Los KPIs se renderizan directamente en el Server Component — sin TanStack Query ni estado

### Gráficos (en DashboardCharts — Client Component)
- Dos queries TanStack: `['dashboard-shipments-all']` y `['dashboard-customers-all']`
- Ambas usan `fetchAllPages` para traer todos los registros
- El filtro de fechas es estado local (`useState`) en `DashboardCharts`
- El filtrado por fecha se aplica client-side sobre los datos ya cargados antes de computar los gráficos

## Casos borde

- Lista vacía de shipments: mostrar KPIs en 0 y gráficos vacíos con mensaje "Sin datos"
- Estado `isLoading` en gráficos: mostrar skeleton o spinner dentro del contenedor del gráfico
- Estado `isError` en gráficos: mostrar mensaje de error dentro del contenedor del gráfico
- `shipping_cost` es string (DecimalField): usar `parseFloat()` solo para sumar, nunca tipar como `number`
- `fetchAllPages` puede hacer muchas peticiones si hay miles de registros — aceptable para MVP

---

## Tareas

### 1. Helper generico — `lib/api/dashboard.ts`

- [x] Crear archivo `lib/api/dashboard.ts`
- [x] Definir y exportar la funcion generica `fetchAllPages<T>` con firma: `(fetcher: (page: string) => Promise<PaginatedResponse<T>>) => Promise<T[]>`
- [x] La funcion llama a `fetcher('1')` para obtener la primera pagina
- [x] Extrae `count` y `results` de la primera respuesta
- [x] Calcula el numero total de paginas: `Math.ceil(count / 20)`
- [x] Si hay mas de una pagina, construye un array de Promises `fetcher('2')` ... `fetcher(N)` y ejecuta con `Promise.all`
- [x] Concatena los `results` de todas las paginas y los devuelve como `T[]`
- [x] Importar `PaginatedResponse` desde `@/lib/types`
- [x] No importar `apiClient` directamente — recibe el fetcher como parametro para ser reutilizable

### 2. Componente KpiCard — `components/dashboard/KpiCard.tsx`

- [x] Crear archivo `components/dashboard/KpiCard.tsx`
- [x] Componente Server Component (sin `'use client'`)
- [x] Props tipadas con interfaz local `KpiCardProps`: `title: string`, `value: string | number`, `subtitle?: string`, `icon?: React.ReactNode`
- [x] Usar `Card`, `CardHeader`, `CardTitle`, `CardContent` de `@/components/ui/card`
- [x] Mostrar `icon` en la cabecera alineado a la derecha si se provee
- [x] Mostrar `title` como `CardTitle` en tamaño `text-sm font-medium text-muted-foreground`
- [x] Mostrar `value` en tamaño `text-2xl font-bold`
- [x] Mostrar `subtitle` en tamaño `text-xs text-muted-foreground` si se provee
- [x] No usar Recharts en este componente

### 3. Grafico de estado de envios — `components/dashboard/charts/ShipmentStatusChart.tsx`

- [x] Crear archivo `components/dashboard/charts/ShipmentStatusChart.tsx`
- [x] Agregar directiva `'use client'` en la primera linea
- [x] Props: `data: Shipment[]`
- [x] Importar `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`, `ResponsiveContainer` desde `recharts`
- [x] Importar `Shipment`, `ShipmentStatus` desde `@/lib/types`
- [x] Computar dentro del componente la distribucion: agrupar `data` por `status`, contar items por grupo
- [x] Construir array `chartData: { name: ShipmentStatus; value: number }[]` con los 5 estados posibles (incluir los que tienen value 0)
- [x] Definir mapa de colores constante `STATUS_COLORS` con los valores exactos: `pending: '#9ca3af'`, `assigned: '#3b82f6'`, `in_transit: '#eab308'`, `delivered: '#22c55e'`, `cancelled: '#ef4444'`
- [x] Renderizar `ResponsiveContainer` con `width="100%"` y `height={300}`
- [x] Dentro: `PieChart` > `Pie` con `data={chartData}`, `dataKey="value"`, `nameKey="name"`, `innerRadius={60}`, `outerRadius={100}`, `paddingAngle={3}`
- [x] Cada `Cell` recibe `fill` del mapa `STATUS_COLORS` segun `entry.name`
- [x] Agregar `Tooltip` y `Legend`
- [x] Si `data.length === 0` renderizar `<p className="text-center text-muted-foreground text-sm">Sin datos</p>` en lugar del grafico

### 4. Grafico de envios por mes — `components/dashboard/charts/ShipmentsOverTimeChart.tsx`

- [x] Crear archivo `components/dashboard/charts/ShipmentsOverTimeChart.tsx`
- [x] Agregar directiva `'use client'` en la primera linea
- [x] Props: `data: Shipment[]`
- [x] Importar `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` desde `recharts`
- [x] Importar `Shipment` desde `@/lib/types`
- [x] Computar dentro del componente la agrupacion: para cada shipment extraer `created_at.substring(0, 7)` (formato `YYYY-MM`), contar items por mes
- [x] Ordenar el array resultante `chartData: { month: string; count: number }[]` por `month` ascendente
- [x] Renderizar `ResponsiveContainer` con `width="100%"` y `height={300}`
- [x] Dentro: `AreaChart data={chartData}` > `CartesianGrid strokeDasharray="3 3"` + `XAxis dataKey="month"` + `YAxis` + `Tooltip` + `Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#bfdbfe"`
- [x] Si `data.length === 0` renderizar `<p className="text-center text-muted-foreground text-sm">Sin datos</p>`

### 5. Grafico de ingresos por mes — `components/dashboard/charts/RevenueOverTimeChart.tsx`

- [x] Crear archivo `components/dashboard/charts/RevenueOverTimeChart.tsx`
- [x] Agregar directiva `'use client'` en la primera linea
- [x] Props: `data: Shipment[]`
- [x] Importar `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` desde `recharts`
- [x] Importar `Shipment` desde `@/lib/types`
- [x] Computar dentro del componente: para cada shipment extraer `created_at.substring(0, 7)`, acumular `parseFloat(shipment.shipping_cost)` por mes
- [x] Construir `chartData: { month: string; revenue: number }[]` ordenado por `month` ascendente
- [x] Renderizar `ResponsiveContainer` con `width="100%"` y `height={300}`
- [x] Dentro: `AreaChart data={chartData}` > `CartesianGrid strokeDasharray="3 3"` + `XAxis dataKey="month"` + `YAxis` + `Tooltip` + `Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#bbf7d0"`
- [x] Si `data.length === 0` renderizar `<p className="text-center text-muted-foreground text-sm">Sin datos</p>`

### 6. Grafico top 10 clientes — `components/dashboard/charts/TopCustomersChart.tsx`

- [x] Crear archivo `components/dashboard/charts/TopCustomersChart.tsx`
- [x] Agregar directiva `'use client'` en la primera linea
- [x] Props: `shipments: Shipment[]`, `customers: Customer[]`
- [x] Importar `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Cell`, `ResponsiveContainer` desde `recharts`
- [x] Importar `Shipment`, `Customer` desde `@/lib/types`
- [x] Computar dentro del componente: contar shipments por `customer` (id numerico)
- [x] Construir mapa `Map<number, string>` de `customer.id` a `customer.name` a partir del array `customers`
- [x] Ordenar por count descendente, tomar los primeros 10
- [x] Construir `chartData: { name: string; count: number }[]` usando el nombre del cliente (fallback: `"Cliente #${id}"` si no se encuentra en el mapa)
- [x] Renderizar `ResponsiveContainer` con `width="100%"` y `height={350}`
- [x] Dentro: `BarChart data={chartData} layout="vertical"` > `XAxis type="number"` + `YAxis dataKey="name" type="category" width={120}` + `Tooltip` + `Bar dataKey="count" fill="#3b82f6"` con `Cell` de color `#3b82f6` para cada barra
- [x] Si `shipments.length === 0` renderizar `<p className="text-center text-muted-foreground text-sm">Sin datos</p>`

### 7. KPIs — `components/dashboard/DashboardKpis.tsx`

- [x] Crear archivo `components/dashboard/DashboardKpis.tsx`
- [x] Agregar directiva `'use client'` en la primera linea
- [x] Sin props externas — obtiene todos sus datos via TanStack Query
- [x] Importar `useQuery` desde `@tanstack/react-query`
- [x] Importar `getShipments` desde `@/lib/api/shipments`
- [x] Importar `getDrivers` desde `@/lib/api/drivers`
- [x] Importar `getTransports` desde `@/lib/api/transports`
- [x] Importar `getCustomers` desde `@/lib/api/customers`
- [x] Importar `fetchAllPages` desde `@/lib/api/dashboard`
- [x] Importar `Shipment` desde `@/lib/types`
- [x] Importar `KpiCard` desde `@/components/dashboard/KpiCard`
- [x] Query `['kpi-total-shipments']`: `getShipments({ page: '1' })` — leer `.count`
- [x] Query `['kpi-in-transit']`: `getShipments({ status: 'in_transit', page: '1' })` — leer `.count`
- [x] Query `['kpi-available-drivers']`: `getDrivers({ status: 'available', page: '1' })` — leer `.count`
- [x] Query `['kpi-available-transports']`: `getTransports({ status: 'available', page: '1' })` — leer `.count`
- [x] Query `['kpi-active-customers']`: `getCustomers({ page: '1' })` — leer `.count`
- [x] Query `['kpi-revenue']`: `fetchAllPages<Shipment>((page) => getShipments({ page }))` — acumular `parseFloat(s.shipping_cost)`, result = `totalRevenue.toFixed(2)`; `staleTime: 5 * 60 * 1000`
- [x] Mientras cualquier query esta en `isLoading`: renderizar 6 skeleton placeholders `<div className="h-28 animate-pulse rounded-lg bg-muted" />`
- [x] Cuando los datos estan disponibles: renderizar grilla `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` con los 6 `KpiCard`:
  - `title="Total envios"`, `value={totalShipments?.count ?? 0}`
  - `title="En transito"`, `value={inTransit?.count ?? 0}`
  - `title="Ingresos totales"`, `value={\`$${totalRevenue}\`}`
  - `title="Conductores disponibles"`, `value={availableDrivers?.count ?? 0}`
  - `title="Vehiculos disponibles"`, `value={availableTransports?.count ?? 0}`
  - `title="Clientes activos"`, `value={activeCustomers?.count ?? 0}`

### 8. Orquestador de graficos — `components/dashboard/DashboardCharts.tsx`

- [x] Crear archivo `components/dashboard/DashboardCharts.tsx`
- [x] Agregar directiva `'use client'` en la primera linea
- [x] Sin props (obtiene todos sus datos via TanStack Query)
- [x] Importar `useQuery` desde `@tanstack/react-query`
- [x] Importar `useState` desde `react`
- [x] Importar `fetchAllPages` desde `@/lib/api/dashboard`
- [x] Importar `getShipments` desde `@/lib/api/shipments`
- [x] Importar `getCustomers` desde `@/lib/api/customers`
- [x] Importar `Shipment`, `Customer` desde `@/lib/types`
- [x] Importar los 4 componentes de graficos desde sus rutas respectivas
- [x] Definir query con key `['dashboard-shipments-all']`: llama `fetchAllPages<Shipment>((page) => getShipments({ page }))`, `staleTime: 5 * 60 * 1000`
- [x] Definir query con key `['dashboard-customers-all']`: llama `fetchAllPages<Customer>((page) => getCustomers({ page }))`, `staleTime: 5 * 60 * 1000`
- [x] Definir estado local `dateFrom: string` inicializado en `''` via `useState`
- [x] Definir estado local `dateTo: string` inicializado en `''` via `useState`
- [x] Definir variable `filteredShipments: Shipment[]`: si `dateFrom` o `dateTo` tienen valor, filtrar `shipments` donde `shipment.created_at.substring(0, 10) >= dateFrom` (cuando `dateFrom !== ''`) y `<= dateTo` (cuando `dateTo !== ''`); si ambos estan vacios, usar todos los shipments sin filtrar
- [x] Renderizar seccion de filtro: dos `<input type="date">` con `value={dateFrom}` y `value={dateTo}`, sus handlers `onChange` actualizan el estado respectivo; boton "Limpiar" que resetea ambos a `''`
- [x] Mostrar estado de carga con texto "Cargando datos..." si cualquier query esta en `isLoading`
- [x] Mostrar estado de error con texto "Error al cargar los datos del dashboard" si cualquier query tiene `isError`
- [x] Renderizar una grilla `grid grid-cols-1 md:grid-cols-2 gap-6` con los 4 graficos cuando los datos esten disponibles
- [x] Pasar `filteredShipments` a `ShipmentStatusChart`, `ShipmentsOverTimeChart`, `RevenueOverTimeChart`
- [x] Pasar `filteredShipments` y `customers ?? []` a `TopCustomersChart`
- [x] Cada grafico va envuelto en un `Card` con `CardHeader` (titulo) y `CardContent`

### 9. Pagina principal — `app/(dashboard)/dashboard/page.tsx`

- [x] Reemplazar el contenido actual del archivo con el nuevo componente
- [x] Componente Server Component (sin `'use client'`) — solo layout, sin fetch ni hooks
- [x] Importar `DashboardKpis` desde `@/components/dashboard/DashboardKpis`
- [x] Importar `DashboardCharts` desde `@/components/dashboard/DashboardCharts`
- [x] Renderizar `<div className="p-6 space-y-6">`
- [x] Dentro: `<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>`
- [x] Renderizar `<DashboardKpis />` (Client Component, maneja sus propios datos via TanStack Query)
- [x] Renderizar `<DashboardCharts />` debajo de los KPIs (Client Component, maneja sus propios datos via TanStack Query)

### 10. Verificacion de tipos e imports

- [x] Confirmar que `Shipment` y `Customer` estan exportados desde `@/lib/types` (ya estan en `lib/types/index.ts`)
- [x] Confirmar que `Card`, `CardHeader`, `CardTitle`, `CardContent` existen en `@/components/ui/card` (ya esta instalado)
- [x] Confirmar que `recharts` esta instalado verificando que existe en `node_modules/recharts` (ya ejecutado `npm install recharts`)
- [x] Confirmar que `getShipments` acepta el parametro `status` — verificar firma en `lib/api/shipments.ts` (ya tiene `status?: string` en `GetShipmentsParams`)
- [x] Confirmar que `getDrivers` acepta el parametro `status` — verificar firma en `lib/api/drivers.ts` (ya tiene `status?: string`)
- [x] Confirmar que `getTransports` acepta el parametro `status` — verificar firma en `lib/api/transports.ts` (ya tiene `status?: string`)

### 10. Criterios de aceptacion

- [x] Los 6 KPI cards muestran valores numericos reales (no ceros hardcodeados)
- [x] El DonutChart muestra la distribucion de envios por los 5 estados posibles con los colores especificados
- [x] El primer AreaChart muestra la cantidad de envios agrupada por mes
- [x] El segundo AreaChart muestra los ingresos agrupados por mes (suma de `shipping_cost`)
- [x] El BarChart horizontal muestra los top 10 clientes por cantidad de envios con nombres resueltos
- [x] El filtro de fechas afecta los 4 graficos al filtrar los shipments antes del computo
- [x] El boton "Limpiar" del filtro resetea ambas fechas y los graficos vuelven a mostrar todos los datos
- [x] El `page.tsx` no tiene `'use client'` — es Server Component sin fetch ni hooks
- [x] `DashboardKpis` tiene `'use client'` — es Client Component con TanStack Query
- [x] `DashboardCharts` tiene `'use client'` — es Client Component
- [x] Los 4 graficos tienen `'use client'` — son Client Components
- [x] `KpiCard` no tiene `'use client'` — es Server Component
- [x] `DashboardCharts` tiene `'use client'`
- [x] El Sidebar existente en `components/dashboard/Sidebar.tsx` no fue modificado
- [x] No se uso `fetch` nativo — todas las llamadas usan `apiClient` via las funciones de `lib/api/*.ts`
- [x] No se tiparon campos `shipping_cost` como `number` — se usa `parseFloat()` solo para calcular
