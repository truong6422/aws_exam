import { NavLink, Outlet } from 'react-router-dom'

const ADMIN_TABS = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Questions', to: '/admin/questions' },
  { label: 'Import', to: '/admin/import' },
]

/** Admin sub-layout with horizontal tab navigation — Apple style. */
export default function AdminLayout() {
  return (
    <div>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <nav style={{ display: 'flex', gap: '0', marginBottom: '-1px' }}>
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              style={({ isActive }) => ({
                display: 'inline-block',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 400,
                letterSpacing: '-0.224px',
                textDecoration: 'none',
                borderBottom: isActive ? '2px solid #0071e3' : '2px solid transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                transition: 'color 0.15s, border-color 0.15s',
              })}
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
