import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { createSeed, arrivalsFor } from './seed'
import {
  RULES, addDays, nowHM, indexReadings, indexVisits, computeStats, computeAlerts, bedLabel, feverFreeStreak, fmtT, isFever, isHigh, round1, conv,
} from './logic'

const KEY = 'carecycle-v2'
const Ctx = createContext(null)

function load() {
  try {
    const s = localStorage.getItem(KEY)
    if (s) { const p = JSON.parse(s); if (p?.version === 2) return p }
  } catch { /* storage unavailable */ }
  return createSeed()
}

function log(s, action, detail, pid) {
  const u = s.user || { name: 'System', role: 'system' }
  const entry = { id: s.nextIds.audit, ts: new Date().toISOString(), date: s.today, user: u.name, role: u.role, action, detail, pid }
  return { ...s, audit: [entry, ...s.audit].slice(0, 600), nextIds: { ...s.nextIds, audit: s.nextIds.audit + 1 } }
}
const patch = (s, pid, f) => ({ ...s, patients: s.patients.map((p) => (p.id === pid ? { ...p, ...f } : p)) })
const P = (s, pid) => s.patients.find((p) => p.id === pid)

// Every guard here mirrors a rule the UI also enforces, so a bad action can never corrupt data.
function reducer(s, a) {
  switch (a.type) {
    case 'LOGIN': return log({ ...s, user: a.user }, 'Signed in', `as ${a.user.title}`)
    case 'LOGOUT': return { ...log(s, 'Signed out', ''), user: null }

    case 'RECORD_TEMP': {
      const p = P(s, a.pid)
      if (!p || p.status !== 'admitted' || !['nurse', 'head', 'doctor'].includes(s.user?.role)) return s
      if (s.readings.some((r) => r.pid === a.pid && r.date === s.today)) return s // one reading per day
      const unit = a.unit === 'F' ? 'F' : 'C'
      const r = { id: s.nextIds.reading, pid: a.pid, date: s.today, temp: a.temp, unit, raw: a.raw, at: nowHM(), by: s.user.name }
      const ns = { ...s, readings: [...s.readings, r], nextIds: { ...s.nextIds, reading: r.id + 1 } }
      const flag = isHigh(a.temp) ? ' · HIGH FEVER' : isFever(a.temp) ? ' · fever' : ''
      const both = unit === 'F' ? `${a.raw.toFixed(1)} °F (${fmtT(a.temp, 'C')})` : `${a.raw.toFixed(1)} °C`
      return log(ns, 'Temperature recorded', `${p.name} (${bedLabel(p.bed)}): ${both}${flag}`, p.id)
    }
    case 'CORRECT_TEMP': {
      const r = s.readings.find((x) => x.id === a.id)
      if (!r || r.date !== s.today || !a.reason?.trim()) return s // only same-day corrections, with a reason
      if (s.visits.some((v) => v.pid === r.pid && v.date === s.today)) return s // locked once the doctor has used it
      const p = P(s, r.pid)
      if (p.status !== 'admitted') return s
      const unit = a.unit === 'F' ? 'F' : 'C'
      const ns = { ...s, readings: s.readings.map((x) => (x.id === a.id ? { ...x, temp: a.temp, unit, raw: a.raw, corrected: { from: x.temp, fromUnit: x.unit || 'C', reason: a.reason, by: s.user.name, at: nowHM() } } : x)) }
      return log(ns, 'Temperature corrected', `${p.name}: ${fmtT(r.temp, r.unit || 'C')} → ${a.raw.toFixed(1)} °${unit} (“${a.reason}”)`, p.id)
    }
    case 'RECORD_VISIT': {
      const p = P(s, a.pid)
      if (!p || p.status !== 'admitted' || !['doctor', 'head'].includes(s.user?.role)) return s
      if (!s.readings.some((r) => r.pid === a.pid && r.date === s.today)) return s // temp must come first
      if (s.visits.some((v) => v.pid === a.pid && v.date === s.today)) return s
      const v = { id: s.nextIds.visit, pid: a.pid, date: s.today, at: nowHM(), by: s.user.name, note: a.note, treatment: a.treatment }
      return log({ ...s, visits: [...s.visits, v], nextIds: { ...s.nextIds, visit: v.id + 1 } }, 'Doctor visit', `${p.name} (${bedLabel(p.bed)}): ${a.treatment || 'notes added'}`, p.id)
    }
    case 'APPROVE_DISCHARGE': {
      const p = P(s, a.pid)
      if (!p || p.status !== 'admitted' || !['doctor', 'head'].includes(s.user?.role)) return s
      if (feverFreeStreak(indexReadings(s.readings), p.id, s.today) < RULES.CURE_DAYS) return s
      return log(patch(s, a.pid, { status: 'discharge_approved', approvedOn: s.today, approvedBy: s.user.name }), 'Discharge approved', `${p.name} (${bedLabel(p.bed)}): ${RULES.CURE_DAYS} fever-free days confirmed`, p.id)
    }
    case 'REVOKE_DISCHARGE': {
      const p = P(s, a.pid)
      if (!p || p.status !== 'discharge_approved' || !['doctor', 'head'].includes(s.user?.role)) return s
      return log(patch(s, a.pid, { status: 'admitted', approvedOn: null, approvedBy: null }), 'Discharge approval revoked', `${p.name}: ${a.reason}`, p.id)
    }
    case 'COMPLETE_DISCHARGE': {
      const p = P(s, a.pid)
      if (!p || p.status !== 'discharge_approved' || !['admin', 'head'].includes(s.user?.role)) return s
      return log(patch(s, a.pid, { status: 'discharged', closedOn: s.today, closedBy: s.user.name, lastBed: p.bed, bed: null }), 'Patient discharged', `${p.name} · bed ${bedLabel(p.bed)} is now free`, p.id)
    }
    case 'RECORD_DEATH': {
      const p = P(s, a.pid)
      if (!p || !['admitted', 'discharge_approved'].includes(p.status) || !['doctor', 'head'].includes(s.user?.role)) return s
      return log(patch(s, a.pid, { status: 'deceased', closedOn: s.today, closedBy: s.user.name, deathNote: a.note, lastBed: p.bed, bed: null }), 'Death recorded', `${p.name} (${bedLabel(p.bed)})`, p.id)
    }
    case 'ADD_WAITLIST': {
      if (!['admin', 'head'].includes(s.user?.role)) return s
      const w = { id: 'W-' + s.nextIds.wait, ...a.person, arrivedOn: s.today, arrivedAt: nowHM() }
      return log({ ...s, waitlist: [...s.waitlist, w], nextIds: { ...s.nextIds, wait: s.nextIds.wait + 1 } }, 'Added to waiting list', `${w.name}, ${w.age}${w.sex} · ${w.triage}`)
    }
    case 'ADMIT': {
      if (!['admin', 'head'].includes(s.user?.role)) return s
      const w = s.waitlist.find((x) => x.id === a.wid)
      const taken = s.patients.some((p) => p.bed === a.bed)
      if (!w || taken || a.bed < 1 || a.bed > RULES.CAPACITY) return s
      const p = { id: 'P-' + s.nextIds.patient, name: w.name, age: w.age, sex: w.sex, bed: a.bed, admittedOn: s.today, status: 'admitted', triage: w.triage }
      const ns = { ...s, patients: [...s.patients, p], waitlist: s.waitlist.filter((x) => x.id !== a.wid), nextIds: { ...s.nextIds, patient: s.nextIds.patient + 1 } }
      return log(ns, 'Patient admitted', `${p.name} → bed ${bedLabel(a.bed)}`, p.id)
    }

    // ── Units ──
    case 'SET_DISPLAY_UNIT': return { ...s, prefs: { ...s.prefs, displayUnit: a.unit } }
    case 'SET_ENTRY_UNIT': {
      if (s.user?.role !== 'head') return s
      return log({ ...s, prefs: { ...s.prefs, entryUnit: a.unit } }, 'Default entry unit changed', `New readings default to °${a.unit}`)
    }
    case 'STANDARDISE_UNITS': {
      if (s.user?.role !== 'head' || !['C', 'F'].includes(a.unit)) return s
      const n = s.readings.filter((r) => (r.unit || 'C') !== a.unit).length
      if (!n) return s
      // Canonical °C value is untouched, so no clinical decision can change; only the recorded unit/raw value is rewritten.
      const readings = s.readings.map((r) => ((r.unit || 'C') === a.unit ? r : { ...r, unit: a.unit, raw: round1(conv(r.temp, a.unit)), convertedFrom: r.unit || 'C' }))
      return log({ ...s, readings, prefs: { ...s.prefs, entryUnit: a.unit, displayUnit: a.unit } }, 'Records standardised', `${n} readings converted to °${a.unit}. All ${s.readings.length} readings are now in °${a.unit}, and it is the default entry unit`)
    }

    // ── Demo controls ──
    case 'AUTOFILL': {
      let ns = s
      const idx = indexReadings(s.readings)
      const vis = indexVisits(s.visits)
      const by = s.user.name + ' (demo)'
      const readings = [], visits = []
      let rid = s.nextIds.reading, vid = s.nextIds.visit
      for (const p of s.patients.filter((x) => x.status === 'admitted')) {
        let r = idx[p.id]?.[s.today]
        if (!r) {
          const last = idx[p.id]?.[addDays(s.today, -1)]
          const fever = last ? (isFever(last.temp) ? Math.random() < 0.55 : Math.random() < 0.06) : true
          const temp = +(fever ? 38.1 + Math.random() * 1.6 : 36.4 + Math.random() * 1.2).toFixed(1)
          const unit = s.prefs.entryUnit
          r = { id: rid++, pid: p.id, date: s.today, temp: unit === 'F' ? ((round1(temp * 9 / 5 + 32) - 32) * 5) / 9 : temp, unit, raw: unit === 'F' ? round1(temp * 9 / 5 + 32) : temp, at: nowHM(), by }
          readings.push(r)
        }
        if (a.visits && !vis[p.id]?.[s.today]) visits.push({ id: vid++, pid: p.id, date: s.today, at: nowHM(), by, note: isFever(r.temp) ? 'Fever persisting. Continue treatment.' : 'Afebrile, stable.', treatment: isFever(r.temp) ? 'Antipyretics, IV fluids' : 'Observation' })
      }
      ns = { ...s, readings: [...s.readings, ...readings], visits: [...s.visits, ...visits], nextIds: { ...s.nextIds, reading: rid, visit: vid } }
      return log(ns, 'Demo: rounds auto-completed', `${readings.length} temperatures${a.visits ? `, ${visits.length} visits` : ''}`)
    }
    case 'NEXT_DAY': {
      const active = s.patients.filter((p) => p.status === 'admitted')
      const temps = s.readings.filter((r) => r.date === s.today).length
      const visits = s.visits.filter((v) => v.date === s.today).length
      const snap = { date: s.today, patients: active.length, temps, visits }
      const today = addDays(s.today, 1)
      const arrivals = arrivalsFor({ ...s, today }, 2)
      const ns = { ...s, today, snapshots: [...s.snapshots, snap].slice(-14), waitlist: [...s.waitlist, ...arrivals], nextIds: { ...s.nextIds, wait: s.nextIds.wait + arrivals.length } }
      return log(ns, 'Demo: advanced to next day', `Closed ${s.today}: ${temps}/${active.length} temps, ${visits}/${active.length} visits · 2 new arrivals`)
    }
    case 'RESET': { const fresh = createSeed(); return { ...fresh, user: s.user } }
    default: return s
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ } }, [state])
  const derived = useMemo(() => {
    const rIdx = indexReadings(state.readings)
    const vIdx = indexVisits(state.visits)
    const stats = computeStats(state, rIdx, vIdx)
    const alerts = computeAlerts(state, stats)
    return { rIdx, vIdx, stats, alerts }
  }, [state])
  return <Ctx.Provider value={{ state, dispatch, ...derived }}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)
