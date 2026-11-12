import { useMemo, useState } from 'react'
import { Stethoscope, LogOut, Thermometer, CheckCircle2, AlertTriangle, ChevronRight, Search, Clock } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Card, Empty, Progress, Stat, StreakDots, Tabs, Temp, cx } from '../components/ui'
import { StageBadge } from '../components/PatientDrawer'
import { RULES, bedLabel, fmtDate, fmtDay, patientDay, fmtT, showUnit } from '../lib/logic'
import { useUnitMode } from '../components/ui'

export default function DoctorView({ openPatient }) {
  const { state, stats, rIdx, vIdx } = useStore()
  const [tab, setTab] = useState('ready')
  const [q, setQ] = useState('')

  const groups = useMemo(() => {
    const ready = stats.days.filter((x) => x.d.stage === 'visit_due')
      .sort((a, b) => (b.d.eligible - a.d.eligible) || (b.d.temp.temp - a.d.temp.temp))
    return {
      ready,
      eligible: stats.eligible,
      waiting: stats.days.filter((x) => x.d.stage === 'temp_due'),
      done: stats.days.filter((x) => x.d.stage === 'done'),
      approved: stats.approved.map((p) => ({ p, d: patientDay(state, p, rIdx, vIdx) })),
      all: stats.days,
    }
  }, [stats, state, rIdx, vIdx])

  const rows = (groups[tab] || []).filter(({ p }) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || bedLabel(p.bed).toLowerCase().includes(q.toLowerCase()))
  const total = stats.active.length
  const mode = useUnitMode()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Ready for visit" value={groups.ready.length} sub="Temperature already taken" icon={Stethoscope} tone="sky" />
        <Stat label="Visits done today" value={`${stats.visitsDone}/${total}`} icon={CheckCircle2} tone="green"><Progress value={stats.visitsDone} max={total} tone="brand" /></Stat>
        <Stat label="Discharge eligible" value={stats.eligible.length} sub={`${RULES.CURE_DAYS} fever-free days`} icon={LogOut} tone="violet" />
        <Stat label="High fever today" value={stats.highFevers.length} sub={`≥ ${fmtT(RULES.HIGH_FEVER_C, mode === 'F' ? 'F' : 'C')}`} icon={AlertTriangle} tone="red" />
      </div>

      {stats.highFevers.length > 0 && (
        <Card className="p-3.5 ring-rose-200 bg-rose-50/60 flex flex-wrap items-center gap-2 text-sm">
          <AlertTriangle size={16} className="text-rose-600" /><span className="font-semibold text-rose-800">Prioritise:</span>
          {stats.highFevers.map(({ p, d }) => (
            <button key={p.id} onClick={() => openPatient(p.id)} className="rounded-full bg-white ring-1 ring-rose-200 px-2.5 py-0.5 text-rose-700 hover:bg-rose-100">{bedLabel(p.bed)} {p.name.split(' ')[0]} · {fmtT(d.temp.temp, showUnit(mode, d.temp.unit), '')}</button>
          ))}
        </Card>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'ready', label: 'Ready for visit', count: groups.ready.length, tone: 'bg-sky-100 text-sky-800' },
          { id: 'eligible', label: 'Discharge eligible', count: groups.eligible.length, tone: 'bg-violet-100 text-violet-800' },
          { id: 'waiting', label: 'Awaiting temperature', count: groups.waiting.length, tone: 'bg-amber-100 text-amber-800' },
          { id: 'done', label: 'Visited', count: groups.done.length, tone: 'bg-emerald-100 text-emerald-800' },
          { id: 'approved', label: 'Approved · with admin', count: groups.approved.length, tone: 'bg-violet-100 text-violet-800' },
          { id: 'all', label: 'All', count: total },
        ]} />
        <div className="relative lg:w-60">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or bed…" className="w-full rounded-lg bg-white ring-1 ring-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {tab === 'waiting' && rows.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2"><Clock size={15} /> These patients are in the nurses’ queue. Visits unlock once their temperature is recorded.</p>
      )}

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty icon={CheckCircle2} title={{ ready: 'No one waiting for a visit', eligible: 'No patients eligible yet', waiting: 'All temperatures are in', done: 'No visits yet today', approved: 'No pending discharges', all: 'No patients' }[tab]}
            body={tab === 'ready' ? 'Patients appear here as soon as a nurse records their temperature.' : tab === 'eligible' ? `Patients appear after ${RULES.CURE_DAYS} consecutive fever-free days.` : ''} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Bed</th><th className="px-4 py-2.5">Patient</th><th className="px-4 py-2.5 hidden md:table-cell">Day</th>
                  <th className="px-4 py-2.5">Today</th><th className="px-4 py-2.5 hidden sm:table-cell">Fever-free</th><th className="px-4 py-2.5 hidden lg:table-cell">Status</th><th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ p, d }) => (
                  <tr key={p.id} onClick={() => openPatient(p.id)} className={cx('cursor-pointer hover:bg-slate-50/80', d.highFever && 'bg-rose-50/40')}>
                    <td className="px-4 py-3 font-semibold text-slate-700">{bedLabel(p.bed)}</td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.id} · {p.age}{p.sex}</p></td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600">{d.daysIn}</td>
                    <td className="px-4 py-3">{d.temp ? <Temp value={d.temp.temp} rec={d.temp.unit} mark /> : <span className="text-xs text-amber-700 font-medium">Not taken</span>}</td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="flex items-center gap-2"><StreakDots streak={p.status === 'discharge_approved' ? 3 : d.streak} size="sm" /><span className="text-xs text-slate-500">{Math.min(d.streak, 9)}d</span></div></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="flex gap-1.5"><StageBadge d={d} status={p.status} />{d.eligible && <Badge tone="violet">Eligible</Badge>}</div></td>
                    <td className="px-3 text-slate-300"><ChevronRight size={18} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
