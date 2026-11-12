/** Defervo brand logo (cross with a pulse line + wordmark), supplied as artwork. */
export function Logo({ compact, size = 28 }) {
  if (compact) return <img src="/defervo-icon.png" alt="Defervo" style={{ height: size, width: size }} />
  return <img src="/defervo-logo.png" alt="Defervo" style={{ height: size }} className="w-auto select-none" draggable={false} />
}
