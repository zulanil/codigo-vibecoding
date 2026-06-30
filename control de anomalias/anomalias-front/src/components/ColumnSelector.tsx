import { ChevronRight, ArrowLeft } from 'lucide-react'

interface Props {
  columnas: string[]
  colX: string
  colsY: string[]
  onColX: (c: string) => void
  onToggleY: (c: string) => void
  onNext: () => void
  onBack: () => void
}

export default function ColumnSelector({ columnas, colX, colsY, onColX, onToggleY, onNext, onBack }: Props) {
  const valid = colX !== '' && colsY.length > 0

  return (
    <div className="space-y-6">
      {/* Eje X */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Eje X — columna de referencia (tiempo, fecha, ID…)
        </label>
        <select
          value={colX}
          onChange={e => onColX(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5
            focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
        >
          <option value="">-- Seleccionar --</option>
          {columnas.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Eje Y múltiple */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Eje Y — métricas a analizar (una o varias)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {columnas.filter(c => c !== colX).map(c => {
            const checked = colsY.includes(c)
            return (
              <label key={c}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm
                  ${checked
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300 font-medium glow-cyan'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggleY(c)}
                  className="accent-cyan-500" />
                {c}
              </label>
            )
          })}
        </div>
        {colsY.length === 0 && colX && (
          <p className="text-amber-400 text-xs mt-2">Selecciona al menos una métrica para el Eje Y.</p>
        )}
        {colsY.length > 1 && (
          <p className="text-slate-500 text-xs mt-2">{colsY.length} métricas — las líneas de referencia LCS/LCI solo se muestran con 1 métrica.</p>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 border border-slate-700
            hover:border-slate-600 px-4 py-2 rounded-xl transition-colors">
          <ArrowLeft size={14} /> Volver
        </button>
        <button onClick={onNext} disabled={!valid}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-2.5
            rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Continuar a filtros <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
