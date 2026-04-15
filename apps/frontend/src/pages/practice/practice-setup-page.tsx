/**
 * Practice Setup Page — certification picker with optional domain filter.
 * Starts a practice exam using the same backend start endpoint, mode tracked in store.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification, type Domain } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#242426',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: '#fff',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 400,
  letterSpacing: '-0.12px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '6px',
}

export default function PracticeSetupPage() {
  const navigate = useNavigate()
  const initSession = useExamStore((s) => s.initSession)
  const addToast = useUiStore((s) => s.addToast)

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedCertId, setSelectedCertId] = useState<number | ''>('')
  const [selectedDomainId, setSelectedDomainId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    examApi
      .getCertifications()
      .then((certs) => {
        setCertifications(certs)
        if (certs.length > 0) setSelectedCertId(certs[0].id)
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load certifications.' }))
      .finally(() => setLoading(false))
  }, [addToast])

  useEffect(() => {
    if (!selectedCertId) { setDomains([]); return }
    examApi
      .getDomains(selectedCertId as number)
      .then(setDomains)
      .catch(() => setDomains([]))
  }, [selectedCertId])

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCertId) return
    setStarting(true)
    try {
      const attempt = await examApi.startExam(selectedCertId as number)
      initSession(attempt.id, attempt.questions, attempt.time_remaining_seconds, 'practice')
      navigate(`/practice/${attempt.id}`)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || 'Failed to start practice.' })
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: '32px', height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#0071e3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Practice Mode"
        subtitle="Learn at your own pace with instant feedback"
      />

      <form
        onSubmit={handleStart}
        style={{
          background: '#272729',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Certification picker */}
        <div>
          <label style={labelStyle}>Certification</label>
          <select
            value={selectedCertId}
            onChange={(e) => { setSelectedCertId(Number(e.target.value)); setSelectedDomainId('') }}
            style={selectStyle}
            required
          >
            <option value="">Select a certification...</option>
            {certifications.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Domain filter */}
        {domains.length > 0 && (
          <div>
            <label style={labelStyle}>Domain (optional)</label>
            <select
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value ? Number(e.target.value) : '')}
              style={selectStyle}
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info banner */}
        <div
          style={{
            background: 'rgba(0,113,227,0.1)',
            border: '1px solid rgba(0,113,227,0.4)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#2997ff',
            letterSpacing: '-0.12px',
          }}
        >
          Explanations shown after each answer · No time limit · No score tracking
        </div>

        <button
          type="submit"
          disabled={starting || !selectedCertId}
          className="btn-primary"
          style={{ width: '100%', opacity: starting || !selectedCertId ? 0.6 : 1 }}
        >
          {starting ? 'Starting...' : 'Start Practice'}
        </button>
      </form>
    </div>
  )
}
