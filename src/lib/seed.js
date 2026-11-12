import { RULES, USERS, addDays } from './logic'

const FIRST = ['Aarav','Vivaan','Aditya','Arjun','Sai','Reyansh','Krishna','Ishaan','Rohan','Kabir','Ananya','Diya','Aadhya','Saanvi','Myra','Kiara','Ira','Meera','Pooja','Sneha','Rahul','Amit','Sunil','Ravi','Manoj','Farhan','Imran','Zoya','Sana','Ayesha','Neel','Dev','Harsh','Yash','Om','Tara','Nisha','Kavya','Riya','Lakshmi','Gopal','Suresh','Vikas','Deepak','Anil','Fatima','Mehul','Pranav','Tanvi','Rekha','Joseph','Maria','Gurpreet','Harpreet','Simran','Arnav','Varun','Nikhil','Shreya','Aditi']
const LAST = ['Shah','Patel','Mehta','Iyer','Nair','Reddy','Rao','Gupta','Sharma','Verma','Khan','Shaikh','Joshi','Kulkarni','Desai','Pillai','Menon','Das','Bose','Banerjee','Singh','Gill','Fernandes','D’Souza','Chopra','Malhotra','Kapoor','Jain','Agarwal','Pawar']

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function todayISO() {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10)
}

export function createSeed() {
  const r = rng(20261112)
  const pick = (a) => a[Math.floor(r() * a.length)]
  const between = (a, b) => a + r() * (b - a)
  const int = (a, b) => Math.floor(between(a, b + 1))
  const today = todayISO()
  const nurse = USERS[0].name, doctor = USERS[1].name
  const usedNames = new Set()
  const name = () => { let n; do { n = `${pick(FIRST)} ${pick(LAST)}` } while (usedNames.has(n)); usedNames.add(n); return n }
  const hm = (h1, h2) => `${String(int(h1, h2)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`
  const feverT = () => +between(38.2, 39.8).toFixed(1)
  const normalT = () => +between(36.4, 37.6).toFixed(1)

  let pidN = 1001
  const patients = [], readings = [], visits = [], audit = []
  let rid = 1, vid = 1
  const TREAT = ['Paracetamol 650mg TDS, oral fluids', 'IV fluids, antipyretics, monitor SpO₂', 'Continue current regimen', 'Antiviral course day {d}, hydration', 'Tepid sponging, paracetamol PRN', 'Observation only, vitals stable']
  const NOTES = ['Patient comfortable, appetite improving.', 'Mild headache, no breathlessness.', 'Fever persisting, fatigued. Watch closely.', 'Responding well to treatment.', 'Chills overnight per patient. Reviewed fluids.', 'Afebrile, mobilising independently.']

  // ── Closed cases: 60 days of history (≈13% mortality overall, recent week a bit higher) ──
  for (let i = 0; i < 156; i++) {
    const closedAgo = int(1, 60)
    const stay = int(4, 12)
    const recent = closedAgo <= 7
    const died = r() < (recent ? 0.19 : 0.12)
    patients.push({
      id: 'P-' + pidN++, name: name(), age: int(18, 82), sex: r() < 0.5 ? 'M' : 'F', bed: null,
      admittedOn: addDays(today, -(closedAgo + stay)), closedOn: addDays(today, -closedAgo),
      status: died ? 'deceased' : 'discharged', closedBy: died ? doctor : USERS[2].name,
    })
  }

  // ── 74 current patients ──
  const beds = Array.from({ length: RULES.CAPACITY }, (_, i) => i + 1)
  const plan = []
  for (let i = 0; i < 3; i++) plan.push('approved')
  for (let i = 0; i < 5; i++) plan.push('eligible')
  for (let i = 0; i < 8; i++) plan.push('nearly')
  while (plan.length < RULES.CAPACITY) plan.push(r() < 0.55 ? 'febrile' : 'recovering')
  plan.sort(() => r() - 0.5)

  const recordedToday = new Set()
  plan.forEach((kind, i) => {
    const bed = beds[i]
    let A, F
    if (kind === 'approved') { A = int(7, 11); F = A - 4 }
    else if (kind === 'eligible') { A = int(5, 10); F = A - 2 }
    else if (kind === 'nearly') { A = int(4, 9); F = A - 2 }
    else if (kind === 'febrile') { A = int(0, 9); F = A + int(1, 4) }
    else { A = int(2, 9); F = A - int(0, 1) }
    const p = { id: 'P-' + pidN++, name: name(), age: int(18, 80), sex: r() < 0.5 ? 'M' : 'F', bed, admittedOn: addDays(today, -A), status: kind === 'approved' ? 'discharge_approved' : 'admitted' }
    if (kind === 'approved') { p.approvedOn = r() < 0.5 ? today : addDays(today, -1); p.approvedBy = doctor }
    patients.push(p)
    const takeToday = kind === 'eligible' || (kind !== 'nearly' && kind !== 'approved' && r() < 0.36)
    for (let d = 0; d <= A; d++) {
      const date = addDays(p.admittedOn, d)
      const isToday = d === A
      if (isToday && !takeToday) continue
      if (kind === 'approved' && isToday) continue
      if (!isToday && A - d > 4 && r() < 0.04) continue // occasional historic miss (pre-app)
      let temp = d < F ? feverT() : normalT()
      if (isToday && kind === 'febrile' && r() < 0.18) temp = +between(39.6, 40.3).toFixed(1)
      readings.push({ id: rid++, pid: p.id, date, temp, at: isToday ? hm(7, 10) : hm(7, 11), by: nurse })
      const visitToday = isToday && kind !== 'eligible' && r() < 0.45
      if (!isToday || visitToday) {
        visits.push({ id: vid++, pid: p.id, date, at: isToday ? hm(10, 12) : hm(11, 16), by: doctor, note: d < F ? pick(NOTES.slice(0, 5)) : pick(NOTES.slice(3)), treatment: pick(TREAT).replace('{d}', d + 1) })
      }
      if (isToday) recordedToday.add(p.id)
    }
  })

  // ── Waiting list ──
  const waitlist = Array.from({ length: 6 }, (_, i) => ({
    id: 'W-' + (301 + i), name: name(), age: int(19, 75), sex: r() < 0.5 ? 'M' : 'F',
    arrivedOn: i < 3 ? addDays(today, -1) : today, arrivedAt: hm(6, 11), triage: i % 3 === 0 ? 'urgent' : 'standard',
  }))

  // ── Daily snapshots (for the rounds-compliance chart) ──
  const snapshots = []
  for (let d = 7; d >= 1; d--) {
    const t = int(66, 74)
    snapshots.push({ date: addDays(today, -d), patients: 74, temps: Math.min(74, t + (d <= 3 ? 2 : 0)), visits: Math.min(74, t - int(0, 4)) })
  }

  const ts = new Date()
  const stamp = (mins) => new Date(ts.getTime() - mins * 60000).toISOString()
  audit.push(
    { id: 1, ts: stamp(240), date: today, user: 'System', role: 'system', action: 'Day started', detail: `${patients.filter((p) => p.bed).length} patients in care, ${waitlist.length} on the waiting list` },
    { id: 2, ts: stamp(200), date: today, user: nurse, role: 'nurse', action: 'Morning round started', detail: `${recordedToday.size} temperatures recorded so far` },
    { id: 3, ts: stamp(120), date: today, user: doctor, role: 'doctor', action: 'Ward round', detail: 'Visits in progress' },
  )

  return {
    version: 1, today, startedOn: today, user: null,
    patients, readings, visits, waitlist, snapshots, audit,
    nextIds: { patient: pidN, reading: rid, visit: vid, wait: 307, audit: 4 },
  }
}

const NEW_NAMES = rng(7)
export function arrivalsFor(state, count) {
  const out = []
  const pick = (a) => a[Math.floor(NEW_NAMES() * a.length)]
  for (let i = 0; i < count; i++) {
    out.push({
      id: 'W-' + (state.nextIds.wait + i), name: `${pick(FIRST)} ${pick(LAST)}`, age: 18 + Math.floor(NEW_NAMES() * 60),
      sex: NEW_NAMES() < 0.5 ? 'M' : 'F', arrivedOn: state.today, arrivedAt: `0${6 + i}:${String(Math.floor(NEW_NAMES() * 60)).padStart(2, '0')}`,
      triage: NEW_NAMES() < 0.3 ? 'urgent' : 'standard',
    })
  }
  return out
}
