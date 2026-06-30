import type { LimpiarResponse, ShewartResult, UserRecord, Role } from '../types'
import { getAuthHeader } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail: string }).detail ?? 'Error inesperado')
  }
  return res.json() as Promise<T>
}

// ── Análisis ──────────────────────────────────────────────────────────────────

export async function limpiarCSV(archivo: File): Promise<LimpiarResponse> {
  const form = new FormData()
  form.append('archivo', archivo)
  const res = await fetch(`${API_URL}/api/limpiar`, {
    method: 'POST', body: form, headers: getAuthHeader(),
  })
  return handleResponse<LimpiarResponse>(res)
}

export async function procesarDatos(
  datos: string, col_x: string, col_y: string, sigma = 3.0,
): Promise<ShewartResult> {
  const res = await fetch(`${API_URL}/api/procesar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ datos, col_x, col_y, sigma }),
  })
  return handleResponse<ShewartResult>(res)
}

// ── Gestión de usuarios (admin) ───────────────────────────────────────────────

export async function listUsers(): Promise<UserRecord[]> {
  const res = await fetch(`${API_URL}/api/auth/users`, { headers: getAuthHeader() })
  return handleResponse<UserRecord[]>(res)
}

export async function createUser(data: {
  name: string; email: string; password: string; role: Role
}): Promise<UserRecord> {
  const res = await fetch(`${API_URL}/api/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  })
  return handleResponse<UserRecord>(res)
}

export async function changeRole(userId: number, role: Role): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ role }),
  })
  return handleResponse<void>(res)
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/users/${userId}`, {
    method: 'DELETE', headers: getAuthHeader(),
  })
  return handleResponse<void>(res)
}
