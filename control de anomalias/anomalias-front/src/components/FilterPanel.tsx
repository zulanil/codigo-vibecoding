import { Plus, Trash2, Zap, ArrowLeft, SlidersHorizontal } from 'lucide-react'
import type { FilterConfig, Role } from '../types'
import { getUniqueValues } from '../utils/csv'

interface Props {
  columnas: string[]
  csvLimpio: string
  filters: FilterConfig[]
  role: Role
  sigma: number
  onAdd: () => void
  onUpdate: (id: string, changes: Partial<FilterConfig>) => void
  onRemove: (id: string) => void
  onSigmaChange: (s: number) => void
  onAnalizar: () => void
  onBack: () => void
  onReset: () => void
  loading: boolean
}

const INPUT_CLS = `bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-sm
  focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-40`

export default function FilterPanel({
  columnas, csvLimpio, filters, role, sigma,
  onAdd, onUpdate, onRemove, onSigmaChange, onAnalizar, onBack, onReset, loading,
}: Props) {
  const isAdmin = role === 'admin'
  const disabled = !isAdmin || loading   // deshabilita durante análisis Y para no-admins

  return (
    <div className="space-y-6">

      {/* Admin: sigma slider */}
      {isAdmin && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
            <SlidersHorizontal size={15} /> Límite de control — solo Admin
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range" min={1} max={5} step={0.5} value={sigma}
              disabled={loading}
              onChange={e => onSigmaChange(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-500 disabled:opacity-40"
            />
            <span className="font-mono text-cyan-300 font-bold text-lg w-16 text-center">
              ±{sigma}σ
            </span>
          </div>
          <p className="text-xs text-slate-500">
            LCS = Media + {sigma}σ &nbsp;|&nbsp; LCI = Media − {sigma}σ
            &nbsp;·&nbsp; Defecto del proceso: 3σ (6-sigma estándar)
          </p>
        </div>
      )}

      {/* Filtros */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-200">Filtros multicategoría</h3>
            <p className="text-xs text-slate-500 mt-0.5">Aplicados antes del cálculo Shewhart. AND entre filtros distintos.</p>
          </div>
          <div className="flex gap-2">
            {filters.length > 0 && (
              <button onClick={onReset} disabled={disabled}
                className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700
                  hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
                Limpiar filtros
              </button>
            )}
            <button onClick={onAdd} disabled={disabled}
              className="flex items-center gap-1.5 text-sm border border-slate-600 text-slate-300
                hover:border-cyan-500/50 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
              <Plus size={14} /> Añadir filtro
            </button>
          </div>
        </div>

        {!isAdmin && (
          <p className="text-xs text-amber-400/80 mb-3 flex items-center gap-1">
            ⚠ Rol Operador — filtros en modo lectura. Cambia a Admin para editar.
          </p>
        )}

        {filters.length === 0 && (
          <p className="text-sm text-slate-600 italic py-2">
            Sin filtros activos — se analizarán todos los datos limpios.
          </p>
        )}

        <div className="space-y-3">
          {filters.map(f => {
            const uniqueVals = f.tipo === 'categoria' && f.columna
              ? getUniqueValues(csvLimpio, f.columna)
              : []

            return (
              <div key={f.id}
                className="flex flex-wrap items-start gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">

                {/* Columna */}
                <select value={f.columna} disabled={disabled}
                  onChange={e => onUpdate(f.id, { columna: e.target.value, categorias: [] })}
                  className={INPUT_CLS}>
                  <option value="">-- Columna --</option>
                  {columnas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Tipo */}
                <select value={f.tipo} disabled={disabled}
                  onChange={e => onUpdate(f.id, { tipo: e.target.value as FilterConfig['tipo'], categorias: [] })}
                  className={INPUT_CLS}>
                  <option value="rango">Rango numérico</option>
                  <option value="texto">Contiene texto</option>
                  <option value="categoria">Categorías (checkbox)</option>
                </select>

                {/* Inputs condicionales */}
                {f.tipo === 'rango' && (
                  <>
                    <input type="number" placeholder="Mín" value={f.min} disabled={disabled}
                      onChange={e => onUpdate(f.id, { min: e.target.value })}
                      className={`${INPUT_CLS} w-24`} />
                    <input type="number" placeholder="Máx" value={f.max} disabled={disabled}
                      onChange={e => onUpdate(f.id, { max: e.target.value })}
                      className={`${INPUT_CLS} w-24`} />
                  </>
                )}

                {f.tipo === 'texto' && (
                  <input type="text" placeholder="Buscar texto…" value={f.texto} disabled={disabled}
                    onChange={e => onUpdate(f.id, { texto: e.target.value })}
                    className={`${INPUT_CLS} flex-1 min-w-[140px]`} />
                )}

                {f.tipo === 'categoria' && f.columna && uniqueVals.length > 0 && (
                  <div className="w-full mt-1">
                    <p className="text-xs text-slate-500 mb-2">
                      {uniqueVals.length} valores únicos — sin selección = todos pasan
                    </p>
                    <div className="max-h-36 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {uniqueVals.map(val => {
                        const checked = f.categorias.includes(val)
                        return (
                          <label key={val}
                            className={`flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded-lg border transition-colors
                              ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                              ${checked
                                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                                : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                            <input type="checkbox" checked={checked} disabled={disabled}
                              onChange={() => {
                                const next = checked
                                  ? f.categorias.filter(c => c !== val)
                                  : [...f.categorias, val]
                                onUpdate(f.id, { categorias: next })
                              }}
                              className="accent-cyan-500" />
                            <span className="truncate">{val}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button onClick={() => onRemove(f.id)} disabled={disabled}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1.5 disabled:opacity-40">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button onClick={onBack} disabled={loading}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200
            border border-slate-700 hover:border-slate-600 px-4 py-2 rounded-xl transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed">
          <ArrowLeft size={14} /> Volver
        </button>
        <button onClick={onAnalizar} disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold
            px-8 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base glow-emerald">
          {loading
            ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Analizando…</>
            : <><Zap size={18} /> Analizar anomalías</>
          }
        </button>
      </div>
    </div>
  )
}
