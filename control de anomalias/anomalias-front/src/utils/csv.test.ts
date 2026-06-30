import { describe, it, expect } from 'vitest'
import { parseCsv, getUniqueValues, applyFilters, mergeResults } from './csv'
import type { FilterConfig, AnalysisResult } from '../types'

const SIMPLE_CSV = `nombre,edad,score
Alice,30,90
Bob,25,45
Charlie,30,70
Alice,30,90`  // duplicado — parseCsv lo devuelve igual (es la API la que deduplica)

// ── parseCsv ─────────────────────────────────────────────────────────────────

describe('parseCsv', () => {
  it('parsea cabecera y filas', () => {
    const rows = parseCsv(SIMPLE_CSV)
    expect(rows).toHaveLength(4)
    expect(rows[0]).toEqual({ nombre: 'Alice', edad: '30', score: '90' })
  })

  it('devuelve [] con una sola fila (sin datos)', () => {
    expect(parseCsv('a,b,c')).toEqual([])
  })

  it('elimina comillas de valores', () => {
    const rows = parseCsv(`col\n"valor"`)
    expect(rows[0].col).toBe('valor')
  })
})

// ── getUniqueValues ──────────────────────────────────────────────────────────

describe('getUniqueValues', () => {
  it('devuelve valores únicos de columna', () => {
    const vals = getUniqueValues(SIMPLE_CSV, 'nombre')
    expect(vals).toContain('Alice')
    expect(vals).toContain('Bob')
    expect(vals.filter(v => v === 'Alice')).toHaveLength(1)  // único
  })

  it('ordena números correctamente', () => {
    const vals = getUniqueValues(SIMPLE_CSV, 'edad')
    expect(vals).toEqual(['25', '30'])  // orden numérico
  })
})

// ── applyFilters ─────────────────────────────────────────────────────────────

describe('applyFilters', () => {
  const makeFilter = (partial: Partial<FilterConfig>): FilterConfig => ({
    id: '1', columna: 'score', tipo: 'rango', min: '', max: '', texto: '', categorias: [],
    ...partial,
  })

  it('sin filtros devuelve CSV original', () => {
    expect(applyFilters(SIMPLE_CSV, [])).toBe(SIMPLE_CSV)
  })

  it('filtro rango numérico min/max', () => {
    const rows = parseCsv(applyFilters(SIMPLE_CSV, [makeFilter({ min: '70', max: '100' })]))
    expect(rows.every(r => parseFloat(r.score) >= 70)).toBe(true)
    // Alice(90)×2 + Charlie(70) = 3 — applyFilters no deduplica (lo hace la API)
    expect(rows).toHaveLength(3)
  })

  it('filtro solo min', () => {
    const rows = parseCsv(applyFilters(SIMPLE_CSV, [makeFilter({ min: '80' })]))
    expect(rows.every(r => parseFloat(r.score) >= 80)).toBe(true)
  })

  it('filtro texto (case insensitive)', () => {
    const rows = parseCsv(applyFilters(SIMPLE_CSV, [makeFilter({ columna: 'nombre', tipo: 'texto', texto: 'alice' })]))
    expect(rows.every(r => r.nombre === 'Alice')).toBe(true)
  })

  it('filtro categoría vacía = pasan todos', () => {
    const rows = parseCsv(applyFilters(SIMPLE_CSV, [makeFilter({ columna: 'nombre', tipo: 'categoria', categorias: [] })]))
    expect(rows).toHaveLength(4)
  })

  it('filtro categoría con selección', () => {
    const rows = parseCsv(applyFilters(SIMPLE_CSV, [makeFilter({ columna: 'nombre', tipo: 'categoria', categorias: ['Bob'] })]))
    expect(rows).toHaveLength(1)
    expect(rows[0].nombre).toBe('Bob')
  })
})

// ── mergeResults ─────────────────────────────────────────────────────────────

describe('mergeResults', () => {
  const makeResult = (colY: string, points: number[]): AnalysisResult => ({
    colY,
    data: {
      media: 0, desviacion_std: 0,
      limite_control_superior: 0, limite_control_inferior: 0,
      total_puntos: points.length, total_anomalias: 0,
      puntos_display: points.length, downsampled: false,
      anomalias: [],
      serie: points.map((v, i) => ({ x: i, [colY]: v, anomalia: false })),
    },
  })

  it('combina dos columnas Y por el mismo colX', () => {
    const results = [makeResult('temp', [10, 20, 30]), makeResult('presion', [100, 200, 300])]
    const merged = mergeResults(results, 'x')
    expect(merged).toHaveLength(3)
    expect(merged[0]).toHaveProperty('temp')
    expect(merged[0]).toHaveProperty('presion')
  })

  it('incluye flag anomalia por columna', () => {
    const results = [makeResult('temp', [10])]
    const merged = mergeResults(results, 'x')
    expect(merged[0]).toHaveProperty('temp_anomalia', false)
  })
})
