export function Logo({ light, compact }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill={light ? 'rgba(255,255,255,.14)' : '#0d8077'} />
        <path d="M22.5 11.5a8 8 0 1 0 0 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="22.5" cy="11.5" r="2" fill="#94e9da" />
      </svg>
      {!compact && <div className="leading-tight"><p className={`font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>CareCycle</p><p className={`text-[11px] ${light ? 'text-brand-200' : 'text-slate-500'}`}>Quarantine ward operations</p></div>}
    </div>
  )
}
