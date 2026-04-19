import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification, type ExamSet, type ExamListItem } from '@/services/exam-api'
import { walletApi } from '@/services/wallet-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'
import { ExamSetHistoryModal } from '@/components/exam/exam-set-history-modal'
import { Link } from 'react-router-dom'

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

  // Purchase state
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [purchaseModal, setPurchaseModal] = useState<ExamSet | null>(null)

  // Modal state
  const [historyModal, setHistoryModal] = useState<{
    examSet: ExamSet
    history: ExamListItem[]
  } | null>(null)

  useEffect(() => {
    examApi
      .getCertifications()
      .then((certs) => {
        const sorted = [...certs].sort((a, b) => {
          const aSAA = a.code.toUpperCase().includes('SAA')
          const bSAA = b.code.toUpperCase().includes('SAA')
          if (aSAA && !bSAA) return -1
          if (!aSAA && bSAA) return 1
          return a.code.localeCompare(b.code)
        })
        setCertifications(sorted)
      })
      .catch(() => addToast({ type: 'error', message: t('exam.error_load') }))
      .finally(() => setLoading(false))

    // Fetch user balance
    walletApi.getWallet()
      .then(w => setUserBalance(w.balance))
      .catch(() => { }) // silent fail
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
      addToast({ type: 'error', message: t('exam.error_load_history') })
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
    } finally {
      setStartingId(null)
    }
  }

  const handlePurchase = async (examSet: ExamSet) => {
    setPurchasingId(examSet.id)
    setPurchaseModal(null)
    try {
      const result = await examApi.purchaseExamSet(examSet.id)
      // Update local state: mark set as unlocked
      setExamSets(prev => prev.map(s =>
        s.id === examSet.id ? { ...s, is_unlocked: true } : s
      ))
      setUserBalance(result.new_balance)
      addToast({ type: 'success', message: t('exam.purchase_success') })
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('Insufficient')) {
        addToast({ type: 'error', message: t('exam.purchase_insufficient') })
      } else {
        addToast({ type: 'error', message: t('exam.purchase_error') })
      }
    } finally {
      setPurchasingId(null)
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
      {purchaseModal && (
        <PurchaseModal
          examSet={purchaseModal}
          userBalance={userBalance ?? 0}
          onClose={() => setPurchaseModal(null)}
          onConfirm={handlePurchase}
          purchasing={purchasingId === purchaseModal.id}
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
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PageHeader title={selectedCert.name} subtitle={t('exam.select_set_subtitle')} />
                {userBalance !== null && (
                  <span style={{
                    fontSize: '12px', padding: '4px 12px', borderRadius: '100px',
                    background: 'rgba(255,149,0,0.15)', color: '#ff9500',
                    border: '1px solid rgba(255,149,0,0.2)', fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    {userBalance.toLocaleString()} {t('wallet.unit')}
                  </span>
                )}
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
                  const isAdminLocked = set.is_locked
                  const isFree = set.price_credits === 0
                  const isUnlocked = set.is_unlocked
                  const isPurchasable = !isAdminLocked && !isFree && !isUnlocked
                  const canStart = !isAdminLocked && isUnlocked

                  return (
                    <div
                      key={set.id}
                      style={{
                        ...cardStyle,
                        opacity: isAdminLocked ? 0.5 : 1,
                        cursor: isAdminLocked ? 'not-allowed' : 'pointer',
                        border: cardStyle.border,
                        background: cardStyle.background
                      }}
                      onClick={() => {
                        if (canStart) handleStart(set)
                        else if (isPurchasable) setPurchaseModal(set)
                      }}
                      className="hover-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>{set.name}</h4>
                          {!isAdminLocked && (
                            <div>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isFree ? 'rgba(29, 155, 94, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                                color: isFree ? '#1d9b5e' : '#ff9500',
                                border: isFree ? '1px solid rgba(29,155,94,0.2)' : '1px solid rgba(255,149,0,0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
                              }}>
                                {isFree ? t('exam.price_free') : `${set.price_credits.toLocaleString()} ${t('wallet.unit')}`}
                              </span>
                            </div>
                          )}
                        </div>
                        {isAdminLocked && (
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
                        disabled={isAdminLocked || startingId !== null || (purchasingId !== null)}
                        className={canStart ? "btn-primary" : "btn-secondary"}
                        style={{
                          width: '100%',
                          fontSize: '14px',
                          padding: '10px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (canStart) handleStart(set)
                          else if (isPurchasable) setPurchaseModal(set)
                        }}
                      >
                        {startingId === set.id
                          ? t('exam.starting')
                          : purchasingId === set.id
                            ? t('exam.purchasing')
                            : isAdminLocked
                              ? t('exam.locked')
                              : canStart
                                ? t('exam.start_button')
                                : `${t('exam.unlock_button')} (${set.price_credits.toLocaleString()} ${t('wallet.unit')})`
                        }
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

function PurchaseModal({ examSet, userBalance, onClose, onConfirm, purchasing }: {
  examSet: ExamSet
  userBalance: number
  onClose: () => void
  onConfirm: (set: ExamSet) => void
  purchasing: boolean
}) {
  const { t } = useTranslation()
  const hasEnough = userBalance >= examSet.price_credits

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, backdropFilter: 'blur(10px)'
  }

  const contentStyle: React.CSSProperties = {
    background: '#1d1d1f', borderRadius: '20px', width: '100%', maxWidth: '400px',
    padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative'
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '24px', textAlign: 'center' }}>
          {t('exam.purchase_modal_title')}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('exam.purchase_balance')}</span>
            <span style={{ fontWeight: 600 }}>{userBalance.toLocaleString()} {t('wallet.unit')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('exam.purchase_cost')}</span>
            <span style={{ fontWeight: 600, color: '#ff9500' }}>-{examSet.price_credits.toLocaleString()} {t('wallet.unit')}</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 600 }}>
            <span>{t('exam.purchase_balance_after')}</span>
            <span style={{ color: hasEnough ? '#1d9b5e' : '#e0453c' }}>
              {(userBalance - examSet.price_credits).toLocaleString()} {t('wallet.unit')}
            </span>
          </div>
        </div>

        {!hasEnough && (
          <div style={{
            background: 'rgba(224, 69, 60, 0.1)',
            border: '1px solid rgba(224, 69, 60, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#e0453c', marginBottom: '12px', lineHeight: 1.4 }}>
              {t('exam.purchase_insufficient_warning')}
            </p>
            <Link
              to="/wallet"
              style={{ fontSize: '14px', color: '#2997ff', fontWeight: 600, textDecoration: 'none' }}
              onClick={onClose}
            >
              {t('exam.topup_link')} →
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={!hasEnough || purchasing}
            onClick={() => onConfirm(examSet)}
          >
            {purchasing ? t('common.loading') : t('exam.confirm_unlock')}
          </button>
          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '12px' }}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
