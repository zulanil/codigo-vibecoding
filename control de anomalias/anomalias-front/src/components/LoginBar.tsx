import { useAuth } from '../contexts/AuthContext'
import { LogOut, ShieldCheck, Pencil, Eye } from 'lucide-react'
import type { Role } from '../types'

const ROLE_META: Record<Role, { label: string; color: string; icon: React.ReactNode; badge: string }> = {
  admin:   { label: 'Admin',       color: 'text-cyan-400',   icon: <ShieldCheck size={12} />, badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  editor:  { label: 'Editor',      color: 'text-violet-400', icon: <Pencil size={12} />,      badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  viewer:  { label: 'Visualizador',color: 'text-slate-400',  icon: <Eye size={12} />,          badge: 'bg-slate-700 text-slate-400 border-slate-600' },
}

export default function LoginBar() {
  const { user, logout } = useAuth()
  if (!user) return null

  const meta = ROLE_META[user.role]

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
          <span className="text-cyan-400 text-xs font-bold">SH</span>
        </div>
        <span className="font-semibold text-slate-100 text-sm tracking-wide">AnomalíasPro</span>
        <span className="text-slate-700 text-xs hidden sm:block">/ Shewhart</span>
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-slate-500 text-xs">{user.name}</span>
          <span className="text-slate-700 text-xs">·</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
          {meta.icon} {meta.label}
        </span>
        <button onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400
            border border-slate-800 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors">
          <LogOut size={12} /> Salir
        </button>
      </div>
    </div>
  )
}
