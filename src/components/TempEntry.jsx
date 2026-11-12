import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, AlertTriangle, Thermometer, XCircle } from 'lucide-react'
import { Modal, Button, cx, inputCls, toast } from './ui'
import { useStore } from '../lib/store'
import { RULES, bedLabel, validateTemp } from '../lib/logic'

/** Record (or correct) today's temperature for one patient. */
export default function TempEntry({ patient, reading, onClose }) {
  const { dispatch } = useStore()
  const correcting = !!reading
  const [val, setVal] = useState(reading ? reading.temp.toFixed(1) : '37.0')
  const [reason, setReason] = useState('')
  const [confirmWarn, setConfirmWarn] = useState(false)
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.select(), 50) }, [])

  const v = validateTemp(val)
  const step = (d) => { const n = Number(val) || 37; setVal((Math.round((n + d) * 10) / 10).toFixed(1)); setConfirmWarn(false) }
  const canSave = !v.error && (!correcting || reason.trim().length >= 3) && (!v.warning || confirmWarn)

  const save = () => {
    if (!canSave) return
    if (correcting) {
      dispatch({ type: 'CORRECT_TEMP', id: reading.id, temp: v.value, reason: reason.trim() })
      toast(`Reading corrected for ${patient.name}`)
    } else {
      dispatch({ type: 'RECORD_TEMP', pid: patient.id, temp: v.value })
      toast(v.value >= RULES.HIGH_FEVER_C ? `High fever recorded for ${patient.name}. Doctors alerted.` : `${v.value.toFixed(1)} °C recorded for ${patient.name}`, v.value >= RULES.HIGH_FEVER_C ? 'warning' : 'success')
    }
    onClose()
  }
  const tone = v.error ? 'text-slate-300' : v.value >= RULES.HIGH_FEVER_C ? 'text-rose-600' : v.value >= RULES.FEVER_C ? 'text-orange-600' : 'text-emerald-600'

  return (
    <Modal open onClose={onClose} width="max-w-md"
      title={correcting ? 'Correct today’s reading' : 'Record temperature'}
      subtitle={`${patient.name} · Bed ${bedLabel(patient.bed)} · ${patient.age}${patient.sex}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave} icon={Thermometer}>{correcting ? 'Save correction' : 'Save reading'}</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="flex items-center justify-center gap-3 py-3">
          <button type="button" onClick={() => step(-0.1)} className="h-14 w-14 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 grid place-items-center text-slate-700" aria-label="Decrease"><Minus /></button>
          <div className="text-center">
            <div className="flex items-baseline justify-center">
              <input ref={ref} value={val} inputMode="decimal" aria-label="Temperature in Celsius"
                onChange={(e) => { setVal(e.target.value); setConfirmWarn(false) }}
                className={cx('w-36 text-center text-6xl font-bold tracking-tight tabular-nums outline-none bg-transparent', tone)} />
              <span className="text-2xl font-semibold text-slate-400">°C</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Fever threshold {RULES.FEVER_C.toFixed(1)} °C</p>
          </div>
          <button type="button" onClick={() => step(0.1)} className="h-14 w-14 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 grid place-items-center text-slate-700" aria-label="Increase"><Plus /></button>
        </div>
        <div className="flex justify-center gap-2 mb-3">
          {['36.8', '37.4', '38.2', '39.0'].map((q) => (
            <button type="button" key={q} onClick={() => { setVal(q); setConfirmWarn(false) }} className="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50">{q}</button>
          ))}
        </div>

        {v.error && <div className="flex gap-2 rounded-lg bg-rose-50 text-rose-700 p-3 text-sm"><XCircle size={18} className="shrink-0" />{v.error}</div>}
        {v.warning && (
          <label className="flex gap-2.5 rounded-lg bg-amber-50 text-amber-900 p-3 text-sm ring-1 ring-amber-200 cursor-pointer">
            <AlertTriangle size={18} className="shrink-0 text-amber-600" />
            <span className="flex-1">{v.warning}<span className="flex items-center gap-2 mt-2 font-medium"><input type="checkbox" checked={confirmWarn} onChange={(e) => setConfirmWarn(e.target.checked)} className="accent-amber-600 h-4 w-4" /> I have re-checked this reading</span></span>
          </label>
        )}
        {correcting && (
          <div className="mt-3">
            <label className="text-sm font-medium text-slate-700">Reason for correction <span className="text-rose-500">*</span></label>
            <input className={cx(inputCls, 'mt-1.5')} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. typo, thermometer re-calibrated" />
            <p className="text-xs text-slate-500 mt-1">Original value {reading.temp.toFixed(1)} °C is kept in the audit log.</p>
          </div>
        )}
      </form>
    </Modal>
  )
}
