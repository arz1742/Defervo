import { Thermometer, Stethoscope, BedDouble, LayoutDashboard, ArrowRight, ShieldCheck } from 'lucide-react'
import { useStore } from '../lib/store'
import { USERS, ROLE_META } from '../lib/logic'
import { Logo } from '../components/Logo'

const CARD = {
  nurse: { icon: Thermometer, c: 'bg-sky-50 text-sky-700', does: ['See who still needs today’s temperature', 'Record each reading once, in seconds', 'Flag high fevers to doctors'] },
  doctor: { icon: Stethoscope, c: 'bg-brand-50 text-brand-700', does: ['Visit only patients whose temp is in', 'Fever trend & treatment notes', 'Approve discharges at 3 fever-free days'] },
  admin: { icon: BedDouble, c: 'bg-violet-50 text-violet-700', does: ['Live bed board for all 74 beds', 'Complete approved discharges', 'Admit from the waiting list'] },
  head: { icon: LayoutDashboard, c: 'bg-amber-50 text-amber-700', does: ['Recovery vs 85% benchmark', 'Rounds compliance & alerts', 'Full activity log'] },
}

export default function Login() {
  const { dispatch, stats, state } = useStore()
  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      <div className="lg:w-[42%] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -right-10 top-20 h-40 w-40 rounded-full bg-white/5" />
        <Logo light />
        <div className="relative my-10 lg:my-0">
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">Every patient measured.<br />Every visit on time.<br /><span className="text-brand-200">Every bed turned around fast.</span></h1>
          <p className="mt-4 text-brand-100 max-w-md">CareCycle replaces the paper temperature journal with one live view of the quarantine ward, from admission to discharge.</p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold tabular-nums">{stats.occupied}<span className="text-sm text-brand-200">/74</span></p><p className="text-xs text-brand-100">beds in use</p></div>
            <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold tabular-nums">{stats.recovery.toFixed(0)}%</p><p className="text-xs text-brand-100">recovery rate</p></div>
            <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold tabular-nums">{state.waitlist.length}</p><p className="text-xs text-brand-100">waiting</p></div>
          </div>
        </div>
        <p className="relative text-xs text-brand-200 flex items-center gap-1.5"><ShieldCheck size={14} /> Prototype · demo data is stored only in this browser</p>
      </div>

      <div className="flex-1 p-6 lg:p-12 flex flex-col justify-center">
        <div className="max-w-2xl w-full mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="text-slate-500 mt-1">Demo mode: pick a staff member to see their view. You can switch roles any time.</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {USERS.map((u) => {
              const m = CARD[u.role], I = m.icon
              return (
                <button key={u.id} onClick={() => dispatch({ type: 'LOGIN', user: u })}
                  className="group text-left rounded-xl bg-white ring-1 ring-slate-200 shadow-card p-4 hover:ring-brand-400 hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg p-2.5 ${m.c}`}><I size={20} /></span>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900">{ROLE_META[u.role].label}</p><p className="text-sm text-slate-500 truncate">{u.name}</p></div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
                  </div>
                  <ul className="mt-3 space-y-1">{m.does.map((d) => <li key={d} className="text-xs text-slate-600 flex gap-1.5"><span className="text-brand-500">•</span>{d}</li>)}</ul>
                </button>
              )
            })}
          </div>
          <div className="mt-6 rounded-xl bg-slate-100/80 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">Suggested demo path (2 min)</p>
            <ol className="list-decimal ml-5 space-y-0.5">
              <li><b>Nurse</b>: record a temperature, then see the patient move to “Done”.</li>
              <li><b>Doctor</b>: the patient now shows in “Ready for visit”. Record the visit and approve an eligible discharge.</li>
              <li><b>Admin</b>: complete the discharge, then admit someone from the waiting list into the freed bed.</li>
              <li><b>Head Doctor</b>: check the benchmark, alerts and activity log. Use <b>Demo ▸ Next day</b> to fast-forward.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
