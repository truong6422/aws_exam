import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        style={{ marginBottom: '8px' }}
      >
        <rect x="4" y="4" width="56" height="56" rx="1" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
        <path d="M20 32h24M32 20v24" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="square" />
        <path d="M22 22l20 20M42 22L22 42" stroke="#e0453c" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
      <h1
        style={{
          fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
          fontSize: '72px',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}
      >
        404
      </h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.224px' }}>
        Trang này không tồn tại.
      </p>
      <Link
        to="/dashboard"
        className="btn-primary"
        style={{ textDecoration: 'none', marginTop: '8px' }}
      >
        Quay lại Bảng điều khiển
      </Link>
    </div>
  )
}
