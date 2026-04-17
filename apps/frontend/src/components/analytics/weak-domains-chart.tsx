import { useTranslation } from 'react-i18next'
import { WeakDomainItem } from '../../services/analytics-api'

interface Props {
  domains: WeakDomainItem[]
}

/** CSS bar chart showing domain accuracy — sorted weakest first. */
export function WeakDomainsChart({ domains }: Props) {
  const { t } = useTranslation()
  if (!domains.length) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontStyle: 'italic', letterSpacing: '-0.224px' }}>
        {t('analytics.no_domains')}
      </p>
    )
  }

  const sorted = [...domains].sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)

  const getBarColor = (accuracy: number): string => {
    if (accuracy >= 70) return '#1d9b5e'
    if (accuracy >= 50) return '#f5a623'
    return '#e0453c'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sorted.map((d) => (
        <div key={d.domain_id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px', letterSpacing: '-0.224px' }}>
              {d.domain_name}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, marginLeft: '8px', fontVariantNumeric: 'tabular-nums', color: '#fff', letterSpacing: '-0.224px' }}>
              {d.accuracy_percentage.toFixed(1)}%
            </span>
          </div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', height: '8px' }}>
            <div
              style={{
                height: '8px',
                borderRadius: '2px',
                background: getBarColor(d.accuracy_percentage),
                width: `${Math.min(d.accuracy_percentage, 100)}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', letterSpacing: '-0.12px' }}>
            {t('analytics.correct_count_label', { correct: d.correct_count, total: d.total_questions })}
          </p>
        </div>
      ))}
    </div>
  )
}
