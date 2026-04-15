/**
 * Countdown timer display component.
 * Normal: white | Warning <5min: orange (#f5a623) | Critical <1min: red (#e0453c) pulsing
 */
interface Props {
  minutes: number
  seconds: number
  isWarning: boolean
  isCritical: boolean
}

export function ExamTimer({ minutes, seconds, isWarning, isCritical }: Props) {
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  let color = '#fff'
  if (isCritical) color = '#e0453c'
  else if (isWarning) color = '#f5a623'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '-0.12px',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Time Remaining
      </span>
      <span
        style={{
          fontFamily: "'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontVariantNumeric: 'tabular-nums',
          fontSize: '22px',
          fontWeight: 700,
          color,
          animation: isCritical ? 'pulse 1s ease-in-out infinite' : undefined,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {timeStr}
      </span>
    </div>
  )
}
