import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'
import Navbar from './navbar'
import ToastContainer from '@/components/ui/toast-container'
import { useUiStore } from '@/stores/ui-store'
import clsx from 'clsx'

/** Root shell: sidebar + top navbar + page outlet. */
export default function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      {/* Main content area shifts with sidebar */}
      <div
        className={clsx(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16',
        )}
      >
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
