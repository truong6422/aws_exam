import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center">
      <span className="text-6xl">☁️</span>
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">This page doesn't exist.</p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
