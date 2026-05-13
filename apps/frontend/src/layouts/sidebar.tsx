import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useIsMobile } from '@/hooks/use-is-mobile'

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

// WALLET_FEATURE: const WalletIcon = () => (
//   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//     <rect x="1" y="3" width="14" height="10" rx="2" ry="2" fill="none" />
//     <line x1="1" y1="7" x2="15" y2="7" />
//   </svg>
// )

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 5a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.5 8.7a1.5 1.5 0 000-1.4l-.8-.6c-.2-.2-.3-.5-.2-.8l.2-1c0-.4-.2-.8-.6-.9l-.9-.2c-.3 0-.6-.3-.7-.5l-.6-.8a1 1 0 00-1.4 0l-.6.8c-.1.2-.4.4-.7.5l-1 .2c-.4 0-.7.4-.8.8l-.2 1c0 .3-.1.6-.3.8l-.8.6a1 1 0 000 1.4l.8.6c.2.2.3.5.2.8l-.2 1c0 .4.2.8.6.9l.9.2c.3 0 .6.3.7.5l.6.8a1 1 0 001.4 0l.6-.8c.1-.2.4-.4.7-.5l1-.2c.4 0 .7-.4.8-.8l.2-1c0-.3.1-.6.3-.8l.8-.6z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const FeedbackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
)

const NotificationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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
  // WALLET_FEATURE: { labelKey: 'nav.wallet', to: '/wallet', icon: <WalletIcon /> },
  { labelKey: 'nav.chat', to: '/chat', icon: <ChatIcon /> },
]

const ADMIN_ITEMS: NavItem[] = [
  { labelKey: 'nav.admin', to: '/admin/dashboard', icon: <AdminIcon /> },
  { labelKey: 'nav.exam', to: '/admin/exams', icon: <ExamIcon /> },
  // WALLET_FEATURE: { labelKey: 'nav.wallet', to: '/admin/wallet', icon: <WalletIcon /> },
  { labelKey: 'nav.feedback', to: '/admin/feedback', icon: <FeedbackIcon /> },
  { labelKey: 'nav.notifications', to: '/admin/notifications', icon: <NotificationIcon /> },
  { labelKey: 'nav.chat', to: '/admin/chat', icon: <ChatIcon /> },
  { labelKey: 'nav.settings', to: '/admin/settings', icon: <SettingsIcon /> },
  { labelKey: 'nav.users', to: '/admin/users', icon: <UsersIcon /> },
  { labelKey: 'nav.import', to: '/admin/import', icon: <ImportIcon /> },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const mobileDrawerOpen = useUiStore((s) => s.mobileDrawerOpen)
  const closeMobileDrawer = useUiStore((s) => s.closeMobileDrawer)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const isMobile = useIsMobile()
  const location = useLocation()

  // Close drawer on route change (mobile only)
  useEffect(() => {
    if (isMobile) closeMobileDrawer()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Mobile: full-width drawer (280px), translate based on mobileDrawerOpen
  // Desktop: push sidebar, width based on sidebarOpen
  const sidebarWidth = isMobile ? '280px' : sidebarOpen ? '240px' : '60px'
  const translateX = isMobile && !mobileDrawerOpen ? '-100%' : '0'
  // On mobile always show labels (not collapsed); on desktop respect sidebarOpen
  const collapsed = isMobile ? false : !sidebarOpen

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300"
      style={{
        width: sidebarWidth,
        transform: `translateX(${translateX})`,
        background: '#000',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-12 items-center justify-center"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 16px' }}
      >
        {!collapsed ? (
          <span
            style={{
              fontFamily: "'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '-0.28px',
              color: '#fff',
            }}
          >
            TruonglbCloud
          </span>
        ) : (
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#0071e3' }}>A</span>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4" style={{ padding: '16px 8px' }}>
        {NAV_ITEMS.filter(item => {
          if (!user) {
            return item.to === '/practice/setup' || item.to === '/exam/setup'
          }
          return true
        }).map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}

        {user?.is_staff && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />
            {ADMIN_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* User info + logout/login */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 8px' }}>
        {!collapsed && (
          <p
            className="mb-2 truncate"
            style={{ fontSize: '11px', letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.4)', padding: '0 8px' }}
          >
            {user?.name ?? user?.email ?? t('auth.guest_user', 'Khách')}
          </p>
        )}
        {user ? (
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
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex w-full items-center gap-3 transition-opacity hover:opacity-70"
            style={{
              background: '#0071e3',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '-0.12px',
            }}
          >
            <span className="shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2a3 3 0 100 6 3 3 0 000-6zM3 13.5c0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            {!collapsed && <span>{t('auth.login_link')}</span>}
          </button>
        )}
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
