import { useUiStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'

/** Top navigation bar with sidebar toggle and user info. */
export default function Navbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {user?.full_name ?? user?.email ?? 'Guest'}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {(user?.full_name?.[0] ?? user?.email?.[0] ?? 'G').toUpperCase()}
        </div>
      </div>
    </header>
  )
}
