import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { cx } from './ui'

const META = {
  critical: { I: AlertOctagon, c: 'text-rose-600', bg: 'bg-rose-50 ring-rose-200' },
  warning: { I: AlertTriangle, c: 'text-amber-600', bg: 'bg-amber-50 ring-amber-200' },
  info: { I: Info, c: 'text-sky-600', bg: 'bg-sky-50 ring-sky-200' },
}

export default function AlertsList({ alerts, openPatient, compact }) {
  if (!alerts.length) return (
    <div className="flex flex-col items-center py-8 text-center"><CheckCircle2 className="text-emerald-500 mb-2" /><p className="text-sm font-medium text-slate-700">All clear</p><p className="text-xs text-slate-500">No alerts right now.</p></div>
  )
  const order = { critical: 0, warning: 1, info: 2 }
  return (
    <ul className={cx('space-y-2', compact && 'px-1')}>
      {[...alerts].sort((a, b) => order[a.level] - order[b.level]).map((a) => {
        const { I, c, bg } = META[a.level]
        return (
          <li key={a.id}>
            <button disabled={!a.pid} onClick={() => a.pid && openPatient(a.pid)} className={cx('w-full text-left flex gap-2.5 rounded-lg p-3 ring-1', bg, a.pid && 'hover:brightness-[.98]')}>
              <I size={17} className={cx('shrink-0 mt-0.5', c)} />
              <span><span className="block text-sm font-semibold text-slate-800">{a.title}</span><span className="block text-xs text-slate-600 mt-0.5">{a.body}</span></span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
