import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/language-switcher'

/** Immersive dark layout for login / register pages — Apple dark style. */
export default function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: '#000000' }}
    >
      <div
        className="w-full max-w-[400px]"
        style={{
          background: '#1d1d1f',
          borderRadius: '20px',
          padding: '52px 40px',
          boxShadow: 'rgba(0, 0, 0, 0.4) 0px 30px 60px -12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <svg
            width="44"
            height="44"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="mx-auto"
          >
            <rect x="3" y="13" width="34" height="18" rx="3" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <path d="M9 13 L20 5 L31 13" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <circle cx="12" cy="22" r="1.8" fill="#0071e3" />
            <circle cx="20" cy="22" r="1.8" fill="#0071e3" />
            <circle cx="28" cy="22" r="1.8" fill="#0071e3" />
          </svg>
          <h1
            className="mt-6"
            style={{
              fontFamily: "'SF Pro Display', sans-serif",
              fontSize: '28px',
              fontWeight: 600,
              lineHeight: 1.14,
              letterSpacing: '0.196px',
              color: '#ffffff',
            }}
          >
            AWS Exam Lab
          </h1>
          <p
            className="mt-2"
            style={{
              fontFamily: "'SF Pro Text', sans-serif",
              fontSize: '14px',
              letterSpacing: '-0.224px',
              color: 'rgba(255,255,255,0.48)',
              fontWeight: 400
            }}
          >
            {t('auth.subtitle')}
          </p>
        </div>
        <Outlet />
      </div>

      <LanguageSwitcher />
    </div>
  )
}
