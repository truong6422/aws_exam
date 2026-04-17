import { useEffect, useState } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { examApi, type ExamReview, type ReviewQuestion } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'

interface NavState {
  result?: {
    id: number
    score_percentage: number
    correct_count: number
    total_questions: number
    status: string
  }
}

type FilterMode = 'all' | 'correct' | 'wrong'

/** SVG donut chart */
function DonutChart({ score, passed }: { score: number; passed: boolean }) {
  const { t } = useTranslation()
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = circ * (score / 100)

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" stroke="rgba(255,255,255,0.08)" />
      <circle
        cx="60" cy="60" r={r} fill="none" strokeWidth="12"
        stroke={passed ? '#1d9b5e' : '#e0453c'}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x="60" y="56" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{Math.round(score)}%</text>
      <text x="60" y="72" textAnchor="middle" fill={passed ? '#1d9b5e' : '#e0453c'} fontSize="11" fontWeight="700">
        {passed ? t('exam.result_passed') : t('exam.result_failed')}
      </text>
    </svg>
  )
}

function isQuestionCorrect(q: ReviewQuestion, userAnswerIds: number[]): boolean {
  const correctIds = q.answers.filter((a) => a.is_correct).map((a) => a.id).sort().join(',')
  const selectedIds = [...userAnswerIds].sort().join(',')
  return correctIds === selectedIds && correctIds.length > 0
}

export default function ExamResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const clearSession = useExamStore((s) => s.clearSession)

  const navState = (location.state as NavState) ?? {}
  const [review, setReview] = useState<ExamReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [loadingReview, setLoadingReview] = useState(false)

  // Clear exam session from store on result page mount
  useEffect(() => {
    clearSession()
  }, [clearSession])

  // Always fetch review for full detail
  useEffect(() => {
    if (!sessionId) return
    const id = Number(sessionId)
    if (!id) { navigate('/exam/setup'); return }

    setLoadingReview(true)
    examApi
      .getExamReview(id)
      .then(setReview)
      .catch(() => { })
      .finally(() => { setLoadingReview(false); setLoading(false) })
  }, [sessionId, navigate])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const score = Number(navState.result?.score_percentage ?? review?.score_percentage ?? 0)
  const correct = navState.result?.correct_count ?? review?.correct_count ?? 0
  const total = navState.result?.total_questions ?? review?.total_questions ?? 0
  const wrong = total - correct
  const passed = score >= 72

  // Filtered questions
  const allQuestions = review?.questions ?? []
  const filteredQuestions = allQuestions.filter((q) => {
    const userAnswerIds = review?.user_answers[q.id] ?? []
    const isCorrect = isQuestionCorrect(q, userAnswerIds)
    if (filter === 'correct') return isCorrect
    if (filter === 'wrong') return !isCorrect
    return true
  })

  const panelStyle: React.CSSProperties = {
    background: '#272729',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.06)',
  }

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(0,113,227,0.15)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(0,113,227,0.5)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: active ? '#2997ff' : 'rgba(255,255,255,0.55)',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
  })

  return (
    <div style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      <PageHeader
        title={t('exam.result_title')}
        subtitle={review ? `${review.certification.code} — ${review.certification.name}` : t('history.preview', { id: sessionId })}
      />

      {/* Score hero + donut chart */}
      <div style={{
        ...panelStyle,
        background: passed ? 'rgba(29,155,94,0.08)' : 'rgba(224,69,60,0.08)',
        border: `1px solid ${passed ? 'rgba(29,155,94,0.25)' : 'rgba(224,69,60,0.25)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
        flexWrap: 'wrap',
      }}>
        <DonutChart score={score} passed={passed} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ ...panelStyle, padding: '12px 16px', flex: 1, minWidth: '100px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1d9b5e' }}>{correct}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{t('exam.correct_answers')}</p>
            </div>
            <div style={{ ...panelStyle, padding: '12px 16px', flex: 1, minWidth: '100px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#e0453c' }}>{wrong}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{t('exam.wrong_answers')}</p>
            </div>
            <div style={{ ...panelStyle, padding: '12px 16px', flex: 1, minWidth: '100px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{total}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{t('exam.total_questions_count')}</p>
            </div>
          </div>

          {/* Mini bar chart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score}%`, background: passed ? '#1d9b5e' : '#e0453c', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              {t('exam.passing_threshold', { score: 72 })}
            </span>
          </div>
        </div>
      </div>

      {/* Review section */}
      {!loadingReview && allQuestions.length > 0 && (
        <div style={panelStyle}>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.12px' }}>
              {t('exam.review_answers', { count: filteredQuestions.length, total: allQuestions.length })}
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>{t('exam.filter_all')}</button>
              <button style={filterBtnStyle(filter === 'correct')} onClick={() => setFilter('correct')}>
                ✓ {t('exam.filter_correct', { count: correct })}
              </button>
              <button style={filterBtnStyle(filter === 'wrong')} onClick={() => setFilter('wrong')}>
                ✕ {t('exam.filter_wrong', { count: wrong })}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredQuestions.length === 0 && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '24px' }}>
                {t('exam.no_questions_filter')}
              </p>
            )}
            {filteredQuestions.map((q, idx) => {
              const userAnswerIds = review?.user_answers[q.id] ?? []
              const isCorrect = isQuestionCorrect(q, userAnswerIds)

              return (
                <div
                  key={q.id}
                  style={{
                    border: `1px solid ${isCorrect ? 'rgba(29,155,94,0.2)' : 'rgba(224,69,60,0.2)'}`,
                    borderRadius: '10px',
                    padding: '16px',
                    background: isCorrect ? 'rgba(29,155,94,0.04)' : 'rgba(224,69,60,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap',
                      background: isCorrect ? 'rgba(29,155,94,0.15)' : 'rgba(224,69,60,0.15)',
                      color: isCorrect ? '#1d9b5e' : '#e0453c',
                      border: `1px solid ${isCorrect ? 'rgba(29,155,94,0.3)' : 'rgba(224,69,60,0.3)'}`,
                    }}>
                      {isCorrect ? `✓ ${t('exam.correct_badge')}` : `✕ ${t('exam.wrong_badge')}`}
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#fff', lineHeight: 1.5 }}>
                      {idx + 1}. {q.text}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '0' }}>
                    {q.answers.map((a) => {
                      const isUserPick = userAnswerIds.includes(a.id)
                      const isRight = a.is_correct

                      let bg = 'transparent'
                      let border = '1px solid rgba(255,255,255,0.08)'
                      let color = 'rgba(255,255,255,0.45)'
                      let prefix = '  '

                      if (isRight && isUserPick) { bg = 'rgba(29,155,94,0.12)'; border = '1px solid rgba(29,155,94,0.4)'; color = '#1d9b5e'; prefix = '✓ ' }
                      else if (isRight) { bg = 'rgba(29,155,94,0.06)'; border = '1px solid rgba(29,155,94,0.25)'; color = '#1d9b5e'; prefix = '✓ ' }
                      else if (isUserPick) { bg = 'rgba(224,69,60,0.1)'; border = '1px solid rgba(224,69,60,0.35)'; color = '#e0453c'; prefix = '✕ ' }

                      return (
                        <div
                          key={a.id}
                          style={{ background: bg, border, borderRadius: '7px', padding: '8px 12px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}
                        >
                          <span style={{ fontSize: '12px', color, fontWeight: isRight || isUserPick ? 600 : 400, flexShrink: 0 }}>{prefix}</span>
                          <span style={{ fontSize: '12px', color, lineHeight: 1.45 }}>{a.text}</span>
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <div style={{ marginTop: '10px', background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.25)', borderRadius: '8px', padding: '10px 12px' }}>
                      <p style={{ fontSize: '12px', color: '#2997ff', lineHeight: 1.5, letterSpacing: '-0.12px' }}>{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loadingReview && (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/exam/setup" className="btn-primary" style={{ textDecoration: 'none' }}>
          {t('exam.new_exam')}
        </Link>
        <Link to="/history" className="btn-ghost" style={{ textDecoration: 'none' }}>
          {t('exam.view_history')}
        </Link>
        <Link to="/dashboard" className="btn-ghost" style={{ textDecoration: 'none' }}>
          {t('nav.dashboard')}
        </Link>
      </div>
    </div>
  )
}
