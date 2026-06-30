import type { LimpiarResponse, ShewartResult } from '../types'
import { getAuthHeader } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail: string }).detail ?? 'Error inesperado')
  }
  return res.json() as Promise<T>
}

export async function limpiarCSV(archivo: File): Promise<LimpiarResponse> {
  const form = new FormData()
  form.append('archivo', archivo)
  const res = await fetch(`${API_URL}/api/limpiar`, {
    method: 'POST',
    body: form,
    headers: getAuthHeader(),  // no Content-Type para FormData — browser lo pone solo
  })
  return handleResponse<LimpiarResponse>(res)
}

export async function procesarDatos(
  datos: string,
  col_x: string,
  col_y: string,
  sigma: number = 3.0,
): Promise<ShewartResult> {
  const res = await fetch(`${API_URL}/api/procesar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ datos, col_x, col_y, sigma }),
  })
  return handleResponse<ShewartResult>(res)
}
