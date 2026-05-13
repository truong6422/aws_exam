import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DonateFabProps {
  onClick: () => void
}

export default function DonateFab({ onClick }: DonateFabProps) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={t('donate.open_donate')}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'linear-gradient(135deg, #607d8b, #90a4ae)',
        border: 'none',
        borderRadius: hovered ? '24px' : '20px',
        padding: hovered ? '10px 16px' : '10px',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(96, 125, 139, 0.4)',
        transition: 'all 0.25s ease',
        width: hovered ? 'auto' : '44px',
        height: '44px',
        justifyContent: 'center',
      }}
    >
      {/* Cốc trà đá icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M5 5h12l-1.5 14H6.5L5 5z"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.1)"
        />
        <path
          d="M5.5 9c0 2.5 2 4.5 5.5 4.5s5.5-2 5.5-4.5"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M4 5h14"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <ellipse cx="8.5" cy="13" rx="1.5" ry="1" fill="rgba(255,255,255,0.7)" />
        <ellipse cx="12" cy="14" rx="1.8" ry="1.2" fill="rgba(255,255,255,0.6)" />
        <ellipse cx="15" cy="12.5" rx="1.3" ry="0.9" fill="rgba(255,255,255,0.65)" />
        <path
          d="M16 3l2 7"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Text label */}
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#fff',
          letterSpacing: '-0.1px',
          whiteSpace: 'nowrap',
          opacity: hovered ? 1 : 0,
          width: hovered ? 'auto' : '0',
          overflow: 'hidden',
          transition: 'opacity 0.2s ease, width 0.2s ease',
        }}
      >
        {t('donate.buy_me_coffee')}
      </span>
    </button>
  )
}
