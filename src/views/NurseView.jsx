import { useMemo, useState } from 'react'
import { Search, Thermometer, CheckCircle2, AlertTriangle, ChevronRight, PartyPopper } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Button, Card, Empty, Progress, Tabs, Temp, cx, StreakDots } from '../components/ui'
import TempEntry from '../components/TempEntry'
import { RULES, WARDS, addDays, bedLabel, fmtDay, wardOf } from '../lib/logic'

export default function NurseView({ openPatient }) {
  const { state, stats, rIdx } = useStore()
  const [tab, setTab] = useState('due')
  const [ward, setWard] = useState('all')
  const [q, setQ] = useState('')
  const [entry, setEntry] = useState(null)
  const yesterday = addDays(state.today, -1)

  const rows = useMemo(() => stats.days
    .filter(({ p, d }) => (tab === 'due' ? !d.temp : tab === 'done' ? d.temp : true))
    .filter(({ p }) => ward === 'all' || wardOf(p.bed) === ward)
    .filter(({ p }) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || bedLabel(p.bed).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.p.bed - b.p.bed), [stats.days, tab, ward, q])

  const total = stats.active.length
  const due = total - stats.tempsDone

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white ring-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-brand-100 text-sm font-medium">Temperature round · {fmtDay(state.today)}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{stats.tempsDone}<span className="text-brand-200 text-xl font-semibold"> / {total} done</span></p>
            <p className="text-brand-100 text-sm mt-1">{due === 0 ? 'All patients measured today. Great work!' : `${due} patient${due > 1 ? 's' : ''} still need${due === 1 ? 's' : ''} a reading · cut-off ${RULES.ROUND_CUTOFF_HOUR}:00`}</p>
          </div>
          <Thermometer size={36} className="text-brand-200 shrink-0" />
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${total ? (stats.tempsDone / total) * 100 : 0}%` }} /></div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-100">
          <span>Each patient is measured <b className="text-white">once a day</b>.</span>
          {stats.missedYesterday.length > 0 && <span className="text-amber-200 font-medium">⚠ {stats.missedYesterday.length} missed yesterday: prioritise them</span>}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'due', label: 'To measure', count: due, tone: 'bg-amber-100 text-amber-800' },
          { id: 'done', label: 'Done', count: stats.tempsDone, tone: 'bg-emerald-100 text-emerald-800' },
          { id: 'all', label: 'All patients', count: total },
        ]} />
        <div className="relative sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or bed…" className="w-full rounded-lg bg-white ring-1 ring-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {['all', ...WARDS.map((w) => w.id)].map((w) => (
          <button key={w} onClick={() => setWard(w)} className={cx('shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition', ward === w ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')}>
            {w === 'all' ? 'All wards' : `Ward ${w}`}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card><Empty icon={tab === 'due' ? PartyPopper : Thermometer} title={tab === 'due' ? 'Nothing left to measure' : 'No patients match'} body={tab === 'due' ? 'Every patient in this view has today’s temperature recorded.' : 'Try another ward or search.'} /></Card>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ p, d }) => {
            const y = rIdx[p.id]?.[yesterday]
            return (
              <Card key={p.id} className={cx('p-3.5 flex items-center gap-3 transition hover:ring-slate-300', d.highFever && 'ring-rose-300 bg-rose-50/30')}>
                <button onClick={() => openPatient(p.id)} className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm grid place-items-center hover:bg-slate-200">{bedLabel(p.bed)}</button>
                <button onClick={() => openPatient(p.id)} className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span>{p.age}{p.sex} · day {d.daysIn}</span>
                    <span>· yday {y ? <Temp value={y.temp} rec={y.unit} className="text-xs" /> : d.daysIn > 1 ? <span className="text-rose-600 font-medium">missed</span> : 'n/a'}</span>
                  </p>
                  {d.missedYesterday && !d.temp && <Badge tone="red" icon={AlertTriangle} className="mt-1">Missed yesterday</Badge>}
                </button>
                {d.temp ? (
                  <div className="text-right shrink-0">
                    <Temp value={d.temp.temp} rec={d.temp.unit} className="text-lg" mark />
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 justify-end"><CheckCircle2 size={11} className="text-emerald-500" />{d.temp.at}</p>
                  </div>
                ) : (
                  <Button className="shrink-0" icon={Thermometer} onClick={() => setEntry(p)}>Record</Button>
                )}
              </Card>
            )
          })}
        </div>
      )}
      {entry && <TempEntry patient={entry} onClose={() => setEntry(null)} />}
    </div>
  )
}
