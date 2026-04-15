interface Props {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

const EmptyIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="4" y="4" width="32" height="32" rx="1" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
    <path d="M13 20h14M20 13v14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
)

/** Reusable empty state with optional CTA — used across dashboard, analytics, history. */
export function EmptyState({ title, description, actionLabel, actionHref, onAction }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        background: '#272729',
        borderRadius: '12px',
      }}
    >
      <span style={{ marginBottom: '16px', opacity: 0.4 }}><EmptyIcon /></span>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '-0.224px',
          color: '#fff',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      {description && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', letterSpacing: '-0.224px', marginBottom: '24px', maxWidth: '360px' }}>
          {description}
        </p>
      )}
      {actionLabel && (actionHref || onAction) && (
        <a
          href={actionHref ?? '#'}
          onClick={onAction ? (e) => { e.preventDefault(); onAction() } : undefined}
          className="btn-primary"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          {actionLabel}
        </a>
      )}
    </div>
  )
}
