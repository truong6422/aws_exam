import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExamStore } from '@/stores/exam-store'
import { useExamTimer } from '@/hooks/use-exam-timer'
import { useAutosave } from '@/hooks/use-autosave'
import { examApi } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'
import { ExamTimer } from '@/components/exam/exam-timer'
import { QuestionNavigationGrid } from '@/components/exam/question-navigation-grid'
import { AnswerOption } from '@/components/exam/answer-option'
import { useTranslation } from 'react-i18next'

const panelStyle: React.CSSProperties = {
  background: '#272729',
  borderRadius: '12px',
  padding: '16px',
}

const sidebarPanelStyle: React.CSSProperties = {
  background: '#272729',
  borderRadius: '12px',
  padding: '16px',
}

export default function ExamSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)

  const {
    attemptId, questions, answers, flagged,
    currentIndex, timeRemaining,
    initSession, updateAnswer, toggleFlag,
    goToQuestion, getAnswersAsPartial,
  } = useExamStore()

  const [submitting, setSubmitting] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [loading, setLoading] = useState(false)

  // On mount: if questions missing (refresh or direct link), resume session
  useEffect(() => {
    const id = Number(sessionId)
    if (!id) { navigate('/exam/setup'); return }

    if (questions.length === 0 || attemptId !== id) {
      setLoading(true)
      examApi.resumeExam(id)
        .then((attempt) => {
          initSession(
            attempt.id,
            attempt.questions,
            attempt.time_remaining_seconds,
            'exam',
            attempt.user_answers,
            attempt.flagged_ids
          )
        })
        .catch(() => {
          addToast({ type: 'error', message: t('exam.error_resume') })
          navigate('/exam/setup')
        })
        .finally(() => setLoading(false))
    }
  }, [sessionId, questions.length, attemptId, navigate, initSession, addToast, t])

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return
    const id = attemptId ?? Number(sessionId)
    if (!id) return
    setSubmitting(true)
    try {
      const result = await examApi.submitExam(id, getAnswersAsPartial())
      navigate(`/exam/${id}/result`, { state: { result } })
    } catch (err) {
      if (!auto) addToast({ type: 'error', message: (err as Error).message || t('exam.error_submit') })
    } finally {
      setSubmitting(false)
    }
  }, [submitting, attemptId, sessionId, getAnswersAsPartial, navigate, addToast, t])

  const handlePause = async () => {
    if (pausing || !attemptId) return
    setPausing(true)
    try {
      await examApi.pauseExam(attemptId, getAnswersAsPartial())
      addToast({ type: 'success', message: t('exam.success_pause') })
      navigate('/dashboard')
    } catch (err) {
      addToast({ type: 'error', message: t('exam.error_pause') })
    } finally {
      setPausing(false)
    }
  }

  const handleTimeUp = useCallback(() => handleSubmit(true), [handleSubmit])

  const { minutes, seconds, isWarning, isCritical } = useExamTimer(
    timeRemaining,
    handleTimeUp,
  )
  const { isSaving } = useAutosave(attemptId)

  // IMPLICIT PAUSE: Save and pause when closing tab or navigating away
  useEffect(() => {
    // Clear any pending pause from Strict Mode unmount
    if ((window as any).__pauseTimeout) {
      clearTimeout((window as any).__pauseTimeout);
      (window as any).__pauseTimeout = null;
    }

    const handlePauseImplicitly = () => {
      if (attemptId) {
        try {
          const raw = localStorage.getItem('aws-exam-auth')
          const parsed = raw ? JSON.parse(raw) : null
          const token = parsed?.state?.token
          if (token) {
            const data = JSON.stringify(getAnswersAsPartial())
            fetch(`/api/v1/exams/${attemptId}/pause/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: data,
              keepalive: true
            }).catch(() => { })
          }
        } catch (e) { }
      }
    }

    const handleBeforeUnload = () => handlePauseImplicitly()
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Delay implicit pause by 200ms to allow remount detection (Strict Mode)
      (window as any).__pauseTimeout = setTimeout(() => {
        handlePauseImplicitly();
        (window as any).__pauseTimeout = null;
      }, 200);
    }
  }, [attemptId, getAnswersAsPartial])

  const question = questions[currentIndex]
  const questionIds = questions.map((q) => q.id)
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length

  const handleAnswerSelect = (answerId: number) => {
    if (!question) return
    const current = answers[question.id] ?? []
    if (question.question_type === 'single') {
      updateAnswer(question.id, [answerId])
    } else {
      const next = current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId]
      updateAnswer(question.id, next)
    }
  }

  if (loading || !question) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner-small" />
      </div>
    )
  }

  const isFlagged = flagged.includes(question.id)
  const selectedAnswers = answers[question.id] ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>

      {/* Unified Top Header — FIX REPETITION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#272729',
        borderRadius: '12px',
        padding: '12px 20px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handlePause}
            disabled={pausing}
            style={{
              background: 'rgba(255, 159, 10, 0.15)',
              color: '#ff9f0a',
              border: '1px solid rgba(255, 159, 10, 0.3)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {pausing ? t('exam.pausing') : t('exam.pause_button')}
          </button>
          {isSaving && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{t('exam.autosaving')}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>{t('exam.time_remaining')}</span>
            <ExamTimer minutes={minutes} seconds={seconds} isWarning={isWarning} isCritical={isCritical} />
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>{t('exam.progress')}</span>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>{answeredCount} / {questions.length}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '16px', overflow: 'hidden' }}>
        {/* Sidebar — ONLY NAVIGATION */}
        <aside style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }} className="hidden lg:flex">
          <div style={{ ...sidebarPanelStyle, padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              {t('exam.question_navigation')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <QuestionNavigationGrid
                totalQuestions={questions.length}
                currentIndex={currentIndex}
                answers={answers}
                flagged={flagged}
                questionIds={questionIds}
                onSelectQuestion={goToQuestion}
              />
            </div>
          </div>

          <button
            onClick={() => setConfirmSubmit(true)}
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {t('exam.finish_button')}
          </button>
        </aside>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Question card */}
          <div style={{ ...panelStyle, padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                {t('exam.question_pos', { current: currentIndex + 1, total: questions.length })}
                {question.question_type === 'multiple' && (
                  <span
                    style={{
                      marginLeft: '12px',
                      fontSize: '11px',
                      background: 'rgba(0,113,227,0.1)',
                      color: '#2997ff',
                      border: '1px solid rgba(0,113,227,0.4)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}
                  >
                    {t('exam.multi_choice_label')}
                  </span>
                )}
              </span>
              <button
                onClick={() => toggleFlag(question.id)}
                style={{
                  background: isFlagged ? 'rgba(224, 69, 60, 0.1)' : 'transparent',
                  border: isFlagged ? '1px solid #e0453c' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isFlagged ? '#e0453c' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isFlagged ? t('exam.flagged_badge') : t('exam.flag_question')}
              </button>
            </div>
            <p style={{ fontSize: '18px', fontWeight: 400, color: '#fff', lineHeight: 1.55, letterSpacing: '-0.2px' }}>{question.text}</p>
          </div>

          {/* Answers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {question.answers.map((answer) => (
              <AnswerOption
                key={answer.id}
                answer={answer}
                isSelected={selectedAnswers.includes(answer.id)}
                questionType={question.question_type}
                onSelect={handleAnswerSelect}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingBottom: '20px' }}>
            <button
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="btn-ghost"
              style={{ opacity: currentIndex === 0 ? 0.4 : 1, padding: '10px 20px' }}
            >
              {t('exam.prev_question')}
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                className="btn-ghost"
                style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)' }}
              >
                {t('exam.next_question')}
              </button>
            ) : (
              <button
                onClick={() => setConfirmSubmit(true)}
                disabled={submitting}
                className="btn-primary"
                style={{ padding: '10px 30px' }}
              >
                {t('exam.finish_submit')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm submit dialog */}
      {confirmSubmit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#1c1c1e',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{t('exam.confirm_submit_title')}</h3>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '24px' }}>
              {t('exam.confirm_submit_desc', { answered: answeredCount, total: questions.length })}
              {answeredCount < questions.length && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(224, 69, 60, 0.1)', borderRadius: '10px', color: '#ff453a', fontSize: '13px', fontWeight: 500 }}>
                  ⚠️ {t('exam.unanswered_warning', { count: questions.length - answeredCount })}
                </div>
              )}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setConfirmSubmit(false); handleSubmit() }}
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', padding: '14px' }}
              >
                {submitting ? t('exam.submitting') : t('exam.confirm_submit_button')}
              </button>
              <button
                onClick={() => setConfirmSubmit(false)}
                className="btn-ghost"
                style={{ width: '100%', padding: '12px' }}
              >
                {t('exam.back_to_exam')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
