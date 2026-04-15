/**
 * Practice Session Page — instant feedback mode.
 * After selecting an answer, reveals correct/incorrect state and explanation.
 * No timer, no autosave, no navigation grid. Advances on "Next Question".
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { useExamStore } from '@/stores/exam-store'
import { AnswerOption } from '@/components/exam/answer-option'
import { examApi } from '@/services/exam-api'
import type { ReviewQuestion } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'

export default function PracticeSessionPage() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const {
    attemptId, questions, answers, currentIndex,
    updateAnswer, goToQuestion, clearSession, getAnswersAsPartial,
  } = useExamStore()

  const [revealed, setRevealed] = useState(false)
  const [reviewQuestion, setReviewQuestion] = useState<ReviewQuestion | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const question = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  // Redirect if no session
  if (!question) {
    navigate('/practice/setup')
    return null
  }

  const selectedAnswers = answers[question.id] ?? []

  const handleSelect = (answerId: number) => {
    if (revealed) return // lock after reveal
    if (question.question_type === 'single') {
      updateAnswer(question.id, [answerId])
    } else {
      const current = selectedAnswers
      const next = current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId]
      updateAnswer(question.id, next)
    }
  }

  const handleReveal = async () => {
    if (selectedAnswers.length === 0) {
      addToast({ type: 'warning', message: 'Please select an answer first.' })
      return
    }
    if (attemptId) {
      try {
        await examApi.autosaveExam(attemptId, getAnswersAsPartial())
      } catch {
        // Non-blocking
      }
    }
    setRevealed(true)
  }

  const handleNext = async () => {
    if (!isLast) {
      setRevealed(false)
      setReviewQuestion(null)
      goToQuestion(currentIndex + 1)
    } else {
      if (!attemptId) { navigate('/practice/setup'); return }
      setSubmitting(true)
      try {
        const result = await examApi.submitExam(attemptId, getAnswersAsPartial())
        clearSession()
        navigate('/practice/setup', {
          state: { completed: true, score: result.score_percentage },
        })
      } catch (err) {
        addToast({ type: 'error', message: (err as Error).message || 'Failed to finish session.' })
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleEnd = () => {
    clearSession()
    navigate('/practice/setup')
  }

  const getIsCorrect = (answerId: number): boolean => {
    if (reviewQuestion) {
      return reviewQuestion.answers.find((a) => a.id === answerId)?.is_correct ?? false
    }
    return false
  }

  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <PageHeader
          title="Practice Session"
          subtitle={`Question ${currentIndex + 1} of ${questions.length}`}
        />
        <button
          onClick={handleEnd}
          className="btn-ghost"
          style={{ flexShrink: 0, marginTop: '4px' }}
        >
          End Session
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '3px',
          width: '100%',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '3px',
            width: `${progress}%`,
            background: '#0071e3',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Question card */}
      <div
        style={{
          background: '#272729',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        {question.question_type === 'multiple' && (
          <span
            style={{
              display: 'inline-block',
              marginBottom: '10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '-0.12px',
              color: '#2997ff',
              background: 'rgba(0,113,227,0.1)',
              border: '1px solid rgba(0,113,227,0.4)',
              borderRadius: '6px',
              padding: '2px 8px',
            }}
          >
            Select all that apply
          </span>
        )}
        <p style={{ fontSize: '17px', fontWeight: 400, color: '#fff', lineHeight: 1.47, letterSpacing: '-0.374px' }}>
          {question.text}
        </p>
      </div>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {question.answers.map((answer) => (
          <AnswerOption
            key={answer.id}
            answer={answer}
            isSelected={selectedAnswers.includes(answer.id)}
            questionType={question.question_type}
            onSelect={handleSelect}
            isRevealed={revealed}
            isCorrect={getIsCorrect(answer.id)}
          />
        ))}
      </div>

      {/* Explanation panel — visible after reveal */}
      {revealed && (
        <div
          style={{
            background: 'rgba(0,113,227,0.1)',
            border: '1px solid rgba(0,113,227,0.4)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#2997ff',
            lineHeight: 1.5,
          }}
        >
          {reviewQuestion?.explanation ? (
            <>
              <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '-0.12px' }}>
                Explanation:{' '}
              </span>
              {reviewQuestion.explanation}
            </>
          ) : (
            'Answer submitted. Continue to the next question.'
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={selectedAnswers.length === 0}
            className="btn-primary"
            style={{ opacity: selectedAnswers.length === 0 ? 0.5 : 1 }}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={submitting}
            className="btn-primary"
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Finishing...' : isLast ? 'Finish Session' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  )
}
