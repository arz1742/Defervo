import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Eye, Thermometer, ShieldCheck, Wand2, Info } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Button, Card, Modal, UnitSwitch, cx, toast } from '../components/ui'
import { RULES, WARDS, bedLabel, conv, fmtDate, fmtT, round1, wardOf } from '../lib/logic'

export default function UnitsView() {
  const { state, dispatch } = useStore()
  const [target, setTarget] = useState(null)
  const byId = useMemo(() => Object.fromEntries(state.patients.map((p) => [p.id, p])), [state.patients])

  const counts = useMemo(() => {
    const c = { C: 0, F: 0 }, ward = {}
    for (const r of state.readings) {
      const u = r.unit || 'C'; c[u]++
      const p = byId[r.pid]; const bed = p?.bed ?? p?.lastBed
      if (bed) { const w = wardOf(bed); (ward[w] ||= { C: 0, F: 0 })[u]++ }
    }
    return { ...c, total: state.readings.length, ward }
  }, [state.readings, byId])

  const mixed = counts.C > 0 && counts.F > 0
  const pctF = counts.total ? (counts.F / counts.total) * 100 : 0
  const entry = state.prefs.entryUnit
  const toConvert = target ? state.readings.filter((r) => (r.unit || 'C') !== target) : []
  const sample = toConvert.slice(-5).reverse()

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card className={cx('p-5', mixed ? 'ring-indigo-200 bg-indigo-50/40' : 'ring-emerald-200 bg-emerald-50/40')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {mixed ? <Badge tone="violet">Mixed units</Badge> : <Badge tone="green" icon={CheckCircle2}>Standardised</Badge>}
              <span className="text-sm text-slate-500">{counts.total} temperature readings on record</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {mixed ? `${counts.C} readings recorded in °C and ${counts.F} in °F` : `All readings are recorded in °${counts.F ? 'F' : 'C'}`}
            </p>
            <p className="text-sm text-slate-600 mt-0.5">{mixed ? 'Different thermometers in different wards. Clinical rules already handle this correctly, but records are inconsistent for reporting.' : 'Records are uniform. New readings default to the centre’s unit.'}</p>
          </div>
          <div className="w-full sm:w-72">
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1"><span>°C {(100 - pctF).toFixed(0)}%</span><span>°F {pctF.toFixed(0)}%</span></div>
            <div className="h-3 rounded-full bg-indigo-400 overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${100 - pctF}%` }} /></div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WARDS.map((w) => { const x = counts.ward[w.id] || { C: 0, F: 0 }; return (
            <div key={w.id} className="rounded-lg bg-white ring-1 ring-slate-200 px-3 py-2 text-sm">
              <p className="font-semibold text-slate-800">Ward {w.id}</p>
              <p className="text-xs text-slate-500">{x.C} °C · {x.F} °F</p>
            </div>) })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 1. view */}
        <Card className="p-5">
          <p className="flex items-center gap-2 font-semibold text-slate-800"><Eye size={17} className="text-brand-600" /> 1 · How you view temperatures</p>
          <p className="text-sm text-slate-500 mt-1">Display only. Converts on screen without changing any record. Every role has this switch in the top bar.</p>
          <div className="mt-4"><UnitSwitch /></div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
            <li><b className="text-slate-800">As recorded</b>: each reading in the unit it was entered in</li>
            <li><b className="text-slate-800">°C / °F</b>: every reading, chart and threshold converted to one unit</li>
          </ul>
        </Card>

        {/* 2. default */}
        <Card className="p-5">
          <p className="flex items-center gap-2 font-semibold text-slate-800"><Thermometer size={17} className="text-brand-600" /> 2 · Default unit for new readings</p>
          <p className="text-sm text-slate-500 mt-1">Nurses start in this unit. They can still switch for a single reading if a ward’s thermometer differs, and it’s stored with the right unit.</p>
          <div className="mt-4 inline-flex rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200">
            {['C', 'F'].map((u) => (
              <button key={u} onClick={() => { dispatch({ type: 'SET_ENTRY_UNIT', unit: u }); toast(`New readings now default to °${u}`) }}
                className={cx('rounded-md px-4 py-1.5 text-sm font-semibold', entry === u ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>°{u}</button>
            ))}
          </div>
        </Card>

        {/* 3. standardise */}
        <Card className="p-5 ring-brand-200">
          <p className="flex items-center gap-2 font-semibold text-slate-800"><Wand2 size={17} className="text-brand-600" /> 3 · Standardise all records</p>
          <p className="text-sm text-slate-500 mt-1">Permanently converts every stored reading to one unit for uniform records and exports. It also sets that unit as the default for new readings.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={ArrowRight} disabled={!counts.F} onClick={() => setTarget('C')}>Convert all to °C</Button>
            <Button variant="secondary" icon={ArrowRight} disabled={!counts.C} onClick={() => setTarget('F')}>Convert all to °F</Button>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex gap-1.5"><ShieldCheck size={14} className="shrink-0 text-emerald-600" /> Safe: fever status, streaks and discharge eligibility can’t change. They are calculated from a precise internal value.</p>
        </Card>
      </div>

      {/* Reference */}
      <Card className="p-5">
        <p className="font-semibold text-slate-800 flex items-center gap-2"><Info size={16} className="text-slate-400" /> Conversion reference</p>
        <p className="text-sm text-slate-600 mt-1">°F = °C × <sup>9</sup>⁄<sub>5</sub> + 32 &nbsp;·&nbsp; °C = (°F − 32) × <sup>5</sup>⁄<sub>9</sub> &nbsp;·&nbsp; values shown to 1 decimal place</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2 pr-4">Threshold</th><th className="py-2 pr-4">°C</th><th className="py-2">°F</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {[['Accepted range (min)', RULES.TEMP_MIN_C], ['Re-check (low)', RULES.LOW_TEMP_C], ['Fever', RULES.FEVER_C], ['High fever: alert doctors', RULES.HIGH_FEVER_C], ['Accepted range (max)', RULES.TEMP_MAX_C]].map(([l, c]) => (
                <tr key={l}><td className="py-2 pr-4 text-slate-700">{l}</td><td className="py-2 pr-4 font-semibold tabular-nums">{fmtT(c, 'C')}</td><td className="py-2 font-semibold tabular-nums">{fmtT(c, 'F')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!target} onClose={() => setTarget(null)} width="max-w-xl"
        title={`Convert all records to °${target}?`} subtitle={`${toConvert.length} of ${counts.total} readings will be rewritten in °${target}`}
        footer={<><Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button><Button icon={CheckCircle2} onClick={() => { dispatch({ type: 'STANDARDISE_UNITS', unit: target }); toast(`${toConvert.length} readings converted. All records are now in °${target}.`); setTarget(null) }}>Convert {toConvert.length} readings</Button></>}>
        <p className="text-sm text-slate-600">Preview of the most recent changes:</p>
        <table className="w-full text-sm mt-2">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1.5">Patient</th><th>Date</th><th>Recorded</th><th /><th>After</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {sample.map((r) => { const p = byId[r.pid]; return (
              <tr key={r.id}><td className="py-1.5">{p?.name}{p?.bed && <span className="text-slate-400"> · {bedLabel(p.bed)}</span>}</td><td className="text-slate-500">{fmtDate(r.date)}</td>
                <td className="tabular-nums">{(r.raw ?? round1(conv(r.temp, r.unit || 'C'))).toFixed(1)} °{r.unit || 'C'}</td><td className="text-slate-300"><ArrowRight size={14} /></td>
                <td className="font-semibold tabular-nums">{fmtT(r.temp, target)}</td></tr>) })}
          </tbody>
        </table>
        <ul className="mt-3 text-xs text-slate-500 space-y-1">
          <li>• The original unit is kept on each reading (“converted from °F”) and the change is written to the activity log.</li>
          <li>• New readings will default to °{target}. Your view switches to °{target} too.</li>
        </ul>
      </Modal>
    </div>
  )
}
