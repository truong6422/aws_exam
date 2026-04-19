import { useUiStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import LanguageSwitcher from '@/components/language-switcher'
import NotificationCenter from '@/components/notification-center'

/** Top navigation bar — Apple glass effect. */
export default function Navbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? 'G').toUpperCase()

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between px-6"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="transition-opacity hover:opacity-70"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* User info */}
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <LanguageSwitcher variant="navbar" />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.12px' }}>
          {user?.name ?? user?.email ?? 'Guest'}
        </span>
        <div
          className="flex h-7 w-7 items-center justify-center text-white"
          style={{
            background: '#0071e3',
            borderRadius: '50%',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '-0.12px',
          }}
        >
          {initial}
        </div>
      </div>
    </header>
  )
}
