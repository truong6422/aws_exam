interface Props {
  label: string
  value: string | number
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
}

/** Stat card — Apple dark surface style. */
export function ScoreCard({ label, value, suffix = '', trend }: Props) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''
  const trendColor =
    trend === 'up' ? '#1d9b5e' : trend === 'down' ? '#e0453c' : 'rgba(255,255,255,0.4)'

  return (
    <div
      style={{
        background: '#272729',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <p
        style={{
          fontSize: '12px',
          fontWeight: 400,
          letterSpacing: '-0.12px',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '8px',
        }}
      >
        {label}
      </p>
      <p style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif", fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {value}{suffix}
        {trendIcon && (
          <span style={{ fontSize: '1rem', marginLeft: '4px', color: trendColor }}>
            {trendIcon}
          </span>
        )}
      </p>
    </div>
  )
}
