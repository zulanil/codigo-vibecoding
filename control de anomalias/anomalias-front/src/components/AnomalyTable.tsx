import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AnalysisResult } from '../types'
import { LINE_COLORS } from './AnomalyChart'

const PAGE_SIZE = 8

interface Props {
  results: AnalysisResult[]
  colX: string
}

function SingleTable({
  result, colX, color,
}: { result: AnalysisResult; colX: string; color: string }) {
  const [page, setPage] = useState(0)
  const { colY, data } = result
  const dataKey = result.originalColY ?? colY
  const total = data.anomalias.length
  const pages = Math.ceil(total / PAGE_SIZE)
  const slice = data.anomalias.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (total === 0) return null

  return (
    <div className="glass gradient-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="font-semibold text-slate-200">
            Eventos anómalos — <span style={{ color }}>{colY}</span>
          </h3>
        </div>
        <span className="bg-red-500/15 text-red-400 border border-red-500/25 text-sm font-semibold px-3 py-1 rounded-full">
          {total} / {data.total_puntos} puntos
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800
              bg-slate-950/90 backdrop-blur-sm">
              <th className="px-5 py-3 text-left font-semibold">#</th>
              <th className="px-5 py-3 text-left font-semibold">{colX}</th>
              <th className="px-5 py-3 text-left font-semibold">Valor</th>
              <th className="px-5 py-3 text-left font-semibold">Límite superado</th>
              <th className="px-5 py-3 text-left font-semibold">Δ vs Media</th>
              <th className="px-5 py-3 text-left font-semibold">Severidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {slice.map((fila, i) => {
              const val = fila[dataKey] as number
              const delta = val - data.media
              const isAbove = val > data.limite_control_superior
              const limit = isAbove
                ? `> LCS (${data.limite_control_superior.toFixed(4)})`
                : `< LCI (${data.limite_control_inferior.toFixed(4)})`
              const isCritical = Math.abs(delta) > 3 * data.desviacion_std * 2

              return (
                <tr key={i} className="hover:bg-red-500/8 transition-colors duration-150 group">
                  <td className="px-5 py-3 text-slate-600 num text-xs">
                    {page * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-5 py-3 text-slate-300 font-medium num">{String(fila[colX])}</td>
                  <td className="px-5 py-3 text-red-400 font-bold num">{typeof val === 'number' ? val.toFixed(4) : val}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs num">{limit}</td>
                  <td className="px-5 py-3 num text-xs">
                    <span className={delta > 0 ? 'text-red-400' : 'text-orange-400'}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold
                      ${isCritical
                        ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                        : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'}`}>
                      {isCritical ? '● CRÍTICO' : '● ALTO'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
          <span>Pág. {page + 1} de {pages} — {total} eventos totales</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnomalyTable({ results, colX }: Props) {
  const withAnomalies = results.filter(r => r.data.total_anomalias > 0)

  if (withAnomalies.length === 0) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-emerald-400 font-semibold">Sin anomalías detectadas</p>
        <p className="text-slate-500 text-sm mt-1">
          Todos los puntos están dentro de los límites de control establecidos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-200 text-lg">Auditoría de Eventos Anómalos</h2>
      {withAnomalies.map((r, i) => (
        <SingleTable key={r.colY} result={r} colX={colX} color={LINE_COLORS[i % LINE_COLORS.length]} />
      ))}
    </div>
  )
}
