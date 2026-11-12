// ─── Clinical & operational rules (single source of truth) ───────────────────
export const RULES = {
  FEVER_C: 38.0,          // a reading ≥ this is a fever
  HIGH_FEVER_C: 39.5,     // a reading ≥ this alerts doctors immediately
  LOW_TEMP_C: 35.0,       // a reading < this asks for a re-check (hypothermia / bad reading)
  TEMP_MIN_C: 34.0,       // physically implausible below this → rejected
  TEMP_MAX_C: 43.0,       // physically implausible above this → rejected
  CURE_DAYS: 3,           // consecutive fever-free days needed for discharge
  CAPACITY: 74,           // beds in the centre
  MORTALITY_LIMIT: 15,    // % expected mortality (85% success benchmark)
  ROUND_CUTOFF_HOUR: 12,  // temperatures not taken by noon are flagged overdue
  VISIT_CUTOFF_HOUR: 17,  // doctor visits not done by 5pm are flagged overdue
}

export const WARDS = [
  { id: 'A', from: 1, to: 20 },
  { id: 'B', from: 21, to: 40 },
  { id: 'C', from: 41, to: 60 },
  { id: 'D', from: 61, to: 74 },
]

export const USERS = [
  { id: 'u-nurse', name: 'Priya Sharma', role: 'nurse', title: 'Staff Nurse', initials: 'PS' },
  { id: 'u-doctor', name: 'Dr. Ananya Iyer', role: 'doctor', title: 'Attending Doctor', initials: 'AI' },
  { id: 'u-admin', name: 'Neha Kapoor', role: 'admin', title: 'Admissions & Discharge', initials: 'NK' },
  { id: 'u-head', name: 'Dr. Vikram Rao', role: 'head', title: 'Head Doctor', initials: 'VR' },
]

export const ROLE_META = {
  nurse: { label: 'Nurse', color: 'sky' },
  doctor: { label: 'Doctor', color: 'brand' },
  admin: { label: 'Admin Staff', color: 'violet' },
  head: { label: 'Head Doctor', color: 'amber' },
}

// ─── Dates (simulated "today" is stored as YYYY-MM-DD) ───────────────────────
export const addDays = (d, n) => {
  const x = new Date(d + 'T00:00:00Z')
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
export const diffDays = (a, b) => Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5)
export const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' })
export const fmtDay = (d) => fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })
export const nowHM = () => new Date().toTimeString().slice(0, 5)
export const nowHour = () => new Date().getHours()

export function bedLabel(n) {
  const w = WARDS.find((w) => n >= w.from && n <= w.to)
  return `${w.id}-${String(n - w.from + 1).padStart(2, '0')}`
}
export const wardOf = (n) => WARDS.find((w) => n >= w.from && n <= w.to).id

// ─── Derived state ───────────────────────────────────────────────────────────
export function indexReadings(readings) {
  const idx = {}
  for (const r of readings) (idx[r.pid] ||= {})[r.date] = r
  return idx
}
export function indexVisits(visits) {
  const idx = {}
  for (const v of visits) (idx[v.pid] ||= {})[v.date] = v
  return idx
}

/** Consecutive fever-free days ending today (if measured) or yesterday. A missing day breaks the streak. */
export function feverFreeStreak(rIdx, pid, today) {
  const days = rIdx[pid] || {}
  let d = days[today] ? today : addDays(today, -1)
  let s = 0
  while (days[d] && days[d].temp < RULES.FEVER_C) { s++; d = addDays(d, -1) }
  return s
}

export function patientDay(state, p, rIdx, vIdx) {
  const t = state.today
  const temp = rIdx[p.id]?.[t] || null
  const visit = vIdx[p.id]?.[t] || null
  const streak = feverFreeStreak(rIdx, p.id, t)
  const active = p.status === 'admitted'
  const eligible = active && streak >= RULES.CURE_DAYS
  let stage = 'closed'
  if (p.status === 'discharge_approved') stage = 'approved'
  else if (active) stage = !temp ? 'temp_due' : !visit ? 'visit_due' : 'done'
  const yesterday = addDays(t, -1)
  const missedYesterday = active && p.admittedOn <= yesterday && !rIdx[p.id]?.[yesterday]
  return {
    temp, visit, streak, eligible, stage, missedYesterday,
    fever: temp ? temp.temp >= RULES.FEVER_C : null,
    highFever: temp ? temp.temp >= RULES.HIGH_FEVER_C : false,
    daysIn: diffDays(t, p.admittedOn) + 1,
  }
}

export function computeStats(state, rIdx, vIdx) {
  const active = state.patients.filter((p) => p.status === 'admitted')
  const approved = state.patients.filter((p) => p.status === 'discharge_approved')
  const occupied = active.length + approved.length
  const closed = state.patients.filter((p) => p.status === 'discharged' || p.status === 'deceased')
  const deceased = closed.filter((p) => p.status === 'deceased').length
  const recovered = closed.length - deceased
  const mortality = closed.length ? (deceased / closed.length) * 100 : 0
  const since = addDays(state.today, -6)
  const recent = closed.filter((p) => p.closedOn >= since)
  const recentDeaths = recent.filter((p) => p.status === 'deceased').length
  const recentMortality = recent.length ? (recentDeaths / recent.length) * 100 : 0
  const days = active.map((p) => ({ p, d: patientDay(state, p, rIdx, vIdx) }))
  const tempsDone = days.filter((x) => x.d.temp).length
  const visitsDone = days.filter((x) => x.d.visit).length
  const eligible = days.filter((x) => x.d.eligible)
  const fevers = days.filter((x) => x.d.fever).length
  const highFevers = days.filter((x) => x.d.highFever)
  const missedYesterday = days.filter((x) => x.d.missedYesterday)
  const discharged = closed.filter((p) => p.status === 'discharged')
  const avgStay = discharged.length
    ? discharged.reduce((s, p) => s + diffDays(p.closedOn, p.admittedOn), 0) / discharged.length : 0
  return {
    active, approved, occupied, free: RULES.CAPACITY - occupied, closed, deceased, recovered,
    mortality, recovery: closed.length ? 100 - mortality : 100, recentMortality, recentCount: recent.length,
    tempsDone, visitsDone, eligible, fevers, highFevers, missedYesterday, avgStay, days,
  }
}

/** Alerts are derived (never stored) so they always reflect the current truth. */
export function computeAlerts(state, stats) {
  const a = []
  const h = nowHour()
  const total = stats.active.length
  if (stats.mortality > RULES.MORTALITY_LIMIT)
    a.push({ id: 'mort', level: 'critical', roles: ['head', 'doctor', 'admin'], title: `Mortality ${stats.mortality.toFixed(1)}% is above the ${RULES.MORTALITY_LIMIT}% benchmark`, body: 'Review treatment protocols with the clinical team.' })
  else if (stats.recentCount >= 5 && stats.recentMortality > RULES.MORTALITY_LIMIT)
    a.push({ id: 'mort7', level: 'warning', roles: ['head', 'doctor'], title: `Last-7-day mortality is ${stats.recentMortality.toFixed(1)}%`, body: `Overall is ${stats.mortality.toFixed(1)}% (within benchmark), but the recent trend is above ${RULES.MORTALITY_LIMIT}%.` })
  for (const x of stats.highFevers)
    a.push({ id: 'hf-' + x.p.id, pid: x.p.id, level: 'critical', roles: ['doctor', 'head'], title: `High fever: ${x.p.name} (${bedLabel(x.p.bed)})`, body: `${x.d.temp.temp.toFixed(1)} °C recorded at ${x.d.temp.at}. Prioritise this visit.` })
  const tempsDue = total - stats.tempsDone
  if (tempsDue > 0 && h >= RULES.ROUND_CUTOFF_HOUR)
    a.push({ id: 'tempdue', level: 'warning', roles: ['nurse', 'head'], title: `${tempsDue} temperature${tempsDue > 1 ? 's' : ''} overdue`, body: `Morning round cut-off is ${RULES.ROUND_CUTOFF_HOUR}:00.` })
  const visitsDue = total - stats.visitsDone
  if (visitsDue > 0 && h >= RULES.VISIT_CUTOFF_HOUR)
    a.push({ id: 'visitdue', level: 'warning', roles: ['doctor', 'head'], title: `${visitsDue} doctor visit${visitsDue > 1 ? 's' : ''} still pending`, body: `Visits should be completed by ${RULES.VISIT_CUTOFF_HOUR}:00.` })
  if (stats.missedYesterday.length)
    a.push({ id: 'missed', level: 'warning', roles: ['nurse', 'head', 'doctor'], title: `${stats.missedYesterday.length} patient${stats.missedYesterday.length > 1 ? 's' : ''} missed yesterday's temperature`, body: 'A missed day resets the fever-free count and can delay discharge.' })
  if (stats.eligible.length)
    a.push({ id: 'elig', level: 'info', roles: ['doctor', 'head'], title: `${stats.eligible.length} patient${stats.eligible.length > 1 ? 's' : ''} meet the 3-day discharge criterion`, body: 'Approve the discharge so admin can free the bed.' })
  if (stats.approved.length)
    a.push({ id: 'appr', level: 'info', roles: ['admin', 'head'], title: `${stats.approved.length} discharge${stats.approved.length > 1 ? 's' : ''} approved, awaiting admin`, body: 'Complete the discharge to free the bed for the waiting list.' })
  if (stats.free === 0 && state.waitlist.length)
    a.push({ id: 'full', level: 'info', roles: ['admin', 'head'], title: `Centre at full capacity · ${state.waitlist.length} waiting`, body: 'Admissions open as soon as a discharge is completed.' })
  else if (stats.free > 0 && state.waitlist.length)
    a.push({ id: 'freebed', level: 'warning', roles: ['admin', 'head'], title: `${stats.free} bed${stats.free > 1 ? 's' : ''} free · ${state.waitlist.length} waiting`, body: 'Admit the next patient from the waiting list.' })
  return a
}

/** Validates a temperature entry. Returns { error } | { warning } | {} */
export function validateTemp(raw) {
  const v = Number(String(raw).replace(',', '.'))
  if (raw === '' || Number.isNaN(v)) return { error: 'Enter a temperature in °C.' }
  if (v < RULES.TEMP_MIN_C || v > RULES.TEMP_MAX_C) return { error: `Must be between ${RULES.TEMP_MIN_C} and ${RULES.TEMP_MAX_C} °C. Check the thermometer (°F not accepted).` }
  if (v >= RULES.HIGH_FEVER_C) return { value: v, warning: 'High fever. The doctors will be alerted straight away.' }
  if (v < RULES.LOW_TEMP_C) return { value: v, warning: 'Unusually low reading. Please re-measure to confirm before saving.' }
  return { value: v }
}
