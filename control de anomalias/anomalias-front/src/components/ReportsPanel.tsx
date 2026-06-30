import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, FileBarChart, Eye, Trash2, X, ChevronLeft } from 'lucide-react'
import type { ReportRecord, AnalysisResult } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { listReports, getReport, deleteReport } from '../services/api'
import AnomalyChart from './AnomalyChart'
import AnomalyTable from './AnomalyTable'
import { mergeResults } from '../utils/csv'

// ── Vista de un reporte ───────────────────────────────────────────────────────
function ReportView({ report, onBack }: { report: ReportRecord; onBack: () => void }) {
  const [full, setFull] = useState<ReportRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReport(report.id)
      .then(r => setFull(r))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [report.id])

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
      <RefreshCw size={16} className="animate-spin" /> Cargando análisis…
    </div>
  )

  const results = (full?.results_json ?? []) as AnalysisResult[]
  const colX = full?.col_x ?? ''
  const colsY = full?.cols_y ?? []
  const mergedData = results.length > 0 ? mergeResults(results, colX) : []
  const totalAnomalias = results.reduce((s, r) => s + r.data.total_anomalias, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300
            border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-colors">
          <ChevronLeft size={13} /> Volver a reportes
        </button>
        <div>
          <h3 className="text-slate-200 font-semibold">{full?.title}</h3>
          <p className="text-xs text-slate-500">
            por {full?.created_by_name} · {new Date(full?.created_at ?? '').toLocaleString('es')}
            · σ={full?.sigma} · {results.length} métrica(s) · {totalAnomalias} anomalía(s)
          </p>
        </div>
      </div>
      {results.length > 0 ? (
        <>
          <AnomalyChart data={mergedData} colX={colX} colsY={colsY} results={results} sigma={full?.sigma ?? 3} />
          <AnomalyTable results={results} colX={colX} />
        </>
      ) : (
        <p className="text-slate-600 italic text-sm">Sin datos en este reporte.</p>
      )}
    </div>
  )
}

// ── Lista de reportes ─────────────────────────────────────────────────────────
export default function ReportsPanel() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<ReportRecord | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try { setReports(await listReports()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  if (viewing) return <ReportView report={viewing} onBack={() => setViewing(null)} />

  async function handleDelete(id: string) {
    if (deleting === id) {
      try { await deleteReport(id); await fetchReports() }
      catch (e) { alert((e as Error).message) }
      finally { setDeleting(null) }
    } else {
      setDeleting(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Análisis compartidos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {reports.length} reporte(s) guardado(s) · visible para todos los usuarios
          </p>
        </div>
        <button onClick={fetchReports} disabled={loading}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200
            border border-slate-700 hover:border-slate-600 px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
          <RefreshCw size={16} className="animate-spin" /> Cargando…
        </div>
      ) : reports.length === 0 ? (
        <div className="glass gradient-border rounded-2xl p-12 text-center space-y-3">
          <FileBarChart className="mx-auto text-slate-700" size={40} strokeWidth={1.5} />
          <p className="text-slate-500 text-sm">
            No hay análisis guardados.<br />
            Un Editor o Admin puede guardar uno desde la pantalla de resultados.
          </p>
        </div>
      ) : (
        <div className="glass gradient-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">Título</th>
                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Métricas</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Por</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}
                  className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileBarChart size={14} className="text-cyan-500 shrink-0" />
                      <div>
                        <p className="text-slate-200 font-medium">{r.title}</p>
                        <p className="text-slate-600 text-xs font-mono">σ={r.sigma} · {r.col_x}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {r.cols_y.map(cy => (
                        <span key={cy} className="text-xs bg-slate-800 border border-slate-700 text-slate-400
                          px-2 py-0.5 rounded-lg font-mono">{cy}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                    {r.created_by_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {new Date(r.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewing(r)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400
                          border border-slate-800 hover:border-cyan-500/30 px-2 py-1.5 rounded-lg transition-colors">
                        <Eye size={11} /> Ver
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(r.id)}
                          className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-all border
                            ${deleting === r.id
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : 'text-slate-600 border-slate-800 hover:text-red-400 hover:border-red-500/30'}`}>
                          {deleting === r.id ? <><X size={11} />Confirmar</> : <><Trash2 size={11} />Eliminar</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
