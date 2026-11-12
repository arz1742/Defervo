import { useEffect, useRef, useState } from 'react'
import { Bell, CalendarDays, ChevronDown, FastForward, LayoutDashboard, LogOut, RotateCcw, Stethoscope, Thermometer, BedDouble, History, Wand2, Repeat } from 'lucide-react'
import { useStore } from './lib/store'
import { ROLE_META, USERS, fmtDay } from './lib/logic'
import { Logo } from './components/Logo'
import { Button, Modal, Toaster, cx, toast } from './components/ui'
import AlertsList from './components/AlertsList'
import PatientDrawer from './components/PatientDrawer'
import Login from './views/Login'
import NurseView from './views/NurseView'
import DoctorView from './views/DoctorView'
import AdminView from './views/AdminView'
import Dashboard from './views/Dashboard'
import ActivityLog from './views/ActivityLog'

const NAV = {
  nurse: [{ id: 'rounds', label: 'Temperature round', icon: Thermometer }],
  doctor: [{ id: 'ward', label: 'Ward round', icon: Stethoscope }],
  admin: [{ id: 'beds', label: 'Beds & discharges', icon: BedDouble }, { id: 'activity', label: 'Activity log', icon: History }],
  head: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'ward', label: 'Ward round', icon: Stethoscope }, { id: 'beds', label: 'Beds & discharges', icon: BedDouble }, { id: 'activity', label: 'Activity log', icon: History }],
}
const TITLES = {
  rounds: ['Temperature round', 'Measure every patient once today. The list updates for doctors instantly.'],
  ward: ['Ward round', 'Patients appear here once their temperature is in, with the most urgent first.'],
  beds: ['Beds, discharges & admissions', 'Turn approved discharges into free beds, then admit from the waiting list.'],
  dashboard: ['Centre overview', 'Treatment quality, daily operations and what needs attention.'],
  activity: ['Activity log', ''],
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
  const bell = usePop(), demo = usePop(), me = usePop()

  useEffect(() => { if (user) setView(NAV[user.role][0].id) }, [user?.role])
  if (!user) return <><Login /><Toaster /></>
  const nav = NAV[user.role]
  const cur = nav.find((n) => n.id === view) ? view : nav[0].id
  const mine = alerts.filter((a) => a.roles.includes(user.role))
  const urgent = mine.filter((a) => a.level !== 'info').length

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Logo compact />
          <span className="hidden md:block font-bold text-slate-900 tracking-tight -ml-1">CareCycle</span>
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setView(n.id)} className={cx('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition', cur === n.id ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100')}>
                <n.icon size={16} />{n.label}
              </button>
            ))}
          </nav>
          <div className="flex-1" />

          {/* Simulated date + demo controls */}
          <div className="relative" ref={demo.ref}>
            <button onClick={() => demo.setOpen(!demo.open)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50">
              <CalendarDays size={15} className="text-brand-600" /><span className="font-medium text-slate-700 hidden sm:inline">{fmtDay(state.today)}</span><span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 rounded px-1.5 py-0.5">Demo</span><ChevronDown size={14} className="text-slate-400" />
            </button>
            {demo.open && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 p-2 anim-rise">
                <p className="px-2 pt-1 pb-2 text-xs text-slate-500">Prototype controls to walk through several days quickly. Simulated date: <b className="text-slate-700">{fmtDay(state.today)}</b></p>
                <DemoItem icon={Wand2} title="Auto-complete today’s rounds" body="Fills every missing temperature and doctor visit" onClick={() => { dispatch({ type: 'AUTOFILL', visits: true }); toast('Today’s rounds auto-completed', 'info'); demo.setOpen(false) }} />
                <DemoItem icon={Thermometer} title="Auto-fill temperatures only" body="Doctors can then work the ‘Ready for visit’ queue" onClick={() => { dispatch({ type: 'AUTOFILL', visits: false }); toast('Temperatures auto-filled', 'info'); demo.setOpen(false) }} />
                <DemoItem icon={FastForward} title="Advance to next day" body="New day, new rounds. Missed readings get flagged and 2 new arrivals join the waiting list" onClick={() => { dispatch({ type: 'NEXT_DAY' }); toast('Moved to the next day', 'info'); demo.setOpen(false) }} />
                <div className="border-t border-slate-100 my-1" />
                <DemoItem icon={RotateCcw} title="Reset demo data" body="Restore the original 74-patient scenario" danger onClick={() => { setResetOpen(true); demo.setOpen(false) }} />
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="relative" ref={bell.ref}>
            <button onClick={() => bell.setOpen(!bell.open)} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Alerts">
              <Bell size={20} />
              {mine.length > 0 && <span className={cx('absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white grid place-items-center', urgent ? 'bg-rose-500' : 'bg-sky-500')}>{mine.length}</span>}
            </button>
            {bell.open && (
              <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-xl ring-1 ring-slate-200 p-3 anim-rise max-h-[70vh] overflow-y-auto">
                <p className="text-sm font-semibold text-slate-800 mb-2 px-1">Alerts for {ROLE_META[user.role].label}</p>
                <AlertsList alerts={mine} openPatient={(id) => { setPid(id); bell.setOpen(false) }} />
              </div>
            )}
          </div>

          {/* User */}
          <div className="relative" ref={me.ref}>
            <button onClick={() => me.setOpen(!me.open)} className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-slate-100">
              <span className="h-8 w-8 rounded-full bg-brand-600 text-white text-xs font-bold grid place-items-center">{user.initials}</span>
              <span className="hidden lg:block text-left leading-tight"><span className="block text-sm font-medium text-slate-800">{user.name}</span><span className="block text-[11px] text-slate-500">{user.title}</span></span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {me.open && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 p-2 anim-rise">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Repeat size={12} /> Switch role (demo)</p>
                {USERS.map((u) => (
                  <button key={u.id} disabled={u.id === user.id} onClick={() => { dispatch({ type: 'LOGIN', user: u }); setPid(null); me.setOpen(false) }}
                    className={cx('w-full text-left rounded-lg px-2 py-2 text-sm flex items-center justify-between', u.id === user.id ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-50 text-slate-700')}>
                    <span>{ROLE_META[u.role].label}<span className="block text-xs text-slate-500">{u.name}</span></span>{u.id === user.id && <span className="text-[10px] font-bold">CURRENT</span>}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { dispatch({ type: 'LOGOUT' }); setPid(null) }} className="w-full text-left rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><LogOut size={15} /> Sign out</button>
              </div>
            )}
          </div>
        </div>
        {nav.length > 1 && (
          <nav className="md:hidden flex gap-1 overflow-x-auto scrollbar-none px-4 pb-2">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setView(n.id)} className={cx('shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium', cur === n.id ? 'bg-brand-50 text-brand-800' : 'text-slate-600')}><n.icon size={15} />{n.label}</button>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {cur !== 'activity' && (
          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{TITLES[cur][0]}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{TITLES[cur][1]}</p>
          </div>
        )}
        {cur === 'rounds' && <NurseView openPatient={setPid} />}
        {cur === 'ward' && <DoctorView openPatient={setPid} />}
        {cur === 'beds' && <AdminView openPatient={setPid} />}
        {cur === 'dashboard' && <Dashboard openPatient={setPid} go={setView} />}
        {cur === 'activity' && <ActivityLog openPatient={setPid} />}
      </main>

      {pid && <PatientDrawer pid={pid} onClose={() => setPid(null)} />}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset demo data?" subtitle="All changes made in this browser will be lost."
        footer={<><Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="danger" icon={RotateCcw} onClick={() => { dispatch({ type: 'RESET' }); setResetOpen(false); setPid(null); toast('Demo data reset', 'info') }}>Reset</Button></>}>
        <p className="text-sm text-slate-600">The ward goes back to the starting scenario: 74 patients, today’s round partly done, 6 people waiting.</p>
      </Modal>
      <Toaster />
    </div>
  )
}

function DemoItem({ icon: Icon, title, body, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-lg px-2 py-2 hover:bg-slate-50 flex gap-3">
      <span className={cx('rounded-lg p-1.5 h-fit', danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-700')}><Icon size={15} /></span>
      <span><span className="block text-sm font-medium text-slate-800">{title}</span><span className="block text-xs text-slate-500">{body}</span></span>
    </button>
  )
}
