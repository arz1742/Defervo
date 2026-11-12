import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { RULES } from '../lib/logic'

export const cx = (...a) => a.filter(Boolean).join(' ')

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  sky: 'bg-sky-50 text-sky-800 ring-sky-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
}
export function Badge({ tone = 'slate', children, className, icon: Icon }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', TONES[tone], className)}>
      {Icon && <Icon size={12} strokeWidth={2.4} />}{children}
    </span>
  )
}

const BTN = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm disabled:bg-slate-200 disabled:text-slate-400',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm disabled:bg-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100',
  violet: 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm disabled:bg-slate-200 disabled:text-slate-400',
}
export function Button({ variant = 'primary', size = 'md', className, icon: Icon, children, ...p }) {
  const sz = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-3.5 py-2 text-sm'
  return (
    <button {...p} className={cx('inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1', BTN[variant], sz, className)}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.2} />}{children}
    </button>
  )
}

export function Card({ className, children, ...p }) {
  return <div {...p} className={cx('rounded-xl bg-white ring-1 ring-slate-200/80 shadow-card', className)}>{children}</div>
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[2px] anim-fade" onMouseDown={onClose}>
      <div className={cx('w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-xl anim-rise max-h-[92vh] flex flex-col', width)} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 -m-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="px-5 pb-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 anim-fade" onMouseDown={onClose}>
      <div className="h-full w-full max-w-2xl bg-slate-50 shadow-2xl anim-slide overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── Toasts ──
let pushToast = () => {}
export const toast = (msg, tone = 'success') => pushToast({ msg, tone, id: Math.random() })
export function Toaster() {
  const [items, setItems] = useState([])
  useEffect(() => {
    pushToast = (t) => { setItems((x) => [...x, t]); setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 3600) }
  }, [])
  const ICON = { success: CheckCircle2, warning: AlertTriangle, info: Info }
  const COL = { success: 'text-emerald-500', warning: 'text-amber-500', info: 'text-sky-500' }
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96">
      {items.map((t) => { const I = ICON[t.tone]; return (
        <div key={t.id} className="flex items-start gap-3 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl anim-rise text-sm">
          <I size={18} className={cx('mt-0.5 shrink-0', COL[t.tone])} /><span>{t.msg}</span>
        </div>) })}
    </div>
  )
}

export function StreakDots({ streak, size = 'md' }) {
  const n = RULES.CURE_DAYS
  const dot = size === 'sm' ? 'h-1.5 w-4' : 'h-2 w-6'
  return (
    <div className="flex items-center gap-1" title={`${Math.min(streak, n)} of ${n} fever-free days`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cx('rounded-full', dot, i < streak ? (streak >= n ? 'bg-violet-500' : 'bg-emerald-500') : 'bg-slate-200')} />
      ))}
    </div>
  )
}

export function Temp({ value, className }) {
  if (value == null) return <span className={cx('text-slate-400', className)}>—</span>
  const tone = value >= RULES.HIGH_FEVER_C ? 'text-rose-600' : value >= RULES.FEVER_C ? 'text-orange-600' : 'text-emerald-700'
  return <span className={cx('font-semibold tabular-nums', tone, className)}>{value.toFixed(1)}°C</span>
}

export function Stat({ label, value, sub, icon: Icon, tone = 'brand', children }) {
  const ring = { brand: 'bg-brand-50 text-brand-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-rose-50 text-rose-700', violet: 'bg-violet-50 text-violet-700', sky: 'bg-sky-50 text-sky-700', green: 'bg-emerald-50 text-emerald-700' }[tone]
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {Icon && <span className={cx('rounded-lg p-2', ring)}><Icon size={18} /></span>}
      </div>
      {children}
    </Card>
  )
}

export function Progress({ value, max, tone = 'brand' }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  const bar = { brand: 'bg-brand-500', sky: 'bg-sky-500', violet: 'bg-violet-500', amber: 'bg-amber-500' }[tone]
  return (
    <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className={cx('h-full rounded-full transition-all duration-500', bar)} style={{ width: pct + '%' }} />
    </div>
  )
}

export function Empty({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && <span className="rounded-full bg-brand-50 text-brand-600 p-3 mb-3"><Icon size={22} /></span>}
      <p className="font-semibold text-slate-800">{title}</p>
      {body && <p className="text-sm text-slate-500 mt-1 max-w-sm">{body}</p>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cx('shrink-0 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
            value === t.id ? 'bg-white text-slate-900 shadow-card ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60')}>
          {t.label}
          {t.count != null && <span className={cx('rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums', value === t.id ? (t.tone || 'bg-brand-100 text-brand-800') : 'bg-slate-200/70 text-slate-600')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}
export const inputCls = 'w-full rounded-lg border-0 ring-1 ring-inset ring-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none bg-white'
