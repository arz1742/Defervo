import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, ReferenceArea, Tooltip, CartesianGrid } from 'recharts'
import { RULES, addDays, diffDays, fmtDate } from '../lib/logic'

export default function TempChart({ readings, admittedOn, today, height = 220 }) {
  const days = Math.max(diffDays(today, admittedOn), 0)
  const map = Object.fromEntries(readings.map((r) => [r.date, r.temp]))
  const data = Array.from({ length: days + 1 }, (_, i) => {
    const d = addDays(admittedOn, i)
    return { d, label: `D${i + 1}`, date: fmtDate(d), temp: map[d] ?? null }
  })
  const Dot = ({ cx, cy, payload }) => {
    if (payload.temp == null || cx == null) return null
    const c = payload.temp >= RULES.HIGH_FEVER_C ? '#e11d48' : payload.temp >= RULES.FEVER_C ? '#ea580c' : '#059669'
    return <circle cx={cx} cy={cy} r={4.5} fill="#fff" stroke={c} strokeWidth={2.5} />
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <ReferenceArea y1={RULES.FEVER_C} y2={41} fill="#fff7ed" fillOpacity={0.7} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis domain={[35.5, 41]} ticks={[36, 37, 38, 39, 40, 41]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <ReferenceLine y={RULES.FEVER_C} stroke="#f97316" strokeDasharray="4 4" label={{ value: `Fever ${RULES.FEVER_C}°C`, position: 'insideTopRight', fontSize: 10, fill: '#c2410c' }} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.06)' }}
            formatter={(v) => (v == null ? ['Not measured', 'Temp'] : [`${v.toFixed(1)} °C`, 'Temp'])}
            labelFormatter={(l, p) => (p?.[0] ? `${l} · ${p[0].payload.date}` : l)} />
          <Line type="monotone" dataKey="temp" stroke="#0d8077" strokeWidth={2.5} dot={<Dot />} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
