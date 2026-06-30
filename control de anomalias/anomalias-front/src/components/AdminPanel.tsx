import { useState, useEffect, useCallback, type ReactElement } from 'react'
import { UserPlus, Trash2, Save, RefreshCw, ShieldCheck, Activity, Eye, X, AlertCircle } from 'lucide-react'
import type { UserRecord, Role } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { listUsers, createUser, changeRole, deleteUser } from '../services/api'

const ROLES: Role[] = ['admin', 'editor', 'viewer']

const ROLE_META: Record<Role, { label: string; color: string; border: string; bg: string; icon: ReactElement }> = {
  admin:  { label: 'Admin',  color: 'text-cyan-400',   border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',   icon: <ShieldCheck size={12} /> },
  editor: { label: 'Editor', color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10', icon: <Activity size={12} /> },
  viewer: { label: 'Viewer', color: 'text-slate-400',  border: 'border-slate-600',     bg: 'bg-slate-800/60',  icon: <Eye size={12} /> },
}

const INPUT = `w-full bg-slate-900/80 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5
  text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60
  placeholder-slate-600 transition-colors`

function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
      border ${m.border} ${m.bg} ${m.color}`}>
      {m.icon}{m.label}
    </span>
  )
}

// ── Modal crear usuario ───────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' as Role })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await createUser(form)
      onCreated()
      onClose()
    } catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass gradient-border rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100 text-lg">Crear usuario</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-3 py-2">
            <AlertCircle size={14} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">Nombre</label>
            <input className={INPUT} placeholder="Nombre completo" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">Email</label>
            <input className={INPUT} type="email" placeholder="usuario@ejemplo.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">Contraseña</label>
            <input className={INPUT} type="password" placeholder="Mínimo 6 caracteres" required minLength={6}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">Rol</label>
            <select className={INPUT} value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-700 text-slate-400 hover:text-slate-200 py-2.5 rounded-xl transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500
                text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
              {loading
                ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Creando…</>
                : <><UserPlus size={15} /> Crear</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Fila de usuario ───────────────────────────────────────────────────────────
function UserRow({ u, isSelf, onRefresh }: { u: UserRecord; isSelf: boolean; onRefresh: () => void }) {
  const [role, setRole] = useState<Role>(u.role)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const dirty = role !== u.role

  async function handleSave() {
    setSaving(true)
    try { await changeRole(u.id, role); onRefresh() }
    catch (e) { alert((e as Error).message); setRole(u.role) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try { await deleteUser(u.id); onRefresh() }
    catch (e) { alert((e as Error).message) }
    finally { setDeleting(false); setConfirmDelete(false) }
  }

  const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
            ${ROLE_META[u.role].bg} ${ROLE_META[u.role].color} border ${ROLE_META[u.role].border}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate">
              {u.name} {isSelf && <span className="text-xs text-cyan-500">(tú)</span>}
            </p>
            <p className="text-slate-500 text-xs truncate">{u.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={u.role} />
      </td>
      <td className="px-4 py-3">
        {isSelf
          ? <span className="text-xs text-slate-600 italic">no editable</span>
          : (
            <div className="flex items-center gap-2">
              <select value={role} onChange={e => setRole(e.target.value as Role)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5
                  focus:outline-none focus:ring-1 focus:ring-cyan-500/50">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
              </select>
              {dirty && (
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1 text-xs bg-cyan-600/20 text-cyan-400 border border-cyan-500/30
                    hover:bg-cyan-600/40 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  {saving ? <span className="animate-spin w-3 h-3 border border-cyan-400/30 border-t-cyan-400 rounded-full" />
                    : <Save size={11} />}
                  Guardar
                </button>
              )}
            </div>
          )
        }
      </td>
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <button onClick={handleDelete} disabled={deleting}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-all border
              ${confirmDelete
                ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                : 'text-slate-600 border-slate-800 hover:text-red-400 hover:border-red-500/30'}`}>
            {deleting
              ? <span className="animate-spin w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full" />
              : <Trash2 size={11} />}
            {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
          </button>
        )}
      </td>
    </tr>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user } = useAuth()
  const [users, setUsers]         = useState<UserRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try { setUsers(await listUsers()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Gestión de Usuarios</h2>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200
              border border-slate-700 hover:border-slate-600 px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white
              font-semibold text-sm px-4 py-2 rounded-xl transition-colors glow-cyan">
            <UserPlus size={15} /> Crear usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass gradient-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <RefreshCw size={16} className="animate-spin" /> Cargando usuarios…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold">Rol actual</th>
                  <th className="px-4 py-3 text-left font-semibold">Cambiar rol</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <UserRow key={u.id} u={u} isSelf={u.id === user?.id} onRefresh={fetchUsers} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leyenda roles */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        {ROLES.map(r => {
          const m = ROLE_META[r]
          return (
            <div key={r} className="flex items-center gap-1.5">
              <span className={`${m.color}`}>{m.icon}</span>
              <span className={`font-semibold ${m.color}`}>{m.label}:</span>
              <span>{r === 'admin' ? 'acceso total + gestión usuarios' : r === 'editor' ? 'carga CSV y analiza' : 'solo visualización'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
