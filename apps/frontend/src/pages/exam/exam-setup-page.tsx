import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification, type ExamSet, type ExamListItem } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'
import { ExamSetHistoryModal } from '@/components/exam/exam-set-history-modal'

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: 'rgba(39, 39, 41, 0.7)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
}

const lockIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
)



export default function ExamSetupPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const initSession = useExamStore((s) => s.initSession)
  const addToast = useUiStore((s) => s.addToast)

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSets, setLoadingSets] = useState(false)
  const [startingId, setStartingId] = useState<number | null>(null)

  // Modal state
  const [historyModal, setHistoryModal] = useState<{
    examSet: ExamSet
    history: ExamListItem[]
  } | null>(null)

  useEffect(() => {
    examApi
      .getCertifications()
      .then(setCertifications)
      .catch(() => addToast({ type: 'error', message: t('exam.error_load') }))
      .finally(() => setLoading(false))
  }, [addToast, t])

  const handleSelectCert = async (cert: Certification) => {
    setSelectedCert(cert)
    setLoadingSets(true)
    try {
      const sets = await examApi.getExamSets(cert.id)
      setExamSets(sets)
    } catch (err) {
      addToast({ type: 'error', message: t('exam.error_load_sets') })
    } finally {
      setLoadingSets(false)
    }
  }

  const handleSelectExamSet = async (examSet: ExamSet) => {
    if (examSet.is_locked) {
      addToast({ type: 'error', message: t('exam.set_locked_error') })
      return
    }
    // Lấy lịch sử và LUÔN hiển thị modal (dù lịch sử = 0)
    try {
      const historyList = await examApi.getExamSetHistory(examSet.id)
      setHistoryModal({ examSet, history: historyList })
    } catch (err) {
      addToast({ type: 'error', message: 'Lỗi tải lịch sử thi.' })
    }
  }

  const doStartExam = async (examSet: ExamSet) => {
    setStartingId(examSet.id)
    setHistoryModal(null)
    try {
      const attempt = await examApi.startExam(null, examSet.id)
      initSession(
        attempt.id,
        attempt.questions,
        attempt.time_remaining_seconds,
        'exam',
        attempt.user_answers,
        attempt.flagged_ids,
      )
      navigate(`/exam/${attempt.id}`)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || t('exam.error_start') })
    } finally {
      setStartingId(null)
    }
  }

  // Keep old handleStart for backward compat (used if we remove the modal)
  const handleStart = handleSelectExamSet

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
    <>
      {historyModal && (
        <ExamSetHistoryModal
          examSet={historyModal.examSet}
          history={historyModal.history}
          onClose={() => setHistoryModal(null)}
          onStartNew={() => doStartExam(historyModal.examSet)}
          loadingStart={startingId === historyModal.examSet.id}
        />
      )}
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
        {!selectedCert ? (
          <>
            <PageHeader title={t('exam.setup_title')} subtitle={t('exam.setup_subtitle')} />
            {certifications.length === 0 ? (
              <div style={cardStyle}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: '-0.224px' }}>
                  {t('exam.no_certifications')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    style={{ ...cardStyle, cursor: 'pointer' }}
                    onClick={() => handleSelectCert(cert)}
                    className="hover-card group"
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#0071e3',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            marginBottom: '12px',
                            boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
                          }}
                        >
                          {cert.code}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px', letterSpacing: '-0.4px' }}>
                        {cert.name}
                      </h3>
                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                        {t('exam.click_to_view_sets')}
                      </p>
                    </div>
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#0071e3',
                      fontSize: '13px',
                      fontWeight: 500
                    }}>
                      <span>{t('common.view_all')}</span>
                      <span style={{ transition: 'transform 0.2s ease' }} className="group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '-16px' }}>
              <button
                onClick={() => setSelectedCert(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                ← {t('common.back')}
              </button>
              <div style={{ flex: 1 }}>
                <PageHeader title={selectedCert.name} subtitle={t('exam.select_set_subtitle')} />
              </div>
            </div>

            {loadingSets ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div className="spinner-small" />
              </div>
            ) : examSets.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '60px' }}>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)' }}>
                  {t('exam.no_sets_available')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {examSets.map((set) => {
                  const isLocked = set.is_locked
                  const canEnter = !isLocked

                  return (
                    <div
                      key={set.id}
                      style={{
                        ...cardStyle,
                        opacity: isLocked ? 0.5 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        border: cardStyle.border,
                        background: cardStyle.background
                      }}
                      onClick={() => canEnter && handleStart(set)}
                      className="hover-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>{set.name}</h4>
                        {isLocked && (
                          <div style={{
                            color: 'rgba(255,255,255,0.3)',
                            padding: '4px',
                            background: 'transparent',
                            borderRadius: '6px'
                          }}>
                            {lockIcon}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.5)',
                          background: 'rgba(255,255,255,0.04)',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {t('exam.questions_count', { count: set.question_count })}
                        </div>
                      </div>

                      <button
                        disabled={(!canEnter) || startingId !== null}
                        className={isLocked ? "btn-secondary" : "btn-primary"}
                        style={{
                          width: '100%',
                          fontSize: '14px',
                          padding: '10px'
                        }}
                      >
                        {startingId === set.id ? t('exam.starting') : (isLocked ? t('exam.locked') : t('exam.start_button'))}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
