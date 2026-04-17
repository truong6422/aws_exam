import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/services/auth-api'
import { useAuthStore } from '@/stores/auth-store'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#2c2c2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '15px',
  color: '#ffffff',
  outline: 'none',
  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '-0.12px',
  color: 'rgba(255,255,255,0.56)',
  marginBottom: '8px',
  fontFamily: "'SF Pro Text', sans-serif",
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setTokens, setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getErrorKey = (msg: string, context: 'login' | 'register' = 'login'): string => {
    const m = msg.toLowerCase()
    if (m.includes('no active account') || m.includes('invalid') || m.includes('credentials') || m.includes('401'))
      return 'auth.errors.invalid_credentials'
    if (m.includes('network') || m.includes('failed to fetch'))
      return 'auth.errors.network_error'
    if (m.includes('too many') || m.includes('throttle') || m.includes('429'))
      return 'auth.errors.too_many_requests'
    if (m.includes('already exist') || m.includes('email') && m.includes('exist'))
      return 'auth.errors.email_taken'
    if (m.includes('too short') || m.includes('at least 8'))
      return 'auth.errors.password_too_short'
    if (m.includes('too common') || m.includes('entirely numeric'))
      return 'auth.errors.password_too_common'
    if (!msg || m.includes('500') || m.includes('server'))
      return 'auth.errors.server_error'
    return context === 'register' ? 'auth.errors.register_failed' : 'auth.errors.login_failed'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await authApi.login({ email, password })
      setTokens(data.access, data.refresh)

      try {
        const user = await authApi.getMe()
        setUser(user)
      } catch {
        // Non-critical
      }

      navigate('/dashboard', { replace: true })
    } catch (err) {
      const raw = err instanceof Error ? err.message : ''
      setError(t(getErrorKey(raw, 'login')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            border: 'none',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            color: '#e0453c',
            background: 'rgba(224, 69, 60, 0.08)',
            fontFamily: "'SF Pro Text', sans-serif",
            fontWeight: 400,
          }}
        >
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" style={labelStyle}>{t('auth.email')}</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
          className="transition-all"
          onFocus={(e) => {
            e.target.style.borderColor = '#0071e3'
            e.target.style.boxShadow = '0 0 0 4px rgba(0, 113, 227, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(0,0,0,0.15)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>{t('auth.password')}</label>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#0071e3'
            e.target.style.boxShadow = '0 0 0 4px rgba(0, 113, 227, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(0,0,0,0.15)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
        style={{
          marginTop: '12px',
          height: '44px',
          fontSize: '15px',
          fontWeight: 600,
          borderRadius: '10px'
        }}
      >
        {loading ? t('auth.login_loading') : t('auth.login_button')}
      </button>

      <p
        className="text-center"
        style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.48)',
          letterSpacing: '-0.224px',
          fontFamily: "'SF Pro Text', sans-serif"
        }}
      >
        {t('auth.no_account')}{' '}
        <Link
          to="/register"
          style={{ color: '#2997ff', fontWeight: 500, textDecoration: 'none' }}
          className="hover:underline"
        >
          {t('auth.register_link')}
        </Link>
      </p>
    </form>
  )
}
