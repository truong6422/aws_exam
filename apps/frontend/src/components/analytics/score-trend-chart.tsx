import { RecentTrendItem } from '../../services/analytics-api'

interface Props {
  trend: RecentTrendItem[]
  passingScore?: number
}

/** CSS sparkline bar chart showing score trend across recent exam attempts. */
export function ScoreTrendChart({ trend, passingScore = 72 }: Props) {
  if (!trend.length) {
    return <p className="text-gray-400 text-sm italic">No trend data yet.</p>
  }

  const maxScore = 100
  const height = 80 // px

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 relative" style={{ height: `${height + 24}px` }}>
        {/* Passing score reference line */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-orange-400 opacity-60 pointer-events-none"
          style={{ bottom: `${24 + (passingScore / maxScore) * height}px` }}
        >
          <span className="absolute right-0 -top-5 text-xs text-orange-400">{passingScore}%</span>
        </div>

        {trend.map((item, i) => {
          const barHeight = Math.max(4, (item.score / maxScore) * height)
          const isPassing = item.score >= passingScore
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-1"
              style={{ height: `${height + 24}px` }}
              title={`${item.score}% — ${item.certification_code}`}
            >
              <div
                className={`w-full rounded-t ${isPassing ? 'bg-green-400' : 'bg-red-400'}`}
                style={{ height: `${barHeight}px` }}
              />
              <span className="text-xs text-gray-400 truncate w-full text-center leading-none">
                {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>Last {trend.length} exams</span>
        <span>Score trend</span>
      </div>
    </div>
  )
}
