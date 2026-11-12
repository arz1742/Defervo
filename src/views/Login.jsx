import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { USERS, ROLE_META, WARDS, RULES, bedLabel, fmtDay, isFever } from '../lib/logic'
import { Logo } from '../components/Logo'
import { Avatar } from '../App'
import { cx } from '../components/ui'

const STATUS = {
  due: { cls: 'bg-white ring-1 ring-inset ring-slate-300', label: 'Not measured yet' },
  normal: { cls: 'bg-emerald-600', label: 'No fever today' },
  fever: { cls: 'bg-rose-600', label: 'Fever today' },
  home: { cls: 'bg-violet-600', label: 'Ready to go home' },
  free: { cls: 'bg-transparent ring-1 ring-inset ring-dashed ring-slate-300 [background-image:repeating-linear-gradient(45deg,#E3E9F2_0,#E3E9F2_2px,transparent_2px,transparent_5px)]', label: 'Free bed' },
}

export default function Login() {
  const { dispatch, stats, state } = useStore()

  const beds = useMemo(() => {
    const byBed = {}
    for (const { p, d } of stats.days) byBed[p.bed] = { p, s: d.eligible ? 'home' : !d.temp ? 'due' : isFever(d.temp.temp) ? 'fever' : 'normal' }
    for (const p of stats.approved) byBed[p.bed] = { p, s: 'home' }
    return byBed
  }, [stats])
  const count = (k) => Object.values(beds).filter((b) => b.s === k).length + (k === 'free' ? stats.free : 0)
  const tempsDue = stats.active.length - stats.tempsDone
  const ready = stats.tempsDone - stats.visitsDone
  const goingHome = stats.eligible.length + stats.approved.length

  const waiting = {
    nurse: [tempsDue, tempsDue === 1 ? 'temperature to take' : 'temperatures to take'],
    doctor: [ready, ready === 1 ? 'patient ready for a visit' : 'patients ready for a visit'],
    admin: [stats.approved.length, stats.approved.length === 1 ? 'discharge to complete' : 'discharges to complete'],
    head: [`${stats.recovery.toFixed(1)}%`, `recovery, against an ${100 - RULES.MORTALITY_LIMIT}% target`],
  }

  return (
    <div className="min-h-full flex flex-col lg:grid lg:grid-cols-[1fr_440px]">
      {/* Ward board */}
      <section className="chart-paper px-6 sm:px-12 py-8 lg:py-10 flex flex-col">
        <div className="flex items-center justify-between">
          <Logo size={30} />
          <span className="text-sm text-slate-500">{fmtDay(state.today)}</span>
        </div>

        <div className="mt-10 lg:mt-16 max-w-3xl">
          <h1 className="cond text-[44px] sm:text-[64px] leading-[0.95] font-semibold tracking-tight text-brand-800">
            {stats.occupied} of {RULES.CAPACITY} beds full.<br />
            {tempsDue} temperatures still to take.<br />
            {goingHome} patients ready to go home.
          </h1>
          <p className="mt-5 text-[15px] text-slate-600 max-w-xl leading-relaxed">
            Defervo replaces the ward’s paper temperature journal. Nurses, doctors and admin staff each see what’s waiting for them, so no one is measured twice and no bed stays blocked once a patient has gone {RULES.CURE_DAYS} days without a fever.
          </p>
        </div>

        <div className="mt-10 lg:mt-auto lg:pt-12">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6">
            {WARDS.map((w) => (
              <div key={w.id}>
                <p className="text-sm font-semibold text-brand-800 mb-2">Ward {w.id}</p>
                <div className="grid grid-cols-10 gap-[3px] sm:gap-1 w-fit">
                  {Array.from({ length: w.to - w.from + 1 }, (_, i) => w.from + i).map((b) => {
                    const x = beds[b]; const s = x ? x.s : 'free'
                    return <span key={b} title={`${bedLabel(b)}${x ? ` · ${x.p.name}` : ''} · ${STATUS[s].label}`} className={cx('h-[17px] w-[17px] sm:h-[22px] sm:w-[22px] rounded-[3px]', STATUS[s].cls)} />
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            {['due', 'normal', 'fever', 'home', 'free'].map((k) => (
              <span key={k} className="flex items-center gap-1.5"><span className={cx('h-3 w-3 rounded-[2px]', STATUS[k].cls)} />{STATUS[k].label} <b className="text-slate-800 tabular-nums">{count(k)}</b></span>
            ))}
          </div>
        </div>
      </section>

      {/* Shift start */}
      <section className="bg-white lg:border-l border-rule px-6 sm:px-10 py-8 lg:py-10 flex flex-col order-first lg:order-none">
        <div className="lg:hidden mb-6"><Logo size={28} /></div>
        <h2 className="text-2xl font-semibold tracking-tight text-brand-800 lg:mt-16">Start your shift</h2>
        <p className="text-sm text-slate-500 mt-1">This is a demo, so there’s no password. Pick a staff member to open their view. You can switch at any time.</p>

        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {USERS.map((u) => {
            const [n, what] = waiting[u.role]
            return (
              <li key={u.id}>
                <button onClick={() => dispatch({ type: 'LOGIN', user: u })} aria-label={`${ROLE_META[u.role].label} ${u.name}`}
                  className="group w-full text-left flex items-center gap-4 py-4 px-1 hover:bg-paper transition rounded-md">
                  <Avatar u={u} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-slate-900">{ROLE_META[u.role].label}</span>
                    <span className="block text-sm text-slate-500">{u.name}</span>
                  </span>
                  <span className="text-right">
                    <span className="cond block text-[26px] leading-none font-semibold text-brand-800">{n}</span>
                    <span className="block text-[11px] text-slate-500 max-w-[130px] leading-tight mt-0.5">{what}</span>
                  </span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-800 group-hover:translate-x-0.5 transition" />
                </button>
              </li>
            )
          })}
        </ul>

        <details className="mt-6 group">
          <summary className="cursor-pointer text-sm font-semibold text-brand-800 list-none flex items-center gap-1.5">
            <ChevronRight size={15} className="transition group-open:rotate-90" /> Two-minute walkthrough
          </summary>
          <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-600">
            <li>As the nurse, record a temperature in °C or °F.</li>
            <li>As the doctor, find that patient under “Ready for visit”, record the visit, then approve a discharge.</li>
            <li>As admin, complete the discharge and admit someone into the free bed.</li>
            <li>As head doctor, check recovery against the target and convert all readings to one unit.</li>
          </ol>
        </details>

        <p className="mt-auto pt-10 text-xs text-slate-400">Prototype for the FactWise TPM assessment. Demo data is stored only in this browser.</p>
      </section>
    </div>
  )
}
