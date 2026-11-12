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
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <p className="cond text-[52px] leading-none font-semibold text-brand-800">{stats.tempsDone}<span className="text-slate-300">/{total}</span></p>
            <p className="text-sm text-slate-600 mt-1.5">{due === 0 ? 'Every patient has been measured today.' : `temperatures taken · ${due} to go before ${RULES.ROUND_CUTOFF_HOUR}:00`}</p>
          </div>
          {stats.missedYesterday.length > 0 && <p className="text-sm text-rose-700 flex items-center gap-1.5"><AlertTriangle size={15} /> {stats.missedYesterday.length} patient{stats.missedYesterday.length > 1 ? 's' : ''} missed yesterday. Measure them first.</p>}
        </div>
        {/* One tick per patient, in bed order: the round at a glance */}
        <div className="mt-5 flex items-end gap-[2px] h-9 anim-tick" aria-hidden>
          {[...stats.days].sort((a, b) => a.p.bed - b.p.bed).map(({ p, d }, i) => (
            <span key={p.id} style={{ animationDelay: `${i * 6}ms` }} title={`${bedLabel(p.bed)} ${p.name}`}
              className={cx('flex-1 rounded-[1px]', d.temp ? (d.fever ? 'bg-rose-500 h-9' : 'bg-brand-500 h-9') : 'bg-slate-200 h-4')} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>Bed A-01</span><span>Tall marks are measured, red ones have a fever</span><span>D-14</span></div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'due', label: 'To measure', count: due, tone: 'bg-amber-100 text-amber-800' },
          { id: 'done', label: 'Done', count: stats.tempsDone, tone: 'bg-emerald-100 text-emerald-800' },
          { id: 'all', label: 'All patients', count: total },
        ]} />
        <div className="relative sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or bed…" className="w-full rounded-md bg-white ring-1 ring-rule pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {['all', ...WARDS.map((w) => w.id)].map((w) => (
          <button key={w} onClick={() => setWard(w)} className={cx('shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition', ward === w ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')}>
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
                <button onClick={() => openPatient(p.id)} className="cond h-12 w-12 shrink-0 rounded-md bg-paper ring-1 ring-rule text-brand-800 font-semibold text-[17px] grid place-items-center hover:bg-brand-50">{bedLabel(p.bed)}</button>
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
                    <Temp value={d.temp.temp} rec={d.temp.unit} className="cond text-[22px]" />
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 justify-end"><CheckCircle2 size={11} className="text-emerald-500" />{d.temp.at}</p>
                  </div>
                ) : (
                  <Button variant="secondary" className="shrink-0 !ring-brand-300 text-brand-700 hover:!bg-brand-600 hover:text-white" icon={Thermometer} onClick={() => setEntry(p)}>Record</Button>
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
