import { Link } from 'react-router-dom'

/** Public landing page — hero + 2 CTA buttons. No auth required. */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-6 text-center">
      {/* Hero */}
      <div className="max-w-lg">
        <span className="text-6xl" aria-hidden="true">☁️</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          AWS Exam Lab
        </h1>
        <p className="mt-3 text-lg text-brand-100 sm:text-xl">
          Practice questions &amp; simulate real exams to ace your AWS certification.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
        <Link
          to="/practice/setup"
          className="rounded-xl border-2 border-white px-8 py-3 text-base font-semibold text-white hover:bg-white hover:text-brand-700 transition-colors"
        >
          🎯 Start Practice
        </Link>
        <Link
          to="/exam/setup"
          className="rounded-xl bg-white px-8 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
        >
          📝 Start Exam
        </Link>
      </div>

      {/* Secondary link to login */}
      <p className="mt-10 text-sm text-white/70">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-white underline hover:text-brand-100">
          Sign in
        </Link>
      </p>
    </div>
  )
}
