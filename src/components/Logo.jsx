/** Defervo mark: four daily readings as chart bars. The first two cross the dashed
 *  38 °C fever line (coral), the last two stay under it (white): the fever is going down. */
export function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1E7250" /><line x1="4" y1="13" x2="28" y2="13" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="1.4" strokeDasharray="2 2" /><rect x="6" y="6" width="4" height="19" rx="1.4" fill="#FF8A7A" /><rect x="11.5" y="9" width="4" height="16" rx="1.4" fill="#FF8A7A" /><rect x="17" y="16" width="4" height="9" rx="1.4" fill="#FFFFFF" /><rect x="22.5" y="17.5" width="4" height="7.5" rx="1.4" fill="#FFFFFF" />
    </svg>
  )
}

export function Logo({ compact, size = 28 }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={size} />
      {!compact && <span className="cond text-[22px] leading-none font-semibold tracking-tight text-brand-700">Defervo</span>}
    </div>
  )
}
