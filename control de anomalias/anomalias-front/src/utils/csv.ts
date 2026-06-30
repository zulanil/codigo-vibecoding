import type { FilterConfig, MergedPoint, AnalysisResult, SeriePunto } from '../types'

export function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',')
    return Object.fromEntries(
      headers.map((h, i) => [h, (values[i] ?? '').trim().replace(/^"|"$/g, '')])
    )
  })
}

export function getUniqueValues(csv: string, columna: string): string[] {
  const rows = parseCsv(csv)
  const set = new Set(rows.map(r => r[columna]).filter(v => v !== undefined && v !== ''))
  return [...set].sort((a, b) => {
    const na = parseFloat(a), nb = parseFloat(b)
    return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb
  })
}

function serializeCsv(rows: Record<string, string>[], headers: string[]): string {
  return [headers.join(','), ...rows.map(r => headers.map(h => r[h] ?? '').join(','))].join('\n')
}

function passesFilter(row: Record<string, string>, f: FilterConfig): boolean {
  const val = row[f.columna] ?? ''
  if (f.tipo === 'categoria') {
    return f.categorias.length === 0 || f.categorias.includes(val)
  }
  if (f.tipo === 'texto') {
    return val.toLowerCase().includes(f.texto.toLowerCase())
  }
  // rango numérico
  const num = parseFloat(val)
  if (isNaN(num)) return false
  const minOk = f.min === '' || num >= parseFloat(f.min)
  const maxOk = f.max === '' || num <= parseFloat(f.max)
  return minOk && maxOk
}

export function applyFilters(csv: string, filters: FilterConfig[]): string {
  if (filters.length === 0) return csv
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = parseCsv(csv)
  const filtered = rows.filter(row => filters.every(f => passesFilter(row, f)))
  return serializeCsv(filtered, headers)
}

export function mergeResults(results: AnalysisResult[], colX: string): MergedPoint[] {
  const byX = new Map<string, MergedPoint>()
  for (const { colY, originalColY, data } of results) {
    // With segmentation, the API punto uses the original CSV column name,
    // but we store it under the display label (e.g. "Value [Paid_Ruby]")
    const srcKey = originalColY ?? colY
    for (const punto of data.serie) {
      const xVal = String(punto[colX])
      if (!byX.has(xVal)) byX.set(xVal, { [colX]: punto[colX] as string | number })
      const entry = byX.get(xVal)!
      entry[colY] = (punto as SeriePunto)[srcKey] as number
      entry[`${colY}_anomalia`] = (punto as SeriePunto).anomalia
    }
  }
  return Array.from(byX.values())
}
