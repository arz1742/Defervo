import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, ReferenceArea, Tooltip, CartesianGrid } from 'recharts'
import { RULES, addDays, diffDays, fmtDate, conv, round1, isFever, isHigh } from '../lib/logic'
import { useUnitMode } from './ui'

/** Plots in the viewer's unit. In "as recorded" mode a chart can't mix scales, so it uses
 *  the patient's own unit if all readings share one, otherwise °C (and says so). */
export default function TempChart({ readings, admittedOn, today, height = 220 }) {
  const mode = useUnitMode()
  const units = new Set(readings.map((r) => r.unit || 'C'))
  const unit = mode === 'orig' ? (units.size === 1 ? [...units][0] : 'C') : mode
  const mixed = mode === 'orig' && units.size > 1
  const days = Math.max(diffDays(today, admittedOn), 0)
  const map = Object.fromEntries(readings.map((r) => [r.date, r]))
  const data = Array.from({ length: days + 1 }, (_, i) => {
    const d = addDays(admittedOn, i)
    const r = map[d]
    return { d, label: `D${i + 1}`, date: fmtDate(d), c: r?.temp ?? null, temp: r ? round1(conv(r.temp, unit)) : null, rec: r?.unit || 'C' }
  })
  const lo = conv(35.5, unit), hi = conv(41, unit), fever = round1(conv(RULES.FEVER_C, unit))
  const ticks = unit === 'F' ? [96, 98, 100, 102, 104, 106] : [36, 37, 38, 39, 40, 41]
  const Dot = ({ cx, cy, payload }) => {
    if (payload.c == null || cx == null) return null
    const c = isHigh(payload.c) ? '#e11d48' : isFever(payload.c) ? '#ea580c' : '#059669'
    return <circle cx={cx} cy={cy} r={4.5} fill="#fff" stroke={c} strokeWidth={2.5} />
  }
  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <ReferenceArea y1={fever} y2={hi} fill="#fff7ed" fillOpacity={0.7} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis domain={[lo, hi]} ticks={ticks} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} unit="°" />
            <ReferenceLine y={fever} stroke="#f97316" strokeDasharray="4 4" label={{ value: `Fever ${fever.toFixed(1)}°${unit}`, position: 'insideTopRight', fontSize: 10, fill: '#c2410c' }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.06)' }}
              formatter={(v, n, it) => (v == null ? ['Not measured', 'Temp'] : [`${v.toFixed(1)} °${unit}${it.payload.rec !== unit ? ` (recorded in °${it.payload.rec})` : ''}`, 'Temp'])}
              labelFormatter={(l, p) => (p?.[0] ? `${l} · ${p[0].payload.date}` : l)} />
            <Line type="monotone" dataKey="temp" stroke="#0F7C64" strokeWidth={2} dot={<Dot />} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {mixed && <p className="text-[11px] text-indigo-600 mt-1">This patient has readings in both °C and °F. The chart converts them all to °C.</p>}
    </div>
  )
}
