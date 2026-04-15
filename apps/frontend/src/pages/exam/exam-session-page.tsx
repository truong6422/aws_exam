/**
 * Exam Session Page — full exam UI with timer, navigation grid, autosave.
 * Reads attemptId from URL :sessionId param (matches route /exam/:sessionId).
 * If no questions in store (page refresh), re-fetches from backend is not
 * supported — redirects to setup. Users must complete in one session or
 * resume via the persisted store (attemptId + answers survive refresh).
 */
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
  const addToast = useUiStore((s) => s.addToast)

  const {
    attemptId, questions, answers, flagged,
    currentIndex, timeRemaining,
    updateAnswer, toggleFlag,
    goToQuestion, getAnswersAsPartial,
  } = useExamStore()

  const [submitting, setSubmitting] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  // On mount: if questions not in store (refresh), re-fetch attempt
  useEffect(() => {
    const id = Number(sessionId)
    if (!id) { navigate('/exam/setup'); return }

    // If no questions in store (hard refresh), redirect to setup
    if (questions.length === 0 && attemptId !== id) {
      navigate('/exam/setup')
    }
  }, [sessionId, questions.length, attemptId, navigate])

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return
    const id = attemptId ?? Number(sessionId)
    if (!id) return
    setSubmitting(true)
    try {
      const result = await examApi.submitExam(id, getAnswersAsPartial())
      navigate(`/exam/${id}/result`, { state: { result } })
    } catch (err) {
      if (!auto) addToast({ type: 'error', message: (err as Error).message || 'Submit failed.' })
    } finally {
      setSubmitting(false)
    }
  }, [submitting, attemptId, sessionId, getAnswersAsPartial, navigate, addToast])

  const handleTimeUp = useCallback(() => handleSubmit(true), [handleSubmit])

  const { minutes, seconds, isWarning, isCritical } = useExamTimer(
    timeRemaining,
    handleTimeUp,
  )
  const { isSaving } = useAutosave(attemptId)

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

  if (!question) {
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

  const isFlagged = flagged.includes(question.id)
  const selectedAnswers = answers[question.id] ?? []

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      {/* Sidebar */}
      <aside style={{ width: '200px', flexShrink: 0, flexDirection: 'column', gap: '12px' }} className="hidden lg:flex">
        <div style={{ ...sidebarPanelStyle, textAlign: 'center' }}>
          <ExamTimer minutes={minutes} seconds={seconds} isWarning={isWarning} isCritical={isCritical} />
          {isSaving && (
            <p style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.12px' }}>Saving...</p>
          )}
        </div>

        <div style={{ ...sidebarPanelStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', fontSize: '11px', fontWeight: 600, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)' }}>
            {answeredCount} / {questions.length} answered
          </div>
          <QuestionNavigationGrid
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            flagged={flagged}
            questionIds={questionIds}
            onSelectQuestion={goToQuestion}
          />
        </div>

        <button
          onClick={() => setConfirmSubmit(true)}
          disabled={submitting}
          className="btn-primary"
          style={{ width: '100%', opacity: submitting ? 0.6 : 1 }}
        >
          Submit Exam
        </button>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        {/* Mobile timer bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...sidebarPanelStyle,
          }}
          className="lg:hidden"
        >
          <ExamTimer minutes={minutes} seconds={seconds} isWarning={isWarning} isCritical={isCritical} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.12px' }}>{answeredCount}/{questions.length} answered</span>
        </div>

        {/* Question card */}
        <div style={{ ...panelStyle, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)' }}>
              Question {currentIndex + 1} of {questions.length}
              {question.question_type === 'multiple' && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    background: 'rgba(0,113,227,0.1)',
                    color: '#2997ff',
                    border: '1px solid rgba(0,113,227,0.4)',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    letterSpacing: '-0.12px',
                  }}
                >
                  Select all that apply
                </span>
              )}
            </span>
            <button
              onClick={() => toggleFlag(question.id)}
              style={{
                background: 'none',
                border: isFlagged ? '1px solid #e0453c' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '-0.12px',
                color: isFlagged ? '#e0453c' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
              title={isFlagged ? 'Unflag question' : 'Flag for review'}
            >
              {isFlagged ? 'Flagged' : 'Flag'}
            </button>
          </div>
          <p style={{ fontSize: '17px', fontWeight: 400, color: '#fff', lineHeight: 1.47, letterSpacing: '-0.374px' }}>{question.text}</p>
        </div>

        {/* Answers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="btn-ghost"
            style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
          >
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => goToQuestion(currentIndex + 1)}
              className="btn-ghost"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
              className="btn-primary"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>

      {/* Confirm submit dialog */}
      {confirmSubmit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              background: '#272729',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Submit Exam?</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.224px', marginBottom: '16px' }}>
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && (
                <span style={{ fontWeight: 600, color: '#e0453c' }}>
                  {' '}{questions.length - answeredCount} unanswered.
                </span>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setConfirmSubmit(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmSubmit(false); handleSubmit() }}
                disabled={submitting}
                className="btn-primary"
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
