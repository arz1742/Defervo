import { useMemo, useState } from 'react'
import { BedDouble, LogOut, UserPlus, Users, CheckCircle2, Lock, Clock, Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Button, Card, Empty, Field, Modal, Stat, Tabs, cx, inputCls, toast } from '../components/ui'
import { RULES, WARDS, bedLabel, diffDays, fmtDate, isFever } from '../lib/logic'

export default function AdminView({ openPatient }) {
  const { state, stats, dispatch } = useStore()
  const [tab, setTab] = useState('beds')
  const [admit, setAdmit] = useState(null) // { wid?, bed? }
  const [addOpen, setAddOpen] = useState(false)

  const byBed = useMemo(() => Object.fromEntries(state.patients.filter((p) => p.bed).map((p) => [p.bed, p])), [state.patients])
  const eligibleIds = new Set(stats.eligible.map((x) => x.p.id))
  const recent = state.patients.filter((p) => p.status === 'discharged' && diffDays(state.today, p.closedOn) <= 3).sort((a, b) => b.closedOn.localeCompare(a.closedOn))
  const waitlist = [...state.waitlist].sort((a, b) => (a.triage === 'urgent' ? -1 : 0) - (b.triage === 'urgent' ? -1 : 0) || (a.arrivedOn + a.arrivedAt).localeCompare(b.arrivedOn + b.arrivedAt))

  const discharge = (p) => { dispatch({ type: 'COMPLETE_DISCHARGE', pid: p.id }); toast(`${p.name} discharged. Bed ${bedLabel(p.bed)} is now free.`) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Beds occupied" value={`${stats.occupied}/${RULES.CAPACITY}`} sub={stats.free ? `${stats.free} free` : 'Full capacity'} icon={BedDouble} tone={stats.free ? 'green' : 'amber'} />
        <Stat label="Ready to discharge" value={stats.approved.length} sub="Approved by doctor" icon={LogOut} tone="violet" />
        <Stat label="Waiting list" value={state.waitlist.length} sub={`${state.waitlist.filter((w) => w.triage === 'urgent').length} urgent`} icon={Users} tone="sky" />
        <Stat label="Discharged (3 days)" value={recent.length} icon={CheckCircle2} tone="brand" />
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'beds', label: 'Bed board' },
        { id: 'discharge', label: 'Discharges', count: stats.approved.length, tone: 'bg-violet-100 text-violet-800' },
        { id: 'admit', label: 'Admissions', count: state.waitlist.length, tone: 'bg-sky-100 text-sky-800' },
      ]} />

      {tab === 'beds' && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 mb-4">
            <Legend c="bg-white ring-slate-300" l="In care" /><Legend c="bg-orange-50 ring-orange-300" l="Fever today" />
            <Legend c="bg-violet-100 ring-violet-400" l="Ready to discharge" /><Legend c="bg-emerald-50 ring-emerald-400 ring-dashed" l="Free bed" />
          </div>
          <div className="space-y-5">
            {WARDS.map((w) => (
              <div key={w.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Ward {w.id}</p>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {Array.from({ length: w.to - w.from + 1 }, (_, i) => w.from + i).map((b) => {
                    const p = byBed[b]
                    const temp = p && state.readings.find((r) => r.pid === p.id && r.date === state.today)
                    if (!p) return (
                      <button key={b} onClick={() => setAdmit({ bed: b })} className="aspect-[4/3] rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50 text-emerald-700 text-xs font-semibold flex flex-col items-center justify-center hover:bg-emerald-100">
                        {bedLabel(b)}<Plus size={14} />
                      </button>
                    )
                    const approved = p.status === 'discharge_approved'
                    return (
                      <button key={b} onClick={() => openPatient(p.id)} title={p.name}
                        className={cx('aspect-[4/3] rounded-lg ring-1 text-[11px] font-semibold flex flex-col items-center justify-center px-1 transition hover:scale-[1.04]',
                          approved ? 'bg-violet-100 ring-violet-400 text-violet-800' : temp && isFever(temp.temp) ? 'bg-orange-50 ring-orange-300 text-orange-800' : 'bg-white ring-slate-300 text-slate-700')}>
                        <span>{bedLabel(b)}</span>
                        <span className="font-normal truncate max-w-full opacity-80">{p.name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'discharge' && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><p className="font-semibold text-slate-800">Approved by doctor. Complete the discharge</p><Badge tone="violet">{stats.approved.length}</Badge></div>
            {stats.approved.length === 0 ? <Empty icon={CheckCircle2} title="No pending discharges" body="Patients appear here the moment a doctor approves their discharge." /> : (
              <ul className="divide-y divide-slate-100">
                {stats.approved.map((p) => (
                  <li key={p.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                    <span className="h-10 w-10 rounded-lg bg-violet-100 text-violet-800 font-bold text-xs grid place-items-center">{bedLabel(p.bed)}</span>
                    <button onClick={() => openPatient(p.id)} className="flex-1 min-w-0 text-left"><p className="font-medium text-slate-900">{p.name}</p><p className="text-xs text-slate-500">Approved by {p.approvedBy} · {fmtDate(p.approvedOn)} {p.approvedOn < state.today && <span className="text-amber-700 font-medium">· waiting since yesterday</span>}</p></button>
                    <Button variant="violet" icon={LogOut} onClick={() => discharge(p)}>Complete discharge</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {stats.eligible.length > 0 && (
            <Card className="p-4 text-sm text-slate-600 flex items-start gap-3">
              <Lock size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div><b className="text-slate-800">{stats.eligible.length} more patient{stats.eligible.length > 1 ? 's' : ''}</b> meet the fever-free criterion but still need a doctor’s approval before admin can discharge them: {stats.eligible.map((x) => `${x.p.name} (${bedLabel(x.p.bed)})`).join(', ')}.</div>
            </Card>
          )}
          <Card className="overflow-hidden">
            <p className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">Recently discharged</p>
            {recent.length === 0 ? <p className="px-4 py-4 text-sm text-slate-500">None in the last 3 days.</p> : (
              <ul className="divide-y divide-slate-100 text-sm">{recent.slice(0, 12).map((p) => (
                <li key={p.id} className="px-4 py-2.5 flex justify-between gap-3"><span className="text-slate-800">{p.name} <span className="text-slate-400">· {p.id}</span></span><span className="text-slate-500">{fmtDate(p.closedOn)} · {diffDays(p.closedOn, p.admittedOn)} day stay</span></li>
              ))}</ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'admit' && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-semibold text-slate-800">Waiting list</p><p className="text-xs text-slate-500">Urgent first, then by arrival time</p></div>
            <div className="flex items-center gap-2">
              {stats.free === 0 && <Badge tone="amber" icon={Lock}>All {RULES.CAPACITY} beds occupied</Badge>}
              <Button variant="secondary" size="sm" icon={UserPlus} onClick={() => setAddOpen(true)}>Add arrival</Button>
            </div>
          </div>
          {waitlist.length === 0 ? <Empty icon={Users} title="Waiting list is empty" /> : (
            <ul className="divide-y divide-slate-100">
              {waitlist.map((w, i) => (
                <li key={w.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-slate-400">{i + 1}</span>
                  <div className="flex-1 min-w-0"><p className="font-medium text-slate-900 flex items-center gap-2">{w.name} {w.triage === 'urgent' && <Badge tone="red">Urgent</Badge>}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} /> Arrived {fmtDate(w.arrivedOn)} {w.arrivedAt} · {w.age}{w.sex}</p></div>
                  <Button size="sm" icon={BedDouble} disabled={stats.free === 0} title={stats.free === 0 ? 'No free beds. Complete a discharge first.' : ''} onClick={() => setAdmit({ wid: w.id })}>Admit</Button>
                </li>
              ))}
            </ul>
          )}
          {stats.free === 0 && stats.approved.length > 0 && (
            <div className="px-4 py-3 bg-violet-50 text-sm text-violet-900 border-t border-violet-100 flex items-center justify-between gap-3">
              <span>{stats.approved.length} approved discharge{stats.approved.length > 1 ? 's' : ''} would free a bed now.</span>
              <Button size="sm" variant="violet" onClick={() => setTab('discharge')}>Go to discharges</Button>
            </div>
          )}
        </Card>
      )}

      {admit && <AdmitModal init={admit} byBed={byBed} waitlist={waitlist} onClose={() => setAdmit(null)} />}
      {addOpen && <AddArrival onClose={() => setAddOpen(false)} />}
    </div>
  )
}

const Legend = ({ c, l }) => <span className="flex items-center gap-1.5"><span className={cx('h-3 w-4 rounded ring-1', c)} />{l}</span>

function AdmitModal({ init, byBed, waitlist, onClose }) {
  const { dispatch } = useStore()
  const free = Array.from({ length: RULES.CAPACITY }, (_, i) => i + 1).filter((b) => !byBed[b])
  const [wid, setWid] = useState(init.wid || waitlist[0]?.id || '')
  const [bed, setBed] = useState(init.bed || free[0] || '')
  const w = waitlist.find((x) => x.id === wid)
  return (
    <Modal open onClose={onClose} title="Admit patient" subtitle={free.length ? `${free.length} free bed${free.length > 1 ? 's' : ''}` : 'No beds available'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={BedDouble} disabled={!w || !bed} onClick={() => { dispatch({ type: 'ADMIT', wid, bed: Number(bed) }); toast(`${w.name} admitted to bed ${bedLabel(Number(bed))}. Added to today’s temperature round.`); onClose() }}>Admit</Button></>}>
      {free.length === 0 ? <p className="text-sm text-slate-600">All beds are occupied. Complete a pending discharge first.</p> : waitlist.length === 0 ? <p className="text-sm text-slate-600">The waiting list is empty. Add the arrival first.</p> : (
        <div className="space-y-4">
          <Field label="Patient from waiting list">
            <select className={inputCls} value={wid} onChange={(e) => setWid(e.target.value)}>
              {waitlist.map((x) => <option key={x.id} value={x.id}>{x.triage === 'urgent' ? '⚠ ' : ''}{x.name} · {x.age}{x.sex} · arrived {x.arrivedAt}</option>)}
            </select>
          </Field>
          <Field label="Bed" hint="Only free beds are listed, so a bed can never be double-booked.">
            <select className={inputCls} value={bed} onChange={(e) => setBed(e.target.value)}>
              {free.map((b) => <option key={b} value={b}>{bedLabel(b)}</option>)}
            </select>
          </Field>
        </div>
      )}
    </Modal>
  )
}

function AddArrival({ onClose }) {
  const { dispatch } = useStore()
  const [f, setF] = useState({ name: '', age: '', sex: 'F', triage: 'standard' })
  const ageN = Number(f.age)
  const errs = { name: f.name.trim().length < 3 ? 'Enter the full name' : '', age: !f.age || ageN < 0 || ageN > 120 || !Number.isInteger(ageN) ? 'Age 0 to 120' : '' }
  const [touched, setTouched] = useState(false)
  const ok = !errs.name && !errs.age
  return (
    <Modal open onClose={onClose} title="Add new arrival" subtitle="Adds the patient to the waiting list"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={UserPlus} onClick={() => { setTouched(true); if (ok) { dispatch({ type: 'ADD_WAITLIST', person: { name: f.name.trim(), age: ageN, sex: f.sex, triage: f.triage } }); toast(`${f.name} added to the waiting list`); onClose() } }}>Add</Button></>}>
      <div className="space-y-4">
        <Field label="Full name" error={touched && errs.name}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age" error={touched && errs.age}><input className={inputCls} inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></Field>
          <Field label="Sex"><select className={inputCls} value={f.sex} onChange={(e) => setF({ ...f, sex: e.target.value })}><option value="F">Female</option><option value="M">Male</option><option value="O">Other</option></select></Field>
          <Field label="Triage"><select className={inputCls} value={f.triage} onChange={(e) => setF({ ...f, triage: e.target.value })}><option value="standard">Standard</option><option value="urgent">Urgent</option></select></Field>
        </div>
      </div>
    </Modal>
  )
}
