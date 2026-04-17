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
      .catch(() => addToast({ type: 'error', message: 'Không thể tải danh sách chứng chỉ.' }))
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
      addToast({ type: 'error', message: (err as Error).message || 'Không thể bắt đầu luyện tập.' })
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
        title="Chế độ luyện tập"
        subtitle="Học theo tốc độ của bạn với phản hồi ngay lập tức"
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
          <label style={labelStyle}>Chứng chỉ</label>
          <select
            value={selectedCertId}
            onChange={(e) => { setSelectedCertId(Number(e.target.value)); setSelectedDomainId('') }}
            style={selectStyle}
            required
          >
            <option value="">Chọn chứng chỉ...</option>
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
            <label style={labelStyle}>Lĩnh vực (không bắt buộc)</label>
            <select
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value ? Number(e.target.value) : '')}
              style={selectStyle}
            >
              <option value="">Tất cả lĩnh vực</option>
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
          Giải thích được hiện sau mỗi câu trả lời · Không giới hạn thời gian · Không theo dõi điểm số
        </div>

        <button
          type="submit"
          disabled={starting || !selectedCertId}
          className="btn-primary"
          style={{ width: '100%', opacity: starting || !selectedCertId ? 0.6 : 1 }}
        >
          {starting ? 'Đang bắt đầu...' : 'Bắt đầu luyện tập'}
        </button>
      </form>
    </div>
  )
}
