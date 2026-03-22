/**
 * Countdown timer display component.
 * Normal: gray | Warning <5min: red bold | Critical <1min: red bold pulsing
 */
interface Props {
  minutes: number
  seconds: number
  isWarning: boolean
  isCritical: boolean
}

export function ExamTimer({ minutes, seconds, isWarning, isCritical }: Props) {
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  let cls = 'font-mono text-2xl font-bold text-gray-800'
  if (isCritical) cls = 'font-mono text-2xl font-bold text-red-600 animate-pulse'
  else if (isWarning) cls = 'font-mono text-2xl font-bold text-red-600'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Time Remaining
      </span>
      <span className={cls} aria-live="polite" aria-atomic="true">
        {timeStr}
      </span>
    </div>
  )
}
