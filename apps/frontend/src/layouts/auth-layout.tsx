import { Outlet } from 'react-router-dom'

/** Minimal centered layout for login / register pages. */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <span className="text-4xl">☁️</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">AWS Exam App</h1>
          <p className="mt-1 text-sm text-gray-500">Practice makes perfect</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
