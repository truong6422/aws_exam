import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, WeakDomainItem, OverviewResponse } from '@/services/analytics-api'
import { examApi, Certification } from '@/services/exam-api'
import { WeakDomainsChart } from '@/components/analytics/weak-domains-chart'
import { ScoreTrendChart } from '@/components/analytics/score-trend-chart'
import { EmptyState } from '@/components/shared/empty-state'
import PageHeader from '@/components/ui/page-header'

/** Analytics page — weak domains chart + score trend, filterable by certification. */
export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [selectedCertId, setSelectedCertId] = useState<number | null>(null)
  const [domains, setDomains] = useState<WeakDomainItem[]>([])
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      examApi.getCertifications(),
      analyticsApi.getOverview(),
    ])
      .then(([certs, ov]) => {
        setCertifications(certs)
        setOverview(ov)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    analyticsApi.getWeakDomains(selectedCertId ?? undefined).then(setDomains).catch(() => setDomains([]))
  }, [selectedCertId])

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading...</div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Track your performance over time" />
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <button className="text-blue-600 text-sm hover:underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (!overview || overview.total_submitted === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Track your performance over time" />
        <EmptyState
          icon="📊"
          title="No analytics yet"
          description="Complete at least one exam to see your weak domains and score trends."
          actionLabel="Take an Exam"
          onAction={() => navigate('/exam/setup')}
        />
      </div>
    )
  }

  const weakestDomain = [...domains].sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)[0]

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Track your performance over time" />

      {/* Certification filter */}
      <select
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={selectedCertId ?? ''}
        onChange={(e) => setSelectedCertId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">All Certifications</option>
        {certifications.map((c) => (
          <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
        ))}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak domains */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Weak Domains</h2>
          <WeakDomainsChart domains={domains} />
          {weakestDomain && (
            <p className="text-sm text-gray-500 mt-4">
              Focus on: <strong className="text-red-600">{weakestDomain.domain_name}</strong>
            </p>
          )}
        </div>

        {/* Score trend */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Score Trend</h2>
          <ScoreTrendChart trend={overview.recent_trend} />
        </div>
      </div>
    </div>
  )
}
