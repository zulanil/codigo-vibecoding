import { useState, FormEvent } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Loader2, AlertCircle, Activity, ShieldCheck, Eye } from 'lucide-react'

const DEMO_USERS = [
  { role: 'Admin',  email: 'admin@anomalias.com',  pass: 'Admin2024!',
    color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'hover:bg-cyan-500/8',
    icon: <ShieldCheck size={14} />, desc: 'Acceso total + sigma' },
  { role: 'Editor', email: 'editor1@anomalias.com', pass: 'Editor2024!',
    color: 'text-violet-400', border: 'border-violet-500/30', bg: 'hover:bg-violet-500/8',
    icon: <Activity size={14} />, desc: 'Carga CSV y filtra' },
  { role: 'Viewer', email: 'viewer1@anomalias.com', pass: 'Viewer2024!',
    color: 'text-slate-400', border: 'border-slate-700', bg: 'hover:bg-slate-800/60',
    icon: <Eye size={14} />, desc: 'Solo visualización' },
]

const INPUT = `w-full bg-slate-900/80 border border-slate-700/70 text-slate-100 rounded-xl px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60
  placeholder-slate-600 text-sm transition-colors`

const METEORS = [
  { top: '8%',  left: '75%', delay: '0s',   dur: '3.2s' },
  { top: '18%', left: '55%', delay: '1.4s', dur: '2.6s' },
  { top: '3%',  left: '35%', delay: '3.0s', dur: '3.8s' },
  { top: '28%', left: '88%', delay: '0.8s', dur: '2.9s' },
  { top: '12%', left: '20%', delay: '4.2s', dur: '3.0s' },
  { top: '22%', left: '65%', delay: '2.1s', dur: '2.4s' },
  { top: '6%',  left: '48%', delay: '5.3s', dur: '3.5s' },
  { top: '35%', left: '10%', delay: '1.7s', dur: '2.7s' },
  { top: '15%', left: '92%', delay: '3.8s', dur: '3.1s' },
  { top: '40%', left: '30%', delay: '6.0s', dur: '2.5s' },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  show:   { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.55 } },
}

const listVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

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

      {/* Dot grid */}
      <div aria-hidden="true" className="dot-grid" />

      {/* Aurora top beam */}
      <div aria-hidden="true">
        <div className="aurora-glow" />
        <div className="aurora-beam" />
      </div>

      {/* Blobs */}
      <div aria-hidden="true" className="pointer-events-none select-none">
        <div className="blob blob-cyan"    style={{ top: '5%',   left: '10%'  }} />
        <div className="blob blob-violet"  style={{ top: '50%',  right: '8%'  }} />
        <div className="blob blob-emerald" style={{ bottom: '5%', left: '50%' }} />
        <div className="blob blob-red"     style={{ top: '30%',  left: '30%'  }} />
      </div>

      {/* Meteors */}
      <div aria-hidden="true" className="pointer-events-none select-none">
        {METEORS.map((m, i) => (
          <div
            key={i}
            className="meteor-line"
            style={{
              top: m.top,
              left: m.left,
              animationDelay: m.delay,
              animationDuration: m.dur,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="w-full max-w-md space-y-4 relative z-10"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {/* Brand */}
        <motion.div variants={itemVariants} className="text-center mb-6">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
              bg-cyan-500/10 border border-cyan-500/25 mb-5 glow-cyan"
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="text-cyan-400 text-2xl font-bold num tracking-tight">SH</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight num">
            Control de <span className="text-cyan-400">Anomalías</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 tracking-wide">
            Carta Shewhart · Detección estadística de proceso
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSubmit}
          className="glass gradient-border rounded-2xl p-6 space-y-4"
        >
          <p className="text-slate-300 font-semibold text-sm">Iniciar sesión</p>

          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                text-red-400 text-sm rounded-xl px-4 py-2.5"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
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

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{  scale: loading ? 1 : 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500
              text-white font-semibold py-3 rounded-xl transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed glow-cyan cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Verificando…</>
              : <><LogIn size={16} /> Ingresar</>
            }
          </motion.button>
        </motion.form>

        {/* Demo credentials */}
        <motion.div variants={itemVariants} className="glass gradient-border rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">
            Credenciales de demostración
          </p>
          <div className="space-y-2">
            {DEMO_USERS.map(u => (
              <motion.button
                key={u.role}
                type="button"
                onClick={() => fillDemo(u.email, u.pass)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl
                  border ${u.border} ${u.bg} transition-all duration-150 group cursor-pointer
                  focus:outline-none focus:ring-1 focus:ring-slate-600`}
              >
                <div className="flex items-center gap-2">
                  <span className={u.color}>{u.icon}</span>
                  <span className={`text-sm font-semibold ${u.color}`}>{u.role}</span>
                  <span className="text-slate-600 text-xs">— {u.desc}</span>
                </div>
                <span className="text-slate-700 text-xs group-hover:text-slate-500 num transition-colors">
                  clic para usar
                </span>
              </motion.button>
            ))}
          </div>
          <p className="text-slate-700 text-xs pt-2">Haz clic en un rol para autocompletar credenciales</p>
        </motion.div>

      </motion.div>
    </div>
  )
}
