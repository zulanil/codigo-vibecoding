export type Role = 'admin' | 'editor' | 'viewer'

export interface AuthUser {
  id: number
  email: string
  name: string
  role: Role
}

export interface LimpiarResponse {
  columnas: string[]
  filas: number
  preview: Record<string, string | number>[]
  datos_limpios: string
}

export interface SeriePunto extends Record<string, string | number | boolean> {
  anomalia: boolean
}

export interface ShewartResult {
  media: number
  desviacion_std: number
  limite_control_superior: number
  limite_control_inferior: number
  total_puntos: number
  total_anomalias: number
  puntos_display: number
  downsampled: boolean
  anomalias: SeriePunto[]
  serie: SeriePunto[]
}

export interface AnalysisResult {
  colY: string
  originalColY?: string  // CSV column name when colY is a segmented label
  data: ShewartResult
}

export interface FilterConfig {
  id: string
  columna: string
  tipo: 'rango' | 'texto' | 'categoria' | 'segmentar'
  min: string
  max: string
  texto: string
  categorias: string[]
}

export type MergedPoint = Record<string, string | number | boolean>

export interface UserRecord {
  id: number
  email: string
  name: string
  role: Role
  is_active: boolean
}

export interface ReportRecord {
  id: string
  title: string
  col_x: string
  cols_y: string[]
  sigma: number
  created_by_name: string
  created_at: string
  results_json?: AnalysisResult[]
}
