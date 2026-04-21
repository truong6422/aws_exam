import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'
import Navbar from './navbar'
import ToastContainer from '@/components/ui/toast-container'
import { useUiStore } from '@/stores/ui-store'
import { useIsMobile } from '@/hooks/use-is-mobile'

/** Root shell: sidebar + top navbar + page outlet — Apple dark theme. */
export default function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const mobileDrawerOpen = useUiStore((s) => s.mobileDrawerOpen)
  const closeMobileDrawer = useUiStore((s) => s.closeMobileDrawer)
  const isMobile = useIsMobile()

  const contentMargin = isMobile ? '0px' : sidebarOpen ? '240px' : '60px'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#000' }}>
      {/* Mobile backdrop */}
      {isMobile && mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      <Sidebar />

      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: contentMargin }}
      >
        <Navbar />

        <main
          className="flex-1 overflow-y-auto p-4 md:p-8"
          style={{ background: '#000' }}
        >
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
