import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  sub?: string
  variant?: 'default' | 'danger' | 'success' | 'warning'
  icon?: ReactNode
}

const VARIANTS = {
  default: { grad: 'from-cyan-500/10 to-blue-500/5',    text: 'text-cyan-400',    glow: 'glow-cyan',    iconBg: 'bg-cyan-500/10 border-cyan-500/20' },
  danger:  { grad: 'from-red-500/15 to-rose-500/5',     text: 'text-red-400',     glow: 'glow-red',     iconBg: 'bg-red-500/10 border-red-500/20' },
  success: { grad: 'from-emerald-500/10 to-teal-500/5', text: 'text-emerald-400', glow: 'glow-emerald', iconBg: 'bg-emerald-500/10 border-emerald-500/20' },
  warning: { grad: 'from-amber-500/10 to-yellow-500/5', text: 'text-amber-400',   glow: '',             iconBg: 'bg-amber-500/10 border-amber-500/20' },
}

export default function StatCard({ label, value, sub, variant = 'default', icon }: Props) {
  const v = VARIANTS[variant]
  return (
    <div className={`card-hover gradient-border glass rounded-2xl p-5 overflow-hidden relative ${v.glow}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${v.grad} pointer-events-none`} />
      <div className="relative flex items-start gap-3">
        {icon && (
          <div className={`shrink-0 w-9 h-9 rounded-xl border ${v.iconBg} ${v.text}
            flex items-center justify-center mt-0.5`}
            aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-semibold">{label}</p>
          <p className={`text-3xl font-bold num leading-none ${v.text}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
