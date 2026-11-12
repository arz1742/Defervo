/** Defervo mark: a fever curve falling through the 38 °C threshold and settling below it. */
export function Mark({ size = 28, light }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill={light ? '#FFFFFF' : '#14213D'} />
      <line x1="5" y1="15" x2="27" y2="15" stroke={light ? '#14213D' : '#FFFFFF'} strokeOpacity=".35" strokeWidth="1.6" strokeDasharray="2.2 2.2" />
      <path d="M5.5 8.5 C 10 8.5, 11 11, 13.5 15 S 18 22.5, 22 22.5 L 26.5 22.5" fill="none" stroke="#E5483B" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="26.5" cy="22.5" r="2" fill={light ? '#14213D' : '#FFFFFF'} />
    </svg>
  )
}

export function Logo({ light, compact, size = 28 }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={size} light={light} />
      {!compact && <span className={`cond text-[22px] leading-none font-semibold tracking-tight ${light ? 'text-white' : 'text-brand-800'}`}>Defervo</span>}
    </div>
  )
}
