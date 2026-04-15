interface PageHeaderProps {
  title: string
  subtitle?: string
}

/** Consistent page title + subtitle — Apple typography. */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1
        style={{
          fontFamily: "'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '28px',
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-0.28px',
          color: '#fff',
          margin: 0,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: '14px',
            letterSpacing: '-0.224px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '6px',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
