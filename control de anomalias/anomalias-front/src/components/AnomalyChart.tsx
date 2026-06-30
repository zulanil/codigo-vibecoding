import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import type { Data, Layout, Shape, Annotations, Config } from 'plotly.js'
import type { AnalysisResult, MergedPoint } from '../types'

export const LINE_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#60a5fa']
const ANOMALY_COLOR = '#FF0033'
const ANOMALY_FILL  = 'rgba(255,0,51,0.10)'
const BG            = 'rgba(0,0,0,0)'

interface Props {
  data: MergedPoint[]
  colX: string
  colsY: string[]
  results: AnalysisResult[]
  sigma: number
}

// ── Un chart por colY ────────────────────────────────────────────────────────
function SingleChart({
  cy, color, colX, data, result, sigma, isLast,
}: {
  cy: string; color: string; colX: string
  data: MergedPoint[]; result: AnalysisResult
  sigma: number; isLast: boolean
}) {
  const { traces, shapes, annotations } = useMemo(() => {
    const traces: Data[]                    = []
    const shapes: Partial<Shape>[]          = []
    const annotations: Partial<Annotations>[] = []

    const normal  = data.filter(p => p[`${cy}_anomalia`] !== true)
    const anomaly = data.filter(p => p[`${cy}_anomalia`] === true)

    // Línea — normales
    traces.push({
      x: normal.map(p => p[colX] as string | number | null),
      y: normal.map(p => p[cy]  as number | null),
      type: 'scatter', mode: 'lines', name: cy,
      line: { color, width: 1.8, shape: 'linear' },
      hovertemplate: `<b>${cy}</b><br>${colX}: %{x}<br>Valor: %{y:.4f}<extra></extra>`,
    })

    // Marcadores — anomalías
    if (anomaly.length > 0) {
      traces.push({
        x: anomaly.map(p => p[colX] as string | number | null),
        y: anomaly.map(p => p[cy]  as number | null),
        type: 'scatter', mode: 'markers', name: `⚠ ${cy}`,
        marker: { color: ANOMALY_COLOR, size: 10, symbol: 'circle',
          line: { color: '#ff6680', width: 1.5 } },
        hovertemplate: `<b style="color:${ANOMALY_COLOR}">⚠ ANOMALÍA — ${cy}</b><br>${colX}: %{x}<br>Valor: %{y:.4f}<extra></extra>`,
      })
    }

    const { media, limite_control_superior: lcs, limite_control_inferior: lci } = result.data

    shapes.push(
      { type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1,
        y0: lcs, y1: lcs, line: { color: ANOMALY_COLOR, width: 1.2, dash: 'dashdot' } },
      { type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1,
        y0: lci, y1: lci, line: { color: ANOMALY_COLOR, width: 1.2, dash: 'dashdot' } },
      { type: 'rect', xref: 'paper', yref: 'y', x0: 0, x1: 1,
        y0: lci, y1: lcs, fillcolor: ANOMALY_FILL, line: { width: 0 }, opacity: 1 },
      { type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1,
        y0: media, y1: media, line: { color, width: 1, dash: 'dot' } },
    )

    const lx = 1.01
    annotations.push(
      { xref: 'paper', yref: 'y', x: lx, y: lcs,
        text: `LCS ${lcs.toFixed(2)}`, font: { color: ANOMALY_COLOR, size: 10 },
        showarrow: false, xanchor: 'left' },
      { xref: 'paper', yref: 'y', x: lx, y: lci,
        text: `LCI ${lci.toFixed(2)}`, font: { color: ANOMALY_COLOR, size: 10 },
        showarrow: false, xanchor: 'left' },
      { xref: 'paper', yref: 'y', x: lx, y: media,
        text: `μ ${media.toFixed(2)}`, font: { color, size: 10 },
        showarrow: false, xanchor: 'left' },
    )

    return { traces, shapes, annotations }
  }, [cy, color, colX, data, result])

  const layout: Partial<Layout> = {
    paper_bgcolor: BG,
    plot_bgcolor:  'rgba(15,23,42,0.3)',
    margin: { l: 60, r: 100, t: 10, b: isLast ? 50 : 30 },
    font:   { color: '#94a3b8', family: "'Fira Code', 'Courier New', monospace", size: 11 },
    xaxis: {
      gridcolor: 'rgba(148,163,184,0.05)',
      zerolinecolor: 'rgba(148,163,184,0.08)',
      linecolor: '#1e293b',
      tickfont: { color: '#475569', size: 10 },
      // mostrar título X solo en el último chart
      title: isLast ? { text: colX, font: { color: '#64748b', size: 11 } } : { text: '' },
      showticklabels: isLast,
    },
    yaxis: {
      gridcolor: 'rgba(148,163,184,0.05)',
      zerolinecolor: 'rgba(148,163,184,0.08)',
      linecolor: '#1e293b',
      tickfont: { color: '#475569', size: 10 },
      title: { text: cy, font: { color, size: 11 } },
    },
    legend: {
      bgcolor: 'rgba(15,23,42,0.8)',
      bordercolor: '#334155',
      borderwidth: 1,
      font: { color: '#64748b', size: 11 },
    },
    shapes,
    annotations,
    hovermode: 'closest',
    showlegend: true,
    autosize: true,
  }

  const config: Partial<Config> = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
    displaylogo: false,
    toImageButtonOptions: { format: 'png', filename: `anomalias_${cy}`, scale: 2 },
  }

  return (
    <Plot
      data={traces}
      layout={layout}
      config={config}
      style={{ width: '100%', height: '320px' }}
      useResizeHandler
    />
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AnomalyChart({ data, colX, colsY, results, sigma }: Props) {
  return (
    <div className="glass gradient-border rounded-2xl p-6 space-y-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 className="font-semibold text-slate-100 tracking-tight">Carta de Control Shewhart</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Media ± {sigma}σ &nbsp;·&nbsp;
            <span style={{ color: ANOMALY_COLOR }} className="font-mono">●</span> Anomalía
            &nbsp;·&nbsp; Zona sombreada = banda de control
            {results[0]?.data.downsampled && (
              <span className="ml-2 text-amber-400">
                · Downsampled: {results[0].data.puntos_display.toLocaleString()} pts
                de {results[0].data.total_puntos.toLocaleString()}
              </span>
            )}
          </p>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2">
          {results.map((r, i) => (
            <div key={r.colY}
              className="text-xs bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 font-mono space-y-0.5">
              <p className="font-sans font-semibold mb-1" style={{ color: LINE_COLORS[i % LINE_COLORS.length] }}>
                {r.colY}
              </p>
              <p className="text-slate-400">μ <span className="text-slate-200">{r.data.media.toFixed(4)}</span></p>
              <p className="text-slate-400">
                LCS <span style={{ color: ANOMALY_COLOR }}>{r.data.limite_control_superior.toFixed(4)}</span>
              </p>
              <p className="text-slate-400">
                LCI <span style={{ color: ANOMALY_COLOR }}>{r.data.limite_control_inferior.toFixed(4)}</span>
              </p>
              <p className="text-slate-400">
                ⚠ <span className={r.data.total_anomalias > 0 ? 'font-bold' : 'text-emerald-400'}
                  style={r.data.total_anomalias > 0 ? { color: ANOMALY_COLOR } : {}}>
                  {r.data.total_anomalias}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Un chart por métrica */}
      <div className="divide-y divide-slate-800/40">
        {colsY.map((cy, i) => {
          const result = results.find(r => r.colY === cy)
          if (!result) return null
          return (
            <div key={cy} className={i > 0 ? 'pt-2' : ''}>
              <SingleChart
                cy={cy}
                color={LINE_COLORS[i % LINE_COLORS.length]}
                colX={colX}
                data={data}
                result={result}
                sigma={sigma}
                isLast={i === colsY.length - 1}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
