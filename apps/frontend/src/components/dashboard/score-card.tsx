interface Props {
  label: string
  value: string | number
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
  colorClass?: string
}

/** Stat card showing a single metric with optional trend indicator. */
export function ScoreCard({ label, value, suffix = '', trend, colorClass = 'text-blue-600' }: Props) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>
        {value}{suffix}
        {trendIcon && <span className={`text-lg ml-1 ${trendColor}`}>{trendIcon}</span>}
      </p>
    </div>
  )
}
