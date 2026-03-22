import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, OverviewResponse } from '@/services/analytics-api'
import { ScoreCard } from '@/components/dashboard/score-card'
import { EmptyState } from '@/components/shared/empty-state'
import PageHeader from '@/components/ui/page-header'

/** Dashboard overview — recent attempts, score cards, start exam CTA. */
export default function DashboardPage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    analyticsApi.getOverview()
      .then(setOverview)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-6 text-gray-400 text-sm">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button
          className="text-blue-600 text-sm hover:underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!overview || overview.total_attempts === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Dashboard" subtitle="Welcome back! Ready to practice?" />
        <div className="flex gap-3">
          <button
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            onClick={() => navigate('/exam/setup')}
          >
            📝 Start Exam
          </button>
        </div>
        <EmptyState
          icon="🎯"
          title="No exams yet"
          description="Take your first AWS certification practice exam to see your progress here."
          actionLabel="Start Your First Exam"
          onAction={() => navigate('/exam/setup')}
        />
      </div>
    )
  }

  const avgScore = Number(overview.avg_score) || 0
  const bestScore = Number(overview.best_score) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Dashboard" subtitle="Welcome back! Ready to practice?" />
        <button
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          onClick={() => navigate('/exam/setup')}
        >
          📝 Start Exam
        </button>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScoreCard label="Total Exams" value={overview.total_attempts} colorClass="text-gray-900" />
        <ScoreCard label="Average Score" value={avgScore.toFixed(1)} suffix="%" colorClass="text-blue-600" />
        <ScoreCard label="Best Score" value={bestScore.toFixed(1)} suffix="%" colorClass="text-green-600" />
      </div>

      {/* Recent attempts */}
      {overview.recent_trend.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => navigate('/history')}
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {overview.recent_trend.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium text-sm text-gray-800">{item.certification_code}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <span className={`font-bold text-xs px-2 py-1 rounded-full ${
                  Number(item.score) >= 72
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {Number(item.score).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
