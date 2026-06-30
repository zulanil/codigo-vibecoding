import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Loader2, AlertCircle, Activity, ShieldCheck, Eye } from 'lucide-react'

const DEMO_USERS = [
  { role: 'Admin',  email: 'admin@anomalias.com',  pass: 'admin123',
    color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'hover:bg-cyan-500/8',
    icon: <ShieldCheck size={14} />, desc: 'Acceso total + sigma' },
  { role: 'Editor', email: 'editor@anomalias.com', pass: 'editor123',
    color: 'text-violet-400', border: 'border-violet-500/30', bg: 'hover:bg-violet-500/8',
    icon: <Activity size={14} />, desc: 'Carga CSV y filtra' },
  { role: 'Viewer', email: 'viewer@anomalias.com', pass: 'viewer123',
    color: 'text-slate-400', border: 'border-slate-700', bg: 'hover:bg-slate-800/60',
    icon: <Eye size={14} />, desc: 'Solo visualización' },
]

const INPUT = `w-full bg-slate-900/80 border border-slate-700/70 text-slate-100 rounded-xl px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60
  placeholder-slate-600 text-sm transition-colors`

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try { await login(email, password) }
    catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }

  function fillDemo(e: string, p: string) { setEmail(e); setPassword(p); setError(null) }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient blobs — CSS-only, no JS, respects prefers-reduced-motion */}
      <div aria-hidden="true" className="pointer-events-none select-none">
        <div className="blob blob-cyan"  style={{ top: '10%',  left: '15%' }} />
        <div className="blob blob-violet" style={{ top: '55%',  right: '10%' }} />
        <div className="blob blob-red"   style={{ bottom: '8%', left: '40%' }} />
      </div>

      <div className="w-full max-w-md space-y-4 relative z-10">

        {/* Header / brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
            bg-cyan-500/10 border border-cyan-500/25 mb-5 glow-cyan">
            <span className="text-cyan-400 text-2xl font-bold num tracking-tight">SH</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight num">
            Control de <span className="text-cyan-400">Anomalías</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 tracking-wide">
            Carta Shewhart · Detección estadística de proceso
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass gradient-border rounded-2xl p-6 space-y-4">
          <p className="text-slate-300 font-semibold text-sm">Iniciar sesión</p>

          {error && (
            <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
              text-red-400 text-sm rounded-xl px-4 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="login-email" className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                Email
              </label>
              <input id="login-email"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="usuario@ejemplo.com"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="login-pass" className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                Contraseña
              </label>
              <input id="login-pass"
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="••••••••"
                className={INPUT}
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500
              text-white font-semibold py-3 rounded-xl transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed glow-cyan cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950">
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Verificando…</>
              : <><LogIn size={16} /> Ingresar</>
            }
          </button>
        </form>

        {/* Demo credentials */}
        <div className="glass gradient-border rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">
            Credenciales de demostración
          </p>
          <div className="space-y-2">
            {DEMO_USERS.map(u => (
              <button key={u.role} type="button" onClick={() => fillDemo(u.email, u.pass)}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl
                  border ${u.border} ${u.bg} transition-all duration-150 group cursor-pointer
                  focus:outline-none focus:ring-1 focus:ring-slate-600`}>
                <div className="flex items-center gap-2">
                  <span className={u.color}>{u.icon}</span>
                  <span className={`text-sm font-semibold ${u.color}`}>{u.role}</span>
                  <span className="text-slate-600 text-xs">— {u.desc}</span>
                </div>
                <span className="text-slate-700 text-xs group-hover:text-slate-500 num transition-colors">
                  clic para usar
                </span>
              </button>
            ))}
          </div>
          <p className="text-slate-700 text-xs pt-2">Haz clic en un rol para autocompletar credenciales</p>
        </div>

      </div>
    </div>
  )
}
