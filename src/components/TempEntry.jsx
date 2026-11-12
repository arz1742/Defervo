import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, AlertTriangle, Thermometer, XCircle, ArrowRightLeft } from 'lucide-react'
import { Modal, Button, cx, inputCls, toast } from './ui'
import { useStore } from '../lib/store'
import { RULES, bedLabel, validateTemp, conv, round1, fmtT, isFever, isHigh, toC } from '../lib/logic'

const PRESETS = { C: ['36.8', '37.4', '38.2', '39.0'], F: ['98.2', '99.3', '100.8', '102.2'] }

/** Record (or correct) today's temperature for one patient, in °C or °F. */
export default function TempEntry({ patient, reading, onClose }) {
  const { state, dispatch } = useStore()
  const correcting = !!reading
  // Default: same unit as this patient's last reading (same ward thermometer), else the centre default.
  const last = !reading && [...state.readings].reverse().find((r) => r.pid === patient.id)
  const [unit, setUnit] = useState(reading?.unit || last?.unit || state.prefs?.entryUnit || 'C')
  const [val, setVal] = useState(reading ? (reading.raw ?? round1(conv(reading.temp, reading.unit || 'C'))).toFixed(1) : unit === 'F' ? '98.6' : '37.0')
  const [reason, setReason] = useState('')
  const [confirmWarn, setConfirmWarn] = useState(false)
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.select(), 50) }, [])

  const v = validateTemp(val, unit)
  const step = (d) => { const n = Number(val) || (unit === 'F' ? 98.6 : 37); setVal((Math.round((n + d) * 10) / 10).toFixed(1)); setConfirmWarn(false) }
  const canSave = !v.error && (!correcting || reason.trim().length >= 3) && (!v.warning || confirmWarn)

  // Switching unit converts the number already typed, so nothing is lost.
  const switchUnit = (u) => {
    if (u === unit) return
    const n = Number(val)
    if (!Number.isNaN(n) && val !== '') setVal(round1(u === 'F' ? (n * 9) / 5 + 32 : toC(n)).toFixed(1))
    setUnit(u); setConfirmWarn(false)
  }

  const save = () => {
    if (!canSave) return
    const payload = { temp: v.value, unit, raw: v.raw }
    if (correcting) {
      dispatch({ type: 'CORRECT_TEMP', id: reading.id, reason: reason.trim(), ...payload })
      toast(`Reading corrected for ${patient.name}`)
    } else {
      dispatch({ type: 'RECORD_TEMP', pid: patient.id, ...payload })
      toast(isHigh(v.value) ? `High fever recorded for ${patient.name}. Doctors alerted.` : `${v.raw.toFixed(1)} °${unit} recorded for ${patient.name}`, isHigh(v.value) ? 'warning' : 'success')
    }
    onClose()
  }
  const tone = v.error ? 'text-slate-300' : isHigh(v.value) ? 'text-rose-600' : isFever(v.value) ? 'text-orange-600' : 'text-emerald-600'
  const other = unit === 'C' ? 'F' : 'C'

  return (
    <Modal open onClose={onClose} width="max-w-md"
      title={correcting ? 'Correct today’s reading' : 'Record temperature'}
      subtitle={`${patient.name} · Bed ${bedLabel(patient.bed)} · ${patient.age}${patient.sex}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave} icon={Thermometer}>{correcting ? 'Save correction' : 'Save reading'}</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200" role="group" aria-label="Thermometer unit">
            {['C', 'F'].map((u) => (
              <button type="button" key={u} onClick={() => switchUnit(u)}
                className={cx('rounded-md px-4 py-1.5 text-sm font-semibold transition', unit === u ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                {u === 'C' ? 'Celsius °C' : 'Fahrenheit °F'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pt-4 pb-2">
          <button type="button" onClick={() => step(-0.1)} className="h-14 w-14 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 grid place-items-center text-slate-700" aria-label="Decrease"><Minus /></button>
          <div className="text-center">
            <div className="flex items-baseline justify-center">
              <input ref={ref} value={val} inputMode="decimal" aria-label={`Temperature in ${unit === 'C' ? 'Celsius' : 'Fahrenheit'}`}
                onChange={(e) => { setVal(e.target.value); setConfirmWarn(false) }}
                className={cx('w-40 text-center text-6xl font-bold tracking-tight tabular-nums outline-none bg-transparent', tone)} />
              <span className="text-2xl font-semibold text-slate-400">°{unit}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 h-4">
              {!v.error && <span className="inline-flex items-center gap-1"><ArrowRightLeft size={11} /> {fmtT(v.value, other)}</span>}
              <span className="mx-1.5 text-slate-300">|</span>Fever ≥ {fmtT(RULES.FEVER_C, unit)}
            </p>
          </div>
          <button type="button" onClick={() => step(0.1)} className="h-14 w-14 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 grid place-items-center text-slate-700" aria-label="Increase"><Plus /></button>
        </div>
        <div className="flex justify-center gap-2 mb-3">
          {PRESETS[unit].map((q) => (
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
            <input className={cx(inputCls, 'mt-1.5')} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. typo, wrong unit selected" />
            <p className="text-xs text-slate-500 mt-1">Original value {fmtT(reading.temp, reading.unit || 'C')} is kept in the audit log.</p>
          </div>
        )}
      </form>
    </Modal>
  )
}
