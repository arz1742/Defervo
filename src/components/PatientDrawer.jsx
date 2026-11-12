import { useState } from 'react'
import { X, Thermometer, Stethoscope, LogOut, Lock, CheckCircle2, Clock, AlertTriangle, HeartCrack, Undo2, BedDouble, CalendarDays, Pencil } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Button, Card, Drawer, Modal, StreakDots, Temp, cx, inputCls, toast } from './ui'
import TempChart from './TempChart'
import TempEntry from './TempEntry'
import { RULES, bedLabel, fmtDay, fmtDate, patientDay, fmtT, isFever, showUnit } from '../lib/logic'
import { useUnitMode } from './ui'

export function StageBadge({ d, status }) {
  if (status === 'discharge_approved') return <Badge tone="violet" icon={LogOut}>Discharge approved</Badge>
  if (status === 'discharged') return <Badge tone="green">Discharged</Badge>
  if (status === 'deceased') return <Badge tone="slate">Deceased</Badge>
  if (d.stage === 'temp_due') return <Badge tone="amber" icon={Thermometer}>Temp due</Badge>
  if (d.stage === 'visit_due') return <Badge tone="sky" icon={Stethoscope}>Ready for doctor</Badge>
  return <Badge tone="green" icon={CheckCircle2}>Rounds done</Badge>
}

export default function PatientDrawer({ pid, onClose }) {
  const { state, dispatch, rIdx, vIdx } = useStore()
  const p = state.patients.find((x) => x.id === pid)
  const [tempOpen, setTempOpen] = useState(false)
  const [deathOpen, setDeathOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  if (!p) return null
  const role = state.user.role
  const mode = useUnitMode()
  const d = patientDay(state, p, rIdx, vIdx)
  const readings = state.readings.filter((r) => r.pid === p.id).sort((a, b) => a.date.localeCompare(b.date))
  const visits = state.visits.filter((v) => v.pid === p.id)
  const isDoc = role === 'doctor' || role === 'head'
  const active = p.status === 'admitted'
  const bed = p.bed ?? p.lastBed

  const history = [...new Set([...readings.map((r) => r.date), ...visits.map((v) => v.date)])].sort().reverse()
    .map((date) => ({ date, r: rIdx[p.id]?.[date], v: vIdx[p.id]?.[date] }))

  const needed = Math.max(RULES.CURE_DAYS - d.streak, 0)

  return (
    <Drawer open onClose={onClose}>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-4 flex items-start gap-4">
        <div className="cond h-12 w-12 rounded-md bg-brand-800 text-white grid place-items-center text-lg font-semibold shrink-0">{bed ? bedLabel(bed) : '—'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{p.name}</h2>
            <StageBadge d={d} status={p.status} />
            {d.eligible && <Badge tone="violet" icon={CheckCircle2}>Discharge eligible</Badge>}
            {d.highFever && <Badge tone="red" icon={AlertTriangle}>High fever</Badge>}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{p.id} · {p.age} yrs · {p.sex === 'M' ? 'Male' : 'Female'} · admitted {fmtDate(p.admittedOn)} {active || p.status === 'discharge_approved' ? `(day ${d.daysIn})` : ''}</p>
        </div>
        <button onClick={onClose} className="p-2 -m-1 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={20} /></button>
      </div>

      <div className="p-5 space-y-4">
        {/* Today */}
        {active && (
          <Card className="p-4">
            <p className="text-sm font-semibold text-brand-800 mb-3">Today, {fmtDay(state.today)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cx('rounded-lg p-3 ring-1', d.temp ? 'bg-emerald-50/50 ring-emerald-200' : 'bg-amber-50/60 ring-amber-200')}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Thermometer size={16} /> 1 · Temperature</div>
                {d.temp ? (
                  <div className="mt-1.5 text-sm text-slate-600"><Temp value={d.temp.temp} rec={d.temp.unit} className="text-lg" /> at {d.temp.at} · {d.temp.by}{mode !== 'orig' && d.temp.unit && d.temp.unit !== mode && <span className="block text-xs text-slate-500">Recorded as {d.temp.raw?.toFixed(1)} °{d.temp.unit}</span>}
                    {d.temp.corrected && <span className="block text-xs text-amber-700 mt-0.5">Corrected from {fmtT(d.temp.corrected.from, showUnit(mode, d.temp.corrected.fromUnit))}: “{d.temp.corrected.reason}”</span>}
                  </div>
                ) : <p className="mt-1.5 text-sm text-amber-800">Not measured yet</p>}
                {role === 'nurse' && (d.temp
                  ? !d.visit && <Button size="sm" variant="ghost" className="mt-2 -ml-2" icon={Pencil} onClick={() => setTempOpen(true)}>Correct reading</Button>
                  : <Button size="sm" className="mt-2" icon={Thermometer} onClick={() => setTempOpen(true)}>Record temperature</Button>)}
              </div>
              <div className={cx('rounded-lg p-3 ring-1', d.visit ? 'bg-emerald-50/50 ring-emerald-200' : d.temp ? 'bg-sky-50/60 ring-sky-200' : 'bg-slate-50 ring-slate-200')}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Stethoscope size={16} /> 2 · Doctor visit</div>
                {d.visit ? <p className="mt-1.5 text-sm text-slate-600">Done at {d.visit.at} · {d.visit.by}</p>
                  : d.temp ? <p className="mt-1.5 text-sm text-sky-800">Ready. Temperature is in.</p>
                  : <p className="mt-1.5 text-sm text-slate-500 flex items-center gap-1.5"><Lock size={13} /> Unlocks after the temperature is recorded</p>}
              </div>
            </div>
          </Card>
        )}

        {/* Discharge criterion */}
        {(active || p.status === 'discharge_approved') && (
          <Card className={cx('p-4', d.eligible && 'ring-violet-300 bg-violet-50/40')}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Discharge criterion: {RULES.CURE_DAYS} full days without fever</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {p.status === 'discharge_approved' ? `Approved by ${p.approvedBy} on ${fmtDate(p.approvedOn)}. Waiting for admin to complete the discharge.`
                    : d.eligible ? 'Criterion met. The patient can be discharged.'
                    : d.streak === 0 ? (d.temp && isFever(d.temp.temp) ? 'Fever today. Count restarts after the next normal reading.' : 'No fever-free days counted yet.')
                    : `${d.streak} fever-free day${d.streak > 1 ? 's' : ''} so far, ${needed} more needed.`}
                </p>
              </div>
              <StreakDots streak={p.status === 'discharge_approved' ? RULES.CURE_DAYS : d.streak} />
            </div>
            {isDoc && active && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="violet" icon={LogOut} disabled={!d.eligible}
                  title={d.eligible ? '' : `Needs ${RULES.CURE_DAYS} consecutive fever-free days`}
                  onClick={() => { dispatch({ type: 'APPROVE_DISCHARGE', pid: p.id }); toast(`Discharge approved for ${p.name}. Admin notified.`) }}>
                  Approve discharge
                </Button>
                {!d.eligible && <span className="text-xs text-slate-500 self-center flex items-center gap-1"><Lock size={12} /> Available once the criterion is met</span>}
              </div>
            )}
            {isDoc && p.status === 'discharge_approved' && <Button className="mt-3" size="sm" variant="secondary" icon={Undo2} onClick={() => setRevokeOpen(true)}>Revoke approval</Button>}
            {(role === 'admin' || role === 'head') && p.status === 'discharge_approved' && (
              <Button className="mt-3 ml-2" size="sm" variant="violet" icon={BedDouble} onClick={() => { dispatch({ type: 'COMPLETE_DISCHARGE', pid: p.id }); toast(`${p.name} discharged. Bed ${bedLabel(p.bed)} is free.`); onClose() }}>Complete discharge</Button>
            )}
          </Card>
        )}

        {/* Visit form */}
        {isDoc && active && d.temp && !d.visit && <VisitForm p={p} d={d} />}
        {isDoc && active && !d.temp && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-4 text-sm text-amber-900">
            <Clock size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <div><p className="font-semibold">Waiting for today’s temperature</p><p className="mt-0.5">The visit form opens once a nurse records the reading, so you don’t have to take it yourself. The patient is in the nurses’ “Temp due” queue.</p></div>
          </div>
        )}

        {/* Chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800">Temperature trend</p>
            <div className="flex gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" />Normal</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-600" />Fever</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600" />≥{fmtT(RULES.HIGH_FEVER_C, mode === 'F' ? 'F' : 'C', '')}</span>
            </div>
          </div>
          <TempChart readings={readings} admittedOn={p.admittedOn} today={p.closedOn || state.today} />
        </Card>

        {/* History */}
        <Card className="overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-sm font-semibold text-slate-800 flex items-center gap-2"><CalendarDays size={15} /> Daily record</p>
          {history.length === 0 ? <p className="px-4 pb-4 text-sm text-slate-500">No records yet. Admitted today.</p> : (
            <ul className="divide-y divide-slate-100">
              {history.map(({ date, r, v }) => (
                <li key={date} className="px-4 py-3 text-sm flex gap-4">
                  <div className="w-20 shrink-0 text-slate-500">{fmtDate(date)}</div>
                  <div className="w-20 shrink-0">{r ? <Temp value={r.temp} rec={r.unit} mark /> : <span className="text-rose-500 text-xs font-medium">Missed</span>}</div>
                  <div className="flex-1 min-w-0 text-slate-600">
                    {v ? <><span className="font-medium text-slate-800">{v.treatment}</span>{v.note && <span className="block text-slate-500">{v.note}</span>}<span className="text-xs text-slate-400">{v.by} · {v.at}</span></> : <span className="text-slate-400">No doctor visit</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {isDoc && (active || p.status === 'discharge_approved') && (
          <div className="pt-2 border-t border-slate-200">
            <button onClick={() => setDeathOpen(true)} className="text-sm text-slate-500 hover:text-rose-600 flex items-center gap-1.5"><HeartCrack size={15} /> Record patient death…</button>
          </div>
        )}
        {p.status === 'deceased' && <Card className="p-4 text-sm text-slate-600">Recorded deceased on {fmtDate(p.closedOn)} by {p.closedBy}.{p.deathNote && ` Note: ${p.deathNote}`}</Card>}
      </div>

      {tempOpen && <TempEntry patient={p} reading={d.temp} onClose={() => setTempOpen(false)} />}
      {deathOpen && <DeathModal p={p} onClose={() => setDeathOpen(false)} onDone={onClose} />}
      {revokeOpen && <RevokeModal p={p} onClose={() => setRevokeOpen(false)} />}
    </Drawer>
  )
}

function VisitForm({ p, d }) {
  const { dispatch } = useStore()
  const [treatment, setTreatment] = useState('')
  const [note, setNote] = useState('')
  const quick = d.fever ? ['Paracetamol 650mg TDS', 'IV fluids + antipyretics', 'Continue antiviral course'] : ['Continue current regimen', 'Observation only', 'Step down IV → oral']
  const ok = treatment.trim().length > 1
  return (
    <Card className="p-4 ring-sky-200">
      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Stethoscope size={16} className="text-sky-600" /> Record today’s visit</p>
      <p className="text-xs text-slate-500 mt-0.5">Today’s reading: <Temp value={d.temp.temp} rec={d.temp.unit} /> {d.fever ? '(fever)' : '(normal)'}</p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Treatment / plan <span className="text-rose-500">*</span></label>
          <input className={cx(inputCls, 'mt-1.5')} value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="e.g. Paracetamol 650mg TDS, oral fluids" />
          <div className="flex flex-wrap gap-1.5 mt-2">{quick.map((q) => <button key={q} type="button" onClick={() => setTreatment(q)} className="rounded-full px-2.5 py-1 text-xs ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50">{q}</button>)}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Clinical notes</label>
          <textarea rows={2} className={cx(inputCls, 'mt-1.5 resize-none')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Symptoms, observations…" />
        </div>
        <Button disabled={!ok} icon={CheckCircle2} onClick={() => { dispatch({ type: 'RECORD_VISIT', pid: p.id, treatment: treatment.trim(), note: note.trim() }); toast(`Visit recorded for ${p.name}`) }}>Mark visit complete</Button>
      </div>
    </Card>
  )
}

function DeathModal({ p, onClose, onDone }) {
  const { dispatch } = useStore()
  const [note, setNote] = useState('')
  const [typed, setTyped] = useState('')
  const ok = typed.trim().toUpperCase() === p.id.toUpperCase()
  return (
    <Modal open onClose={onClose} title="Record patient death" subtitle={`${p.name} · ${p.id}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={!ok} onClick={() => { dispatch({ type: 'RECORD_DEATH', pid: p.id, note }); toast(`Death recorded. Bed ${bedLabel(p.bed)} released.`, 'info'); onClose(); onDone() }}>Confirm</Button></>}>
      <p className="text-sm text-slate-600">This closes the case, releases the bed and counts towards the centre’s mortality rate. It can’t be undone in the app.</p>
      <textarea rows={2} className={cx(inputCls, 'mt-3 resize-none')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Time and cause (optional)" />
      <label className="block text-sm text-slate-700 mt-3">Type the patient ID <b>{p.id}</b> to confirm</label>
      <input className={cx(inputCls, 'mt-1.5')} value={typed} onChange={(e) => setTyped(e.target.value)} />
    </Modal>
  )
}

function RevokeModal({ p, onClose }) {
  const { dispatch } = useStore()
  const [reason, setReason] = useState('')
  return (
    <Modal open onClose={onClose} title="Revoke discharge approval" subtitle={p.name}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={reason.trim().length < 3} onClick={() => { dispatch({ type: 'REVOKE_DISCHARGE', pid: p.id, reason }); toast('Approval revoked. Patient back on daily rounds.', 'info'); onClose() }}>Revoke</Button></>}>
      <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (e.g. fever returned)" autoFocus />
    </Modal>
  )
}
