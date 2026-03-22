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
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  const isFlagged = flagged.includes(question.id)
  const selectedAnswers = answers[question.id] ?? []

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      <aside className="hidden w-52 shrink-0 flex-col gap-4 lg:flex">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <ExamTimer minutes={minutes} seconds={seconds} isWarning={isWarning} isCritical={isCritical} />
          {isSaving && (
            <p className="mt-1 text-xs text-gray-400">Saving…</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-y-auto">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
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
          className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Submit Exam
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {/* Mobile timer bar */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <ExamTimer minutes={minutes} seconds={seconds} isWarning={isWarning} isCritical={isCritical} />
          <span className="text-xs text-gray-500">{answeredCount}/{questions.length} answered</span>
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-gray-500">
              Question {currentIndex + 1} of {questions.length}
              {question.question_type === 'multiple' && (
                <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                  Select all that apply
                </span>
              )}
            </span>
            <button
              onClick={() => toggleFlag(question.id)}
              className={`text-sm ${isFlagged ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}
              title={isFlagged ? 'Unflag question' : 'Flag for review'}
            >
              {isFlagged ? '🚩 Flagged' : '🏳 Flag'}
            </button>
          </div>
          <p className="text-base font-medium text-gray-800">{question.text}</p>
        </div>

        {/* Answers */}
        <div className="space-y-2">
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
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => goToQuestion(currentIndex + 1)}
              className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>

      {/* Confirm submit dialog */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-800">Submit Exam?</h3>
            <p className="mt-2 text-sm text-gray-600">
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="font-medium text-orange-600">
                  {' '}{questions.length - answeredCount} unanswered.
                </span>
              )}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmSubmit(false); handleSubmit() }}
                disabled={submitting}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
