import { Outlet } from 'react-router-dom'

/** Minimal centered layout for login / register pages — Apple light style. */
export default function AuthLayout() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: '#f5f5f7' }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '48px 40px',
          boxShadow: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
        }}
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="mx-auto"
          >
            <rect x="3" y="13" width="34" height="18" rx="3" stroke="#1d1d1f" strokeWidth="2" fill="none" />
            <path d="M9 13 L20 5 L31 13" stroke="#1d1d1f" strokeWidth="2" fill="none" strokeLinejoin="round" />
            <circle cx="12" cy="22" r="1.5" fill="#0071e3" />
            <circle cx="20" cy="22" r="1.5" fill="#0071e3" />
            <circle cx="28" cy="22" r="1.5" fill="#0071e3" />
          </svg>
          <h1
            className="mt-4"
            style={{
              fontFamily: "'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '28px',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.28px',
              color: '#1d1d1f',
            }}
          >
            AWS Exam Lab
          </h1>
          <p
            className="mt-2"
            style={{ fontSize: '14px', letterSpacing: '-0.224px', color: 'rgba(0,0,0,0.48)' }}
          >
            Practice makes perfect
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
