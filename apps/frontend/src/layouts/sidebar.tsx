import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useUiStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'

interface NavItem {
  label: string
  to: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: '🏠' },
  { label: 'Take Exam', to: '/exam/setup', icon: '📝' },
  { label: 'Practice', to: '/practice/setup', icon: '🎯' },
  { label: 'History', to: '/history', icon: '📋' },
  { label: 'Analytics', to: '/analytics', icon: '📊' },
]

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Admin', to: '/admin/dashboard', icon: '⚙️' },
  { label: 'Users', to: '/admin/users', icon: '👥' },
  { label: 'Questions', to: '/admin/questions', icon: '❓' },
  { label: 'Import', to: '/admin/import', icon: '📥' },
]

export default function Sidebar() {
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
      className={clsx(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-brand-900 text-white transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-brand-700 px-4">
        <span className="text-xl font-bold">{sidebarOpen ? '☁️ AWS Exam' : '☁️'}</span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={!sidebarOpen} />
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="my-2 border-t border-brand-700" />
            {ADMIN_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={!sidebarOpen} />
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-brand-700 p-3">
        {sidebarOpen && (
          <p className="mb-2 truncate text-xs text-brand-200">
            {user?.full_name ?? 'Guest'}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full rounded px-2 py-1.5 text-left text-sm text-brand-200 hover:bg-brand-700 hover:text-white"
        >
          {sidebarOpen ? '🚪 Logout' : '🚪'}
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-brand-200 hover:bg-brand-700 hover:text-white',
        )
      }
    >
      <span className="shrink-0 text-base">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}
