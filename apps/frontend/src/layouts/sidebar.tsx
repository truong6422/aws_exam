import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'

interface NavItem {
  labelKey: string
  to: string
  icon: React.ReactNode
}

const DashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
)

const ExamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
)

const PracticeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="8" r="2" fill="currentColor" />
  </svg>
)

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 13 L5 8 L8 10 L11 5 L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" fill="none" />
  </svg>
)

const AdminIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
  </svg>
)

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 10c1.66 0 3 1.34 3 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
)



const ImportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    <path d="M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
)

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 2H2v12h4M10 5l4 3-4 3M6 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
)

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: <DashIcon /> },
  { labelKey: 'nav.exam', to: '/exam/setup', icon: <ExamIcon /> },
  { labelKey: 'nav.practice', to: '/practice/setup', icon: <PracticeIcon /> },
  { labelKey: 'nav.history', to: '/history', icon: <HistoryIcon /> },
  { labelKey: 'nav.analytics', to: '/analytics', icon: <AnalyticsIcon /> },
]

const ADMIN_ITEMS: NavItem[] = [
  { labelKey: 'nav.admin', to: '/admin/dashboard', icon: <AdminIcon /> },
  { labelKey: 'nav.exam', to: '/admin/exams', icon: <ExamIcon /> },
  { labelKey: 'nav.users', to: '/admin/users', icon: <UsersIcon /> },
  { labelKey: 'nav.import', to: '/admin/import', icon: <ImportIcon /> },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300"
      style={{
        width: sidebarOpen ? '240px' : '60px',
        background: '#000',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-12 items-center justify-center"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 16px' }}
      >
        {sidebarOpen ? (
          <span
            style={{
              fontFamily: "'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '-0.28px',
              color: '#fff',
            }}
          >
            AWS Exam Lab
          </span>
        ) : (
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#0071e3' }}>A</span>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4" style={{ padding: '16px 8px' }}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={!sidebarOpen} />
        ))}

        {user?.is_staff && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />
            {ADMIN_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={!sidebarOpen} />
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 8px' }}>
        {sidebarOpen && (
          <p
            className="mb-2 truncate"
            style={{ fontSize: '11px', letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.4)', padding: '0 8px' }}
          >
            {user?.name ?? user?.email ?? 'Guest'}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 transition-opacity hover:opacity-70"
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '8px',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '13px',
            letterSpacing: '-0.12px',
          }}
        >
          <span className="shrink-0"><LogoutIcon /></span>
          {sidebarOpen && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation()
  return (
    <NavLink
      to={item.to}
      className="flex items-center gap-3 transition-opacity"
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '9px 8px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: isActive ? 500 : 400,
        letterSpacing: '-0.12px',
        color: isActive ? '#2997ff' : 'rgba(255,255,255,0.6)',
        background: isActive ? 'rgba(0,113,227,0.15)' : 'transparent',
        textDecoration: 'none',
        marginBottom: '2px',
      })}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
    </NavLink>
  )
}
