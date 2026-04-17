import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, OverviewResponse } from '@/services/analytics-api'
import { ScoreCard } from '@/components/dashboard/score-card'
import { EmptyState } from '@/components/shared/empty-state'
import PageHeader from '@/components/ui/page-header'

const panelStyle: React.CSSProperties = {
  background: '#272729',
  borderRadius: '12px',
  padding: '20px',
}

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
    return (
      <div style={{ padding: '24px', fontSize: '14px', letterSpacing: '-0.224px', color: 'rgba(255,255,255,0.5)' }}>
        Đang tải...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: '#e0453c', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
        <button
          style={{ color: '#fff', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!overview || overview.total_attempts === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <PageHeader title="Bảng điều khiển" subtitle="Chào mừng trở lại" />
          <button
            className="btn-primary"
            onClick={() => navigate('/exam/setup')}
          >
            Bắt đầu thi
          </button>
        </div>
        <EmptyState
          title="Chưa có bài thi"
          description="Hãy thực hiện bài thi thử chứng chỉ AWS đầu tiên để theo dõi tiến trình của bạn tại đây."
          actionLabel="Bắt đầu bài thi đầu tiên"
          onAction={() => navigate('/exam/setup')}
        />
      </div>
    )
  }

  const avgScore = Number(overview.avg_score) || 0
  const bestScore = Number(overview.best_score) || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PageHeader title="Bảng điều khiển" subtitle="Chào mừng trở lại" />
        <button
          className="btn-primary"
          onClick={() => navigate('/exam/setup')}
        >
          Bắt đầu thi
        </button>
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <ScoreCard label="Tổng số bài thi"  value={overview.total_attempts} />
        <ScoreCard label="Điểm trung bình"  value={avgScore.toFixed(1)} suffix="%" />
        <ScoreCard label="Điểm cao nhất"    value={bestScore.toFixed(1)} suffix="%" />
      </div>

      {/* Recent attempts */}
      {overview.recent_trend.length > 0 && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span
              style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)' }}
            >
              Hoạt động gần đây
            </span>
            <button
              style={{ fontSize: '13px', color: '#2997ff', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate('/history')}
            >
              Xem tất cả
            </button>
          </div>
          <div>
            {overview.recent_trend.slice(0, 5).map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < Math.min(overview.recent_trend.length, 5) - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, fontSize: '14px', color: '#fff' }}>
                    {item.certification_code}
                  </span>
                  <span
                    style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '10px', letterSpacing: '-0.12px' }}
                  >
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '-0.12px',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${Number(item.score) >= 72 ? '#1d9b5e' : '#e0453c'}`,
                    color: Number(item.score) >= 72 ? '#1d9b5e' : '#e0453c',
                  }}
                >
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
