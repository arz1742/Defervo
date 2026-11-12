import { useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { USERS, ROLE_META, WARDS, RULES, bedLabel, fmtDay, isFever } from '../lib/logic'
import { Logo } from '../components/Logo'
import { Avatar } from '../App'
import { cx } from '../components/ui'

const STATUS = {
  due: { cls: 'bg-white ring-1 ring-inset ring-slate-300', label: 'Not measured yet' },
  normal: { cls: 'bg-brand-500', label: 'No fever today' },
  fever: { cls: 'bg-rose-500', label: 'Fever today' },
  home: { cls: 'bg-violet-500', label: 'Ready to go home' },
  free: { cls: 'bg-transparent ring-1 ring-inset ring-slate-300 [background-image:repeating-linear-gradient(45deg,#E2EEE7_0,#E2EEE7_2px,transparent_2px,transparent_5px)]', label: 'Free bed' },
}

/** Counts up from 0 once on mount; shows the final value straight away if the user prefers reduced motion. */
function CountUp({ to, delay = 0, duration = 900 }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [n, setN] = useState(reduce ? to : 0)
  useEffect(() => {
    if (reduce) { setN(to); return }
    let raf, start
    const t = setTimeout(() => {
      const step = (ts) => {
        start ??= ts
        const p = Math.min((ts - start) / duration, 1)
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [to])
  return <span className="tabular-nums">{n}</span>
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

  const lines = [
    <><CountUp to={stats.occupied} delay={150} /> of {RULES.CAPACITY} beds full.</>,
    <><CountUp to={tempsDue} delay={300} /> temperatures still to take.</>,
    <><CountUp to={goingHome} delay={450} /> patients ready to go home.</>,
  ]

  return (
    <div className="min-h-full flex flex-col lg:grid lg:grid-cols-[1fr_480px] bg-paper">
      {/* Live ward board */}
      <section className="px-6 sm:px-12 py-8 lg:py-10 flex flex-col">
        <div className="hidden lg:flex items-center justify-between intro" style={{ animationDelay: '0ms' }}>
          <Logo size={44} />
          <span className="text-sm text-slate-500">{fmtDay(state.today)}</span>
        </div>

        <div className="lg:mt-20 max-w-3xl">
          <h1 className="cond text-[44px] sm:text-[66px] leading-[0.98] font-semibold tracking-tight text-brand-800">
            {lines.map((l, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <span className="block line-in" style={{ animationDelay: `${120 + i * 150}ms` }}>{l}</span>
              </span>
            ))}
          </h1>
          <p className="mt-6 text-[16px] text-slate-600 max-w-xl leading-relaxed intro" style={{ animationDelay: '650ms' }}>
            Defervo replaces the ward’s paper temperature journal. Every nurse, doctor and admin sees exactly what’s waiting for them, so no one is measured twice and no bed stays blocked once a patient has gone {RULES.CURE_DAYS} days without a fever.
          </p>
        </div>

        <div className="mt-10 lg:mt-auto lg:pt-12 intro" style={{ animationDelay: '800ms' }}>
          <div className="rounded-2xl bg-white ring-1 ring-rule p-5 sm:p-6 w-fit max-w-full">
            <p className="text-sm font-semibold text-brand-800 mb-4">Bed status right now</p>
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)] gap-x-10 2xl:gap-x-8 gap-y-5 w-fit">
              {WARDS.map((w) => (
                <div key={w.id}>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Ward {w.id}</p>
                  <div className="grid grid-cols-[repeat(10,auto)] gap-[3px] 2xl:gap-1 w-fit">
                    {Array.from({ length: w.to - w.from + 1 }, (_, i) => w.from + i).map((b) => {
                      const x = beds[b]; const s = x ? x.s : 'free'
                      return <span key={b} title={`${bedLabel(b)}${x ? ` · ${x.p.name}` : ''} · ${STATUS[s].label}`} className={cx('h-[18px] w-[18px] 2xl:h-[22px] 2xl:w-[22px] rounded-[4px]', STATUS[s].cls)} />
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
              {['due', 'normal', 'fever', 'home', 'free'].map((k) => (
                <span key={k} className="flex items-center gap-1.5"><span className={cx('h-3 w-3 rounded-[3px]', STATUS[k].cls)} />{STATUS[k].label} <b className="text-slate-800 tabular-nums">{count(k)}</b></span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shift start */}
      <section className="bg-white lg:border-l border-rule px-6 sm:px-10 py-8 lg:py-10 flex flex-col order-first lg:order-none">
        <div className="lg:hidden mb-6"><Logo size={36} /></div>
        <figure className="intro" style={{ animationDelay: '200ms' }}>
          <img src="/ward-care.jpg" alt="A nurse checking on a smiling patient in a hospital bed"
            className="w-full aspect-[16/10] object-cover object-[center_35%] rounded-2xl ring-1 ring-rule" />
        </figure>

        <h2 className="mt-7 text-2xl font-semibold tracking-tight text-brand-800 intro" style={{ animationDelay: '350ms' }}>Start your shift</h2>
        <p className="text-sm text-slate-500 mt-1 intro" style={{ animationDelay: '400ms' }}>This is a demo, so there’s no password. Pick a staff member to open their view. You can switch at any time.</p>

        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {USERS.map((u, i) => {
            const [n, what] = waiting[u.role]
            return (
              <li key={u.id} className="intro" style={{ animationDelay: `${480 + i * 80}ms` }}>
                <button onClick={() => dispatch({ type: 'LOGIN', user: u })} aria-label={`${ROLE_META[u.role].label} ${u.name}`}
                  className="group w-full text-left flex items-center gap-4 py-3.5 px-2 -mx-2 hover:bg-brand-50 transition rounded-lg">
                  <Avatar u={u} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-slate-900">{ROLE_META[u.role].label}</span>
                    <span className="block text-sm text-slate-500">{u.name}</span>
                  </span>
                  <span className="text-right">
                    <span className="cond block text-[26px] leading-none font-semibold text-brand-700">{n}</span>
                    <span className="block text-[11px] text-slate-500 max-w-[140px] leading-tight mt-0.5">{what}</span>
                  </span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
                </button>
              </li>
            )
          })}
        </ul>

        <details className="mt-5 group intro" style={{ animationDelay: '820ms' }}>
          <summary className="cursor-pointer text-sm font-semibold text-brand-700 list-none flex items-center gap-1.5">
            <ChevronRight size={15} className="transition group-open:rotate-90" /> Two-minute walkthrough
          </summary>
          <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-600">
            <li>As the nurse, record a temperature in °C or °F.</li>
            <li>As the doctor, find that patient under “Ready for visit”, record the visit, then approve a discharge.</li>
            <li>As admin, complete the discharge and admit someone into the free bed.</li>
            <li>As head doctor, check recovery against the target and convert all readings to one unit.</li>
          </ol>
        </details>

        <p className="mt-auto pt-8 text-xs text-slate-400">Prototype for the FactWise TPM assessment. Demo data is stored only in this browser.</p>
      </section>
    </div>
  )
}
