import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'

/** Redirects non-admin users to /dashboard. */
export default function AdminRoute() {
  const user = useAuthStore((s) => s.user)
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
