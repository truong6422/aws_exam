import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/auth-api'
import { useAuthStore } from '@/stores/auth-store'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid rgba(0,0,0,0.2)',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '14px',
  color: '#1d1d1f',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 400,
  letterSpacing: '-0.12px',
  color: 'rgba(0,0,0,0.48)',
  marginBottom: '6px',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            border: '1px solid #e0453c',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#e0453c',
            background: '#fff5f4',
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ ...inputStyle, color: '#1d1d1f' }}
          className="transition-colors"
          onFocus={(e) => { e.target.style.borderColor = '#0071e3' }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.2)' }}
        />
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = '#0071e3' }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.2)' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
        style={{ marginTop: '8px' }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p
        className="text-center"
        style={{ fontSize: '13px', color: 'rgba(0,0,0,0.48)', letterSpacing: '-0.12px' }}
      >
        No account?{' '}
        <Link
          to="/register"
          style={{ color: '#0066cc', fontWeight: 500 }}
        >
          Register
        </Link>
      </p>
    </form>
  )
}
