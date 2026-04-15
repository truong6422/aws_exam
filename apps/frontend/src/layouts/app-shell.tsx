import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'
import Navbar from './navbar'
import ToastContainer from '@/components/ui/toast-container'
import { useUiStore } from '@/stores/ui-store'

/** Root shell: sidebar + top navbar + page outlet — Apple dark theme. */
export default function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#000' }}>
      <Sidebar />

      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '240px' : '60px' }}
      >
        <Navbar />

        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '32px 24px', background: '#000' }}
        >
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
