import { useTranslation } from 'react-i18next'
import { RecentTrendItem } from '../../services/analytics-api'

interface Props {
  trend: RecentTrendItem[]
  passingScore?: number
}

/** CSS sparkline bar chart showing score trend across recent exam attempts. */
export function ScoreTrendChart({ trend, passingScore = 72 }: Props) {
  const { t, i18n } = useTranslation()
  if (!trend.length) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontStyle: 'italic', letterSpacing: '-0.224px' }}>
        {t('analytics.no_trend')}
      </p>
    )
  }

  const maxScore = 100
  const height = 80 // px
  const lang = i18n.language === 'en' ? 'en-US' : 'vi-VN'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', position: 'relative', height: `${height + 24}px` }}>
        {/* Passing score reference line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${24 + (passingScore / maxScore) * height}px`,
            borderTop: '1px dashed rgba(255,255,255,0.3)',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        >
          <span style={{ position: 'absolute', right: 0, top: '-18px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.12px' }}>
            {passingScore}%
          </span>
        </div>

        {trend.map((item, i) => {
          const barHeight = Math.max(4, (item.score / maxScore) * height)
          const isPassing = item.score >= passingScore
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', height: `${height + 24}px` }}
              title={`${item.score}% — ${item.certification_code}`}
            >
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  background: isPassing ? '#1d9b5e' : '#e0453c',
                  borderRadius: '2px 2px 0 0',
                }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', lineHeight: 1, letterSpacing: '-0.12px' }}>
                {new Date(item.date).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.12px' }}>
        <span>{t('analytics.recent_exams_label', { count: trend.length })}</span>
        <span>{t('analytics.score_trend')}</span>
      </div>
    </div>
  )
}
