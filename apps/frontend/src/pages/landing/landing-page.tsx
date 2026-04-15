import { Link } from 'react-router-dom'

/** Public landing page — Apple hero on pure black. */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center">
      {/* AWS icon — minimal SVG */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="mb-8"
      >
        <rect x="4" y="16" width="40" height="20" rx="2" stroke="white" strokeWidth="2" fill="none" />
        <path d="M12 16 L24 8 L36 16" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="16" cy="26" r="2" fill="#0071e3" />
        <circle cx="24" cy="26" r="2" fill="#0071e3" />
        <circle cx="32" cy="26" r="2" fill="#0071e3" />
      </svg>

      {/* Headline */}
      <h1
        style={{
          fontFamily: "'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 600,
          fontSize: '56px',
          lineHeight: 1.07,
          letterSpacing: '-0.28px',
          color: '#fff',
        }}
      >
        AWS Exam Lab
      </h1>

      {/* Subtitle */}
      <p
        className="mt-4"
        style={{
          fontSize: '17px',
          letterSpacing: '-0.374px',
          lineHeight: 1.47,
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '480px',
        }}
      >
        Practice questions &amp; simulate real exams
      </p>

      {/* Divider */}
      <div className="mt-10 w-px h-12 bg-white/20" />

      {/* CTAs */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
        <Link
          to="/practice/setup"
          className="btn-ghost"
          style={{ minWidth: '160px', display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}
        >
          Start Practice
        </Link>
        <Link
          to="/exam/setup"
          className="btn-primary"
          style={{ minWidth: '160px', display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}
        >
          Start Exam
        </Link>
      </div>

      {/* Sign in link */}
      <p
        className="mt-12"
        style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.224px' }}
      >
        Already have an account?{' '}
        <Link
          to="/login"
          style={{ color: '#2997ff', textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
