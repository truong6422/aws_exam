import { Outlet } from 'react-router-dom'

/** Admin sub-layout. */
export default function AdminLayout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
