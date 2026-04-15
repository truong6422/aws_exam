import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, WeakDomainItem, OverviewResponse } from '@/services/analytics-api'
import { examApi, Certification } from '@/services/exam-api'
import { WeakDomainsChart } from '@/components/analytics/weak-domains-chart'
import { ScoreTrendChart } from '@/components/analytics/score-trend-chart'
import { EmptyState } from '@/components/shared/empty-state'
import PageHeader from '@/components/ui/page-header'

const panelStyle: React.CSSProperties = {
  background: '#272729',
  borderRadius: '12px',
  padding: '20px',
}

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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: '32px', height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#0071e3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <PageHeader title="Analytics" subtitle="Track your performance over time" />
        <p style={{ color: '#e0453c', fontSize: '13px', letterSpacing: '-0.224px' }}>{error}</p>
        <button
          className="btn-ghost"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!overview || overview.total_submitted === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <PageHeader title="Analytics" subtitle="Track your performance over time" />
        <EmptyState
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title="Analytics" subtitle="Track your performance over time" />

      {/* Certification filter */}
      <select
        style={{
          background: '#242426',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          color: '#fff',
          outline: 'none',
          alignSelf: 'flex-start',
          minWidth: '220px',
        }}
        value={selectedCertId ?? ''}
        onChange={(e) => setSelectedCertId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">All Certifications</option>
        {certifications.map((c) => (
          <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
        ))}
      </select>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Weak domains */}
        <div style={panelStyle}>
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '-0.12px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '16px',
            }}
          >
            Weak Domains
          </h2>
          <WeakDomainsChart domains={domains} />
          {weakestDomain && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '16px', letterSpacing: '-0.12px' }}>
              Focus on:{' '}
              <strong style={{ color: '#e0453c' }}>{weakestDomain.domain_name}</strong>
            </p>
          )}
        </div>

        {/* Score trend */}
        <div style={panelStyle}>
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '-0.12px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '16px',
            }}
          >
            Score Trend
          </h2>
          <ScoreTrendChart trend={overview.recent_trend} />
        </div>
      </div>
    </div>
  )
}
