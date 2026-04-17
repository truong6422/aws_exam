/**
 * Exam Setup Page — lists certifications from API and starts an exam on selection.
 * Fetches certifications on mount, shows cards with metadata, starts exam on click.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: '#272729',
  borderRadius: '12px',
  padding: '20px',
}

export default function ExamSetupPage() {
  const navigate = useNavigate()
  const initSession = useExamStore((s) => s.initSession)
  const addToast = useUiStore((s) => s.addToast)

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<number | null>(null)

  useEffect(() => {
    examApi
      .getCertifications()
      .then(setCertifications)
      .catch(() => addToast({ type: 'error', message: 'Không thể tải danh sách chứng chỉ.' }))
      .finally(() => setLoading(false))
  }, [addToast])

  const handleStart = async (cert: Certification) => {
    setStartingId(cert.id)
    try {
      const attempt = await examApi.startExam(cert.id)
      initSession(attempt.id, attempt.questions, attempt.time_remaining_seconds, 'exam')
      navigate(`/exam/${attempt.id}`)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || 'Không thể bắt đầu bài thi.' })
    } finally {
      setStartingId(null)
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
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title="Bài thi mới" subtitle="Chọn chứng chỉ để bắt đầu bài thi có giới hạn thời gian" />

      {certifications.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: '-0.224px' }}>Chưa có chứng chỉ nào.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {certifications.map((cert) => (
            <div key={cert.id} style={cardStyle}>
              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#0071e3',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '-0.12px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                  }}
                >
                  {cert.code}
                </span>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px', letterSpacing: '-0.224px' }}>
                  {cert.name}
                </h3>
                {cert.description && (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', letterSpacing: '-0.12px' }}>
                    {cert.description}
                  </p>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {[
                    `${cert.time_limit_minutes} phút`,
                    `${cert.total_questions} câu hỏi`,
                    `${cert.passing_score}% để đạt`,
                  ].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        letterSpacing: '-0.12px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleStart(cert)}
                  disabled={startingId !== null}
                  className="btn-primary"
                  style={{ width: '100%', opacity: startingId !== null ? 0.6 : 1 }}
                >
                  {startingId === cert.id ? 'Đang bắt đầu...' : 'Bắt đầu thi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
