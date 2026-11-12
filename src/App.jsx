import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronsUpDown, FastForward, LayoutDashboard, LogOut, RotateCcw, Stethoscope, Thermometer, BedDouble, History, Wand2, Ruler, FlaskConical } from 'lucide-react'
import { useStore } from './lib/store'
import { ROLE_META, USERS, fmtDay } from './lib/logic'
import { Logo } from './components/Logo'
import { Button, Modal, Toaster, UnitSwitch, cx, toast } from './components/ui'
import AlertsList from './components/AlertsList'
import PatientDrawer from './components/PatientDrawer'
import Login from './views/Login'
import NurseView from './views/NurseView'
import DoctorView from './views/DoctorView'
import AdminView from './views/AdminView'
import Dashboard from './views/Dashboard'
import ActivityLog from './views/ActivityLog'
import UnitsView from './views/UnitsView'

const NAV = {
  nurse: [{ id: 'rounds', label: 'Temperature round', icon: Thermometer }],
  doctor: [{ id: 'ward', label: 'Ward round', icon: Stethoscope }],
  admin: [{ id: 'beds', label: 'Beds & discharges', icon: BedDouble }, { id: 'activity', label: 'Activity log', icon: History }],
  head: [{ id: 'dashboard', label: 'Overview', icon: LayoutDashboard }, { id: 'ward', label: 'Ward round', icon: Stethoscope }, { id: 'beds', label: 'Beds & discharges', icon: BedDouble }, { id: 'units', label: 'Units & standards', icon: Ruler }, { id: 'activity', label: 'Activity log', icon: History }],
}
const TITLES = {
  rounds: ['Temperature round', 'Measure every patient once today. Doctors see each reading the moment it’s saved.'],
  ward: ['Ward round', 'Patients show up here once their temperature is in. The most urgent are first.'],
  beds: ['Beds, discharges and admissions', 'Turn approved discharges into free beds, then admit from the waiting list.'],
  dashboard: ['Centre overview', 'Treatment quality against the 85% benchmark, today’s operations and what needs attention.'],
  activity: ['Activity log', 'Every action, who did it and when. Entries can’t be edited or deleted.'],
  units: ['Units and data standards', 'Readings arrive in °C and °F. View them in one unit, set the default, and standardise stored records.'],
}

function usePop() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return { open, setOpen, ref }
}

export default function App() {
  const { state, dispatch, alerts } = useStore()
  const user = state.user
  const [view, setView] = useState(null)
  const [pid, setPid] = useState(null)
  const [resetOpen, setResetOpen] = useState(false)
  const bell = usePop(), bellM = usePop(), demo = usePop(), demoM = usePop(), me = usePop(), meM = usePop()

  useEffect(() => { if (user) setView(NAV[user.role][0].id) }, [user?.role])
  if (!user) return <><Login /><Toaster /></>
  const nav = NAV[user.role]
  const cur = nav.find((n) => n.id === view) ? view : nav[0].id
  const mine = alerts.filter((a) => a.roles.includes(user.role))
  const urgent = mine.filter((a) => a.level !== 'info').length

  const demoMenu = (close) => (
    <div className="w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-pop ring-1 ring-rule p-1.5 anim-rise">
      <p className="px-2.5 pt-2 pb-2 text-xs text-slate-500">Demo controls for walking through several days. Simulated date: <b className="text-slate-700">{fmtDay(state.today)}</b></p>
      <DemoItem icon={Wand2} title="Finish today’s rounds" body="Fills every missing temperature and doctor visit" onClick={() => { dispatch({ type: 'AUTOFILL', visits: true }); toast('Today’s rounds finished', 'info'); close() }} />
      <DemoItem icon={Thermometer} title="Fill in temperatures only" body="Doctors can then work through the visit queue" onClick={() => { dispatch({ type: 'AUTOFILL', visits: false }); toast('Temperatures filled in', 'info'); close() }} />
      <DemoItem icon={FastForward} title="Go to the next day" body="Missed readings get flagged and two new patients arrive" onClick={() => { dispatch({ type: 'NEXT_DAY' }); toast('Moved to the next day', 'info'); close() }} />
      <div className="border-t border-rule my-1" />
      <DemoItem icon={RotateCcw} title="Reset demo data" body="Back to the original 74-patient scenario" danger onClick={() => { setResetOpen(true); close() }} />
    </div>
  )
  const userMenu = (close) => (
    <div className="w-64 rounded-xl bg-white shadow-pop ring-1 ring-rule p-1.5 anim-rise">
      <p className="px-2.5 py-1.5 text-xs text-slate-500">Switch to another staff member (demo)</p>
      {USERS.map((u) => (
        <button key={u.id} disabled={u.id === user.id} onClick={() => { dispatch({ type: 'LOGIN', user: u }); setPid(null); close() }}
          className={cx('w-full text-left rounded-md px-2.5 py-2 text-sm flex items-center gap-2.5', u.id === user.id ? 'bg-brand-50' : 'hover:bg-paper')}>
          <Avatar u={u} small /><span className="flex-1"><span className="block font-medium text-slate-800">{u.name}</span><span className="block text-xs text-slate-500">{ROLE_META[u.role].label}</span></span>
        </button>
      ))}
      <div className="border-t border-rule my-1" />
      <button onClick={() => { dispatch({ type: 'LOGOUT' }); setPid(null) }} className="w-full text-left rounded-md px-2.5 py-2 text-sm text-slate-600 hover:bg-paper flex items-center gap-2"><LogOut size={15} /> End shift and sign out</button>
    </div>
  )

  return (
    <div className="min-h-full lg:flex">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-rule">
        <div className="px-5 h-16 flex items-center"><Logo /></div>
        <nav className="px-3 mt-2 space-y-0.5">
          {nav.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={cx('w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                cur === n.id ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'text-slate-600 hover:bg-paper hover:text-brand-700')}>
              <n.icon size={17} strokeWidth={cur === n.id ? 2.2 : 1.8} />{n.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 mx-3 rounded-lg border border-rule p-3 space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Show temperatures</p>
            <UnitSwitch />
          </div>
          <div className="relative" ref={demo.ref}>
            <p className="text-xs text-slate-500 mb-1.5">Ward day (simulated)</p>
            <button onClick={() => demo.setOpen(!demo.open)} className="w-full flex items-center justify-between gap-2 rounded-md bg-paper px-2.5 py-2 text-sm hover:bg-brand-50">
              <span className="font-semibold text-brand-800">{fmtDay(state.today)}</span><span className="flex items-center gap-1 text-xs text-slate-500"><FlaskConical size={13} /> Demo</span>
            </button>
            {demo.open && <div className="absolute left-0 top-full mt-2 z-40">{demoMenu(() => demo.setOpen(false))}</div>}
          </div>
        </div>

        <div className="flex-1" />
        <div className="relative px-3 pb-3" ref={me.ref}>
          {me.open && <div className="absolute left-3 bottom-full mb-2 z-40">{userMenu(() => me.setOpen(false))}</div>}
          <button onClick={() => me.setOpen(!me.open)} className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 hover:bg-paper text-left">
            <Avatar u={user} />
            <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-800 truncate">{user.name}</span><span className="block text-xs text-slate-500">{user.title}</span></span>
            <ChevronsUpDown size={15} className="text-slate-400" />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-rule">
          <div className="px-4 h-14 flex items-center gap-2">
            <Logo size={26} />
            <div className="flex-1" />
            <div className="relative" ref={demoM.ref}>
              <button onClick={() => demoM.setOpen(!demoM.open)} className="rounded-md px-2 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-rule whitespace-nowrap">{fmtDay(state.today)}</button>
              {demoM.open && <div className="absolute right-0 top-full mt-2 z-40">{demoMenu(() => demoM.setOpen(false))}</div>}
            </div>
            <BellButton bell={bellM} mine={mine} urgent={urgent} user={user} openPatient={setPid} />
            <div className="relative" ref={meM.ref}>
              <button onClick={() => meM.setOpen(!meM.open)} aria-label="Account"><Avatar u={user} /></button>
              {meM.open && <div className="absolute right-0 top-full mt-2 z-40">{userMenu(() => meM.setOpen(false))}</div>}
            </div>
          </div>
          <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {nav.length > 1 && nav.map((n) => (
              <button key={n.id} onClick={() => setView(n.id)} className={cx('shrink-0 rounded-md px-2.5 py-1 text-sm font-medium', cur === n.id ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'text-slate-600')}>{n.label}</button>
            ))}
            <div className="ml-auto shrink-0"><UnitSwitch compact /></div>
          </div>
        </header>

        <main className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="mb-6 flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[26px] sm:text-[30px] leading-tight font-semibold tracking-tight text-brand-800">{TITLES[cur][0]}</h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{TITLES[cur][1]}</p>
            </div>
            <div className="hidden lg:block"><BellButton bell={bell} mine={mine} urgent={urgent} user={user} openPatient={setPid} /></div>
          </div>
          {cur === 'rounds' && <NurseView openPatient={setPid} />}
          {cur === 'ward' && <DoctorView openPatient={setPid} />}
          {cur === 'beds' && <AdminView openPatient={setPid} />}
          {cur === 'dashboard' && <Dashboard openPatient={setPid} go={setView} />}
          {cur === 'activity' && <ActivityLog openPatient={setPid} />}
          {cur === 'units' && <UnitsView />}
        </main>
      </div>

      {pid && <PatientDrawer pid={pid} onClose={() => setPid(null)} />}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset demo data?" subtitle="All changes made in this browser will be lost."
        footer={<><Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="danger" icon={RotateCcw} onClick={() => { dispatch({ type: 'RESET' }); setResetOpen(false); setPid(null); toast('Demo data reset', 'info') }}>Reset demo data</Button></>}>
        <p className="text-sm text-slate-600">The ward goes back to the starting scenario: 74 patients, today’s round partly done, 6 people waiting.</p>
      </Modal>
      <Toaster />
    </div>
  )
}

const AV = { nurse: 'bg-sky-100 text-sky-800', doctor: 'bg-emerald-100 text-emerald-800', admin: 'bg-violet-100 text-violet-800', head: 'bg-amber-100 text-amber-800' }
export function Avatar({ u, small }) {
  return <span className={cx('rounded-full grid place-items-center font-semibold shrink-0', small ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs', AV[u.role])}>{u.initials}</span>
}

function BellButton({ bell, mine, urgent, user, openPatient }) {
  return (
    <div className="relative" ref={bell.ref}>
      <button onClick={() => bell.setOpen(!bell.open)} className={cx('relative flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium ring-1 transition whitespace-nowrap', urgent ? 'ring-rose-200 bg-rose-50 text-rose-700' : 'ring-rule bg-white text-slate-600 hover:bg-paper')} aria-label="Alerts">
        <Bell size={17} />
        <span className="hidden sm:inline">{mine.length ? `${mine.length} alert${mine.length > 1 ? 's' : ''}` : 'No alerts'}</span>
        {mine.length > 0 && <span className="sm:hidden absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white grid place-items-center">{mine.length}</span>}
      </button>
      {bell.open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-pop ring-1 ring-rule p-3 anim-rise max-h-[70vh] overflow-y-auto z-40">
          <p className="text-sm font-semibold text-slate-800 mb-2 px-1">Alerts for you</p>
          <AlertsList alerts={mine} openPatient={(id) => { openPatient(id); bell.setOpen(false) }} />
        </div>
      )}
    </div>
  )
}

function DemoItem({ icon: Icon, title, body, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-md px-2.5 py-2 hover:bg-paper flex gap-3">
      <Icon size={16} className={cx('mt-0.5 shrink-0', danger ? 'text-rose-600' : 'text-brand-500')} />
      <span><span className="block text-sm font-medium text-slate-800">{title}</span><span className="block text-xs text-slate-500">{body}</span></span>
    </button>
  )
}
