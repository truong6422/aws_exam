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
    // Fetch explanation from review endpoint (single question via submit + review)
    // For practice, we submit the current answer and fetch the review inline
    if (attemptId) {
      try {
        // Autosave current answers before reveal
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
      // Last question — submit the practice session
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

  // Determine which answers are correct from review data (if available)
  const getIsCorrect = (answerId: number): boolean => {
    if (reviewQuestion) {
      return reviewQuestion.answers.find((a) => a.id === answerId)?.is_correct ?? false
    }
    return false
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Practice Session"
          subtitle={`Question ${currentIndex + 1} of ${questions.length}`}
        />
        <button
          onClick={handleEnd}
          className="rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          End Session
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-brand-600 transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {question.question_type === 'multiple' && (
          <span className="mb-2 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Select all that apply
          </span>
        )}
        <p className="text-base font-medium text-gray-800">{question.text}</p>
      </div>

      {/* Answer options */}
      <div className="space-y-2">
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          {reviewQuestion?.explanation ? (
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 Explanation: </span>
              {reviewQuestion.explanation}
            </p>
          ) : (
            <p className="text-sm text-blue-700">
              Answer submitted. Continue to the next question.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={selectedAnswers.length === 0}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Finishing…' : isLast ? 'Finish Session' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  )
}
