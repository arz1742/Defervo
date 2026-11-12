import { useState } from 'react'
import { History, Search } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Card, Empty, cx } from '../components/ui'
import { ROLE_META, fmtDate } from '../lib/logic'

const TONE = { nurse: 'sky', doctor: 'brand', admin: 'violet', head: 'amber', system: 'slate' }

export default function ActivityLog({ openPatient }) {
  const { state } = useStore()
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const rows = state.audit
    .filter((a) => role === 'all' || a.role === role)
    .filter((a) => !q || (a.action + ' ' + a.detail + ' ' + a.user).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><History size={18} /> Activity log</h2>
          <p className="text-sm text-slate-500">Every action is recorded with who did it and when. Entries can’t be edited or deleted.</p>
        </div>
        <div className="flex gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg bg-white ring-1 ring-slate-200 px-3 py-2 text-sm outline-none">
            <option value="all">All roles</option>{Object.entries(ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}<option value="system">System</option>
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-44 rounded-lg bg-white ring-1 ring-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? <Empty icon={History} title="No activity found" /> : (
          <ul className="divide-y divide-slate-100">
            {rows.slice(0, 200).map((a) => (
              <li key={a.id} className={cx('px-4 py-3 flex gap-3 items-start text-sm', a.pid && 'cursor-pointer hover:bg-slate-50')} onClick={() => a.pid && openPatient(a.pid)}>
                <div className="w-24 shrink-0 text-xs text-slate-500 pt-0.5"><span className="block font-medium text-slate-700">{fmtDate(a.date)}</span>{new Date(a.ts).toTimeString().slice(0, 5)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{a.action}</p>
                  {a.detail && <p className="text-slate-500 break-words">{a.detail}</p>}
                </div>
                <div className="shrink-0 text-right hidden sm:block"><p className="text-xs text-slate-700">{a.user}</p><Badge tone={TONE[a.role]} className="mt-0.5">{ROLE_META[a.role]?.label || 'System'}</Badge></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
