import { useState, useMemo } from 'react'
import { RotateCcw, ArrowLeft, ShieldAlert, BarChart2, Activity, AlertCircle, Zap } from 'lucide-react'
import type { AnalysisResult, FilterConfig, MergedPoint } from './types'
import { useAuth } from './contexts/AuthContext'
import { limpiarCSV, procesarDatos } from './services/api'
import { applyFilters, mergeResults, getUniqueValues } from './utils/csv'
import LoginPage from './components/LoginPage'
import LoginBar from './components/LoginBar'
import StatCard from './components/StatCard'
import FileUpload from './components/FileUpload'
import ColumnSelector from './components/ColumnSelector'
import FilterPanel from './components/FilterPanel'
import AnomalyChart from './components/AnomalyChart'
import AnomalyTable from './components/AnomalyTable'

type Step = 1 | 2 | 3 | 4

const STEP_LABELS = ['Cargar CSV', 'Columnas', 'Filtros', 'Resultado']

function uid() { return Math.random().toString(36).slice(2, 9) }

export default function App() {
  const { user } = useAuth()

  // ── Si no hay sesión → pantalla de login ────────────────────────────────
  if (!user) return <LoginPage />

  const role = user.role  // 'admin' | 'editor' | 'viewer'
  const canEdit = role === 'admin' || role === 'editor'
  const isAdmin = role === 'admin'

  // ── Viewer sin acceso de edición → mensaje ───────────────────────────────
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-slate-950">
        <LoginBar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <ShieldAlert className="mx-auto text-amber-400" size={48} strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-200">Acceso de solo lectura</h2>
          <p className="text-slate-500 text-sm">
            Tu rol <span className="text-slate-300 font-medium">Visualizador</span> no tiene permiso
            para cargar datos ni ejecutar análisis. Un Admin o Editor debe compartirte un reporte.
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-600 text-left">
            <p className="font-semibold text-slate-400 mb-2">Roles disponibles:</p>
            <p>🔵 <b className="text-cyan-400">Admin</b> — acceso total, gestión de usuarios, sigma ajustable</p>
            <p>🟣 <b className="text-violet-400">Editor</b> — carga CSV, filtra y analiza anomalías</p>
            <p>⚪ <b className="text-slate-400">Viewer</b> — visualiza reportes compartidos (tú)</p>
          </div>
        </div>
      </div>
    )
  }

  return <Dashboard role={role} isAdmin={isAdmin} />
}

// ── Dashboard (solo admin + editor) ──────────────────────────────────────────
function Dashboard({ role, isAdmin }: { role: 'admin' | 'editor'; isAdmin: boolean }) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [csvLimpio, setCsvLimpio] = useState('')
  const [columnas, setColumnas] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string | number>[]>([])
  const [colX, setColX] = useState('')
  const [colsY, setColsY] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [sigma, setSigma] = useState(3.0)
  const [results, setResults] = useState<AnalysisResult[]>([])

  const mergedData = useMemo<MergedPoint[]>(
    () => (results.length > 0 ? mergeResults(results, colX) : []),
    [results, colX]
  )

  async function handleUpload(file: File) {
    setError(null); setLoading(true)
    try {
      const resp = await limpiarCSV(file)
      setCsvLimpio(resp.datos_limpios); setColumnas(resp.columnas); setPreview(resp.preview)
      setStep(2)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  function toggleColY(col: string) {
    setColsY(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
  }

  function addFilter() {
    setFilters(prev => [...prev, { id: uid(), columna: columnas[0] ?? '', tipo: 'rango', min: '', max: '', texto: '', categorias: [] }])
  }

  async function handleAnalizar() {
    setError(null); setLoading(true)
    try {
      const segFilter = filters.find(f => f.tipo === 'segmentar' && f.columna)
      const baseFilters = filters.filter(f => f.tipo !== 'segmentar')

      let rawResults: AnalysisResult[]

      if (segFilter) {
        // Valores a segmentar: seleccionados o todos los únicos
        const segValues = segFilter.categorias.length > 0
          ? segFilter.categorias
          : getUniqueValues(csvLimpio, segFilter.columna)

        // Por cada valor del segmento × cada colY → análisis independiente
        const tasks = segValues.flatMap(segVal =>
          colsY.map(async cy => {
            const csvSeg = applyFilters(csvLimpio, [
              ...baseFilters,
              { ...segFilter, tipo: 'categoria' as const, categorias: [segVal] },
            ])
            const data = await procesarDatos(csvSeg, colX, cy, sigma)
            return { colY: `${cy} [${segVal}]`, data } as AnalysisResult
          })
        )
        rawResults = await Promise.all(tasks)
      } else {
        const csvFiltrado = applyFilters(csvLimpio, filters)
        const data = await Promise.all(colsY.map(cy => procesarDatos(csvFiltrado, colX, cy, sigma)))
        rawResults = data.map((d, i) => ({ colY: colsY[i], data: d }))
      }

      setResults(rawResults)
      setStep(4)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  function resetear() {
    setStep(1); setCsvLimpio(''); setColumnas([]); setPreview([])
    setColX(''); setColsY([]); setFilters([]); setResults([]); setError(null); setSigma(3.0)
  }

  const totalAnomalias = results.reduce((s, r) => s + r.data.total_anomalias, 0)

  return (
    <div className="min-h-screen bg-slate-950">
      <LoginBar />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              Control de <span className="text-cyan-400">Anomalías</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Carta Shewhart · Media ± {sigma}σ
              {isAdmin && <span className="ml-2 text-cyan-500">· Panel Admin activo</span>}
            </p>
          </div>
          {step > 1 && (
            <button onClick={resetear}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300
                border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-xl transition-colors">
              <RotateCcw size={13} /> Nuevo análisis
            </button>
          )}
        </div>

        {/* Steps — progress bar + chips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {STEP_LABELS.map((label, i) => {
              const s = (i + 1) as Step; const done = step > s; const active = step === s
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200
                    ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                      : done ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-slate-800/80 text-slate-500'}`}>
                    {done
                      ? <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[9px]">✓</span>
                      : <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold
                          ${active ? 'bg-white/20' : 'bg-slate-700'}`}>{s}</span>
                    }
                    {label}
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`h-px w-4 transition-colors duration-300 ${step > s ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                  )}
                </div>
              )
            })}
          </div>
          {/* Progress bar */}
          <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (STEP_LABELS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm font-medium">
            ⚠ {error}
          </div>
        )}

        {/* ── Paso 1 ────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="glass gradient-border rounded-2xl p-6">
            <FileUpload onUpload={handleUpload} loading={loading} />
          </div>
        )}

        {/* ── Paso 2 ────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="glass gradient-border rounded-2xl p-6">
              <h2 className="font-semibold text-slate-200 mb-5">Configurar columnas</h2>
              <ColumnSelector
                columnas={columnas} colX={colX} colsY={colsY}
                onColX={c => { setColX(c); setColsY([]) }}
                onToggleY={toggleColY}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            </div>
            {preview.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 mb-2 ml-1">
                  Vista previa · {preview.length} filas · {columnas.length} columnas
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                  <table className="w-full text-xs">
                    <thead className="border-b border-slate-800">
                      <tr>{columnas.map(c => (
                        <th key={c} className="px-4 py-2.5 text-left text-slate-500 font-semibold uppercase tracking-wider">{c}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {preview.map((fila, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          {columnas.map(c => (
                            <td key={c} className="px-4 py-2 text-slate-400 font-mono">{String(fila[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Paso 3 ────────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="glass gradient-border rounded-2xl p-6">
            <h2 className="font-semibold text-slate-200 mb-5">Filtros y configuración</h2>
            <FilterPanel
              columnas={columnas} csvLimpio={csvLimpio} filters={filters}
              role={role} sigma={sigma}
              onAdd={addFilter}
              onUpdate={(id, ch) => setFilters(prev => prev.map(f => f.id === id ? { ...f, ...ch } : f))}
              onRemove={id => setFilters(prev => prev.filter(f => f.id !== id))}
              onSigmaChange={isAdmin ? setSigma : () => {}}
              onAnalizar={handleAnalizar}
              onBack={() => setStep(2)}
              onReset={() => setFilters([])}
              loading={loading}
            />
          </div>
        )}

        {/* ── Paso 4 ────────────────────────────────────────────────────── */}
        {step === 4 && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300
                  border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-colors">
                <ArrowLeft size={13} /> Cambiar filtros
              </button>
              <span className="text-xs text-slate-700">
                σ={sigma} · {filters.length} filtro(s) · {colsY.length} métrica(s)
              </span>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total puntos" value={results[0].data.total_puntos.toLocaleString()}
                icon={<BarChart2 size={16} />} />
              <StatCard label="Métricas" value={results.length}
                icon={<Activity size={16} />} />
              <StatCard
                label="Anomalías" value={totalAnomalias}
                variant={totalAnomalias > 0 ? 'danger' : 'success'}
                icon={<AlertCircle size={16} />}
                sub={totalAnomalias > 0
                  ? (() => {
                      const pct = (totalAnomalias / results[0].data.total_puntos) * 100
                      const decimals = pct < 0.001 ? 6 : pct < 0.01 ? 4 : pct < 0.1 ? 3 : 2
                      return `${pct.toFixed(decimals)}% del total`
                    })()
                  : 'Proceso estable'}
              />
              <StatCard label="Sigma" value={`±${sigma}σ`}
                variant={sigma < 3 ? 'warning' : 'default'} icon={<Zap size={16} />}
                sub={isAdmin ? 'Ajustable (Admin)' : 'Estándar'} />
            </div>

            <AnomalyChart data={mergedData} colX={colX} colsY={colsY} results={results} sigma={sigma} />
            <AnomalyTable results={results} colX={colX} />
          </div>
        )}

      </main>
    </div>
  )
}
