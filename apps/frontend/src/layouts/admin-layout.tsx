import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'

const ADMIN_TABS = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Questions', to: '/admin/questions' },
  { label: 'Import', to: '/admin/import' },
]

/** Admin sub-layout with horizontal tab navigation. */
export default function AdminLayout() {
  return (
    <div>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                clsx(
                  'border-b-2 pb-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
