import { WeakDomainItem } from '../../services/analytics-api'

interface Props {
  domains: WeakDomainItem[]
}

/** CSS bar chart showing domain accuracy — sorted weakest first. */
export function WeakDomainsChart({ domains }: Props) {
  if (!domains.length) {
    return <p className="text-gray-400 text-sm italic">No domain data yet. Complete more exams.</p>
  }

  const sorted = [...domains].sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)

  const getBarColor = (accuracy: number) => {
    if (accuracy >= 70) return 'bg-green-500'
    if (accuracy >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-3">
      {sorted.map((d) => (
        <div key={d.domain_id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 truncate max-w-xs">{d.domain_name}</span>
            <span className="font-medium ml-2 tabular-nums">{d.accuracy_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${getBarColor(d.accuracy_percentage)}`}
              style={{ width: `${Math.min(d.accuracy_percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{d.correct_count}/{d.total_questions} correct</p>
        </div>
      ))}
    </div>
  )
}
