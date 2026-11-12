import { useMemo } from 'react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend, LineChart } from 'recharts'
import { HeartPulse, BedDouble, Clock, ShieldCheck, Thermometer, Stethoscope, LogOut, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, Progress, Stat, cx } from '../components/ui'
import AlertsList from '../components/AlertsList'
import { RULES, addDays, fmtDate } from '../lib/logic'

export default function Dashboard({ openPatient, go }) {
  const { state, stats, alerts } = useStore()
  const total = stats.active.length

  const weekly = useMemo(() => {
    const closed = state.patients.filter((p) => p.closedOn)
    return Array.from({ length: 8 }, (_, k) => {
      const i = 7 - k
      const end = addDays(state.today, -7 * i), start = addDays(end, -6)
      const wk = closed.filter((p) => p.closedOn >= start && p.closedOn <= end)
      const died = wk.filter((p) => p.status === 'deceased').length
      return { week: `${fmtDate(start)}`, recovered: wk.length - died, deceased: died, mortality: wk.length ? +((died / wk.length) * 100).toFixed(1) : null }
    })
  }, [state.patients, state.today])

  const compliance = useMemo(() => state.snapshots.slice(-7).map((s) => ({ day: fmtDate(s.date), temps: Math.round((s.temps / s.patients) * 100), visits: Math.round((s.visits / s.patients) * 100) })), [state.snapshots])

  const ok = stats.mortality <= RULES.MORTALITY_LIMIT
  const recUp = stats.recentMortality > stats.mortality

  return (
    <div className="space-y-4">
      {/* Benchmark hero */}
      <Card className={cx('p-5 ring-0 text-white', ok ? 'bg-gradient-to-br from-brand-700 to-brand-900' : 'bg-gradient-to-br from-rose-600 to-rose-800')}>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr_1fr] items-center">
          <div>
            <p className="text-sm font-medium text-white/70 flex items-center gap-2"><ShieldCheck size={16} /> Treatment quality vs benchmark</p>
            <p className="text-4xl font-bold mt-1 tabular-nums">{stats.recovery.toFixed(1)}%<span className="text-lg font-medium text-white/70"> recovery</span></p>
            <p className="text-sm text-white/80 mt-1">{ok ? `Within target. Benchmark is ≥ ${100 - RULES.MORTALITY_LIMIT}% recovery (≤ ${RULES.MORTALITY_LIMIT}% mortality).` : `Below the ${100 - RULES.MORTALITY_LIMIT}% target. Review treatment protocols.`}</p>
            <div className="mt-3 h-2.5 rounded-full bg-white/15 relative overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${stats.recovery}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-amber-300" style={{ left: `${100 - RULES.MORTALITY_LIMIT}%` }} />
            </div>
            <p className="text-[11px] text-white/60 mt-1">Yellow marker = {100 - RULES.MORTALITY_LIMIT}% target · {stats.closed.length} closed cases</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-white/70">Mortality (all time)</p>
            <p className="text-2xl font-bold tabular-nums">{stats.mortality.toFixed(1)}%</p>
            <p className="text-xs text-white/70">{stats.deceased} deaths · {stats.recovered} recovered</p>
          </div>
          <div className={cx('rounded-xl p-4', stats.recentMortality > RULES.MORTALITY_LIMIT ? 'bg-amber-400/25 ring-1 ring-amber-300/60' : 'bg-white/10')}>
            <p className="text-xs text-white/70">Mortality (last 7 days)</p>
            <p className="text-2xl font-bold tabular-nums flex items-center gap-2">{stats.recentMortality.toFixed(1)}% {recUp ? <TrendingUp size={18} className="text-amber-200" /> : <TrendingDown size={18} className="text-emerald-200" />}</p>
            <p className="text-xs text-white/70">{stats.recentCount} cases closed{stats.recentMortality > RULES.MORTALITY_LIMIT && ' · above limit'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Bed occupancy" value={`${stats.occupied}/${RULES.CAPACITY}`} sub={`${state.waitlist.length} on waiting list`} icon={BedDouble} tone="brand"><Progress value={stats.occupied} max={RULES.CAPACITY} /></Stat>
        <Stat label="Temperatures today" value={`${stats.tempsDone}/${total}`} sub={`${stats.fevers} with fever`} icon={Thermometer} tone="amber"><Progress value={stats.tempsDone} max={total} tone="amber" /></Stat>
        <Stat label="Doctor visits today" value={`${stats.visitsDone}/${total}`} sub={`${stats.tempsDone - stats.visitsDone} ready & waiting`} icon={Stethoscope} tone="sky"><Progress value={stats.visitsDone} max={total} tone="sky" /></Stat>
        <Stat label="Avg. length of stay" value={`${stats.avgStay.toFixed(1)} d`} sub="Recovered patients" icon={Clock} tone="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <p className="font-semibold text-slate-800">Weekly outcomes</p>
          <p className="text-xs text-slate-500 mb-2">Closed cases per week (bars) and weekly mortality % (line) vs the {RULES.MORTALITY_LIMIT}% limit</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weekly} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="p" orientation="right" domain={[0, 40]} tickFormatter={(v) => v + '%'} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v, n) => (n === 'Mortality %' ? [v == null ? 'n/a' : v + '%', n] : [v, n])} labelFormatter={(l) => 'Week of ' + l} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                <Bar yAxisId="n" dataKey="recovered" name="Recovered" stackId="a" fill="#2bbcab" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="n" dataKey="deceased" name="Deceased" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <ReferenceLine yAxisId="p" y={RULES.MORTALITY_LIMIT} stroke="#e11d48" strokeDasharray="4 4" label={{ value: `${RULES.MORTALITY_LIMIT}% limit`, position: 'insideTopLeft', fontSize: 10, fill: '#be123c' }} />
                <Line yAxisId="p" dataKey="mortality" name="Mortality %" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3.5, fill: '#fff', strokeWidth: 2 }} connectNulls isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4 flex flex-col">
          <p className="font-semibold text-slate-800 mb-3">Needs attention</p>
          <div className="flex-1 overflow-y-auto -mx-1 max-h-72"><AlertsList alerts={alerts} openPatient={openPatient} compact /></div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <p className="font-semibold text-slate-800">Daily rounds compliance</p>
          <p className="text-xs text-slate-500 mb-2">% of patients measured and visited on each completed day (last 7). Gaps here delay discharges.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compliance} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis domain={[50, 100]} tickFormatter={(v) => v + '%'} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => v + '%'} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                <Line dataKey="temps" name="Temperatures" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                <Line dataKey="visits" name="Doctor visits" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <p className="font-semibold text-slate-800 mb-3">Discharge pipeline</p>
          <Pipe icon={HeartPulse} tone="amber" label="In treatment" value={total - stats.eligible.length} />
          <Pipe icon={ShieldCheck} tone="violet" label="Eligible, awaiting doctor approval" value={stats.eligible.length} onClick={() => go('ward')} />
          <Pipe icon={LogOut} tone="violet" label="Approved, awaiting admin" value={stats.approved.length} />
          <Pipe icon={BedDouble} tone="green" label="Free beds" value={stats.free} />
          <Pipe icon={AlertTriangle} tone="red" label="High fever today" value={stats.highFevers.length} last />
        </Card>
      </div>
    </div>
  )
}

function Pipe({ icon: Icon, label, value, tone, onClick, last }) {
  const c = { amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700' }[tone]
  return (
    <button onClick={onClick} disabled={!onClick} className={cx('w-full flex items-center gap-3 py-2.5 text-left', !last && 'border-b border-slate-100', onClick && 'hover:bg-slate-50 cursor-pointer')}>
      <span className={cx('rounded-lg p-1.5', c)}><Icon size={15} /></span>
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-lg font-bold tabular-nums text-slate-900">{value}</span>
    </button>
  )
}
