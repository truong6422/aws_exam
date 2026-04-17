import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { analyticsApi, HistoryItem, PaginatedHistory } from '@/services/analytics-api'
import { EmptyState } from '@/components/shared/empty-state'
import PageHeader from '@/components/ui/page-header'

const PASSING_SCORE = 72

/** Exam history list with pagination and review links. */
export default function HistoryPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [data, setData] = useState<PaginatedHistory | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = (p: number) => {
    setLoading(true)
    analyticsApi.getHistory(p)
      .then((d) => { setData(d); setPage(p) })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  const statusColor = (status: string) => {
    if (status === 'submitted') return '#1d9b5e'
    if (status === 'expired') return '#f5a623'
    return 'rgba(255,255,255,0.4)'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return t('history.status_submitted')
      case 'expired': return t('history.status_expired')
      case 'ongoing': return t('history.status_ongoing')
      default: return status.replace('_', ' ')
    }
  }

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
        <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />
        <p style={{ color: '#e0453c', fontSize: '13px' }}>{error}</p>
        <button
          className="btn-ghost"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => load(1)}
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  if (!data || data.count === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />
        <EmptyState
          title={t('history.no_history')}
          description={t('history.no_history_desc')}
          actionLabel={t('exam.start_button')}
          onAction={() => navigate('/exam/setup')}
        />
      </div>
    )
  }

  const totalPages = Math.ceil(data.count / 10)
  const lang = i18n.language === 'en' ? 'en-US' : 'vi-VN'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />

      <div
        style={{
          background: '#272729',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
              {[
                { label: t('history.cert_col'), key: 'cert' },
                { label: t('history.date_col'), key: 'date' },
                { label: t('history.score_col'), key: 'score' },
                { label: t('history.status_col'), key: 'status' },
                { label: '', key: 'action' }
              ].map((h) => (
                <th
                  key={h.key}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '-0.12px',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.results.map((item: HistoryItem, idx: number) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: idx < data.results.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{item.certification_code}</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    {item.certification_name}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(item.started_at).toLocaleDateString(lang)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {item.score_percentage !== null ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${item.score_percentage >= PASSING_SCORE ? '#1d9b5e' : '#e0453c'}`,
                        color: item.score_percentage >= PASSING_SCORE ? '#1d9b5e' : '#e0453c',
                        letterSpacing: '-0.12px',
                      }}
                    >
                      {Number(item.score_percentage).toFixed(1)}%
                    </span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>—</span>
                  )}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '-0.12px',
                    textTransform: 'capitalize',
                    color: statusColor(item.status),
                  }}
                >
                  {getStatusText(item.status)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {item.status === 'submitted' && (
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2997ff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500,
                      }}
                      onClick={() => navigate(`/exam/${item.id}/result`)}
                    >
                      {t('history.review')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-ghost"
            disabled={page === 1}
            onClick={() => load(page - 1)}
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >
            {t('history.prev_page')}
          </button>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.12px' }}>
            {page} / {totalPages}
          </span>
          <button
            className="btn-ghost"
            disabled={!data.next}
            onClick={() => load(page + 1)}
            style={{ opacity: !data.next ? 0.4 : 1 }}
          >
            {t('history.next_page')}
          </button>
        </div>
      )}
    </div>
  )
}
