/**
 * Exam Result Page — displays score, pass/fail badge, and review/retry actions.
 * Result is read from navigation state (passed by submit) or fetched via review API.
 */
import { useEffect, useState } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { examApi, type ExamReview } from '@/services/exam-api'
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

export default function ExamResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const clearSession = useExamStore((s) => s.clearSession)

  const navState = (location.state as NavState) ?? {}
  const [review, setReview] = useState<ExamReview | null>(null)
  const [loading, setLoading] = useState(!navState.result)

  // Clear exam session from store on result page mount
  useEffect(() => {
    clearSession()
  }, [clearSession])

  // If no result in nav state, fetch review to get score data
  useEffect(() => {
    if (navState.result || !sessionId) return
    const id = Number(sessionId)
    if (!id) { navigate('/exam/setup'); return }

    examApi
      .getExamReview(id)
      .then(setReview)
      .catch(() => navigate('/exam/setup'))
      .finally(() => setLoading(false))
  }, [sessionId, navState.result, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  const score = navState.result?.score_percentage ?? review?.score_percentage ?? 0
  const correct = navState.result?.correct_count ?? review?.correct_count ?? 0
  const total = navState.result?.total_questions ?? review?.total_questions ?? 0
  // Approximate pass threshold at 72% if no review data
  const passed = score >= 72
  const scoreColor = passed ? 'text-green-600' : 'text-red-600'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Exam Results"
        subtitle={review ? `${review.certification.code} — ${review.certification.name}` : `Attempt #${sessionId}`}
      />

      {/* Score card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className={`text-6xl font-bold ${scoreColor}`}>{Math.round(score)}%</p>
        <p className="mt-1 text-sm text-gray-500">Your Score</p>

        <div className="mt-4 flex justify-center gap-3">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {passed ? '✓ PASS' : '✗ FAIL'}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-600">
            {correct} / {total} correct
          </span>
        </div>
      </div>

      {/* Review section — only if review data is available */}
      {review && review.questions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Answer Review</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {review.questions.map((q, idx) => {
              const userAnswerIds = review.user_answers[q.id] ?? []
              return (
                <div key={q.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <p className="text-sm font-medium text-gray-800">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="mt-2 space-y-1">
                    {q.answers.map((a) => {
                      const isUserAnswer = userAnswerIds.includes(a.id)
                      const cls = a.is_correct
                        ? 'text-green-700 font-medium'
                        : isUserAnswer
                          ? 'text-red-600'
                          : 'text-gray-500'
                      return (
                        <p key={a.id} className={`text-xs ${cls}`}>
                          {a.is_correct ? '✓' : isUserAnswer ? '✗' : ' '} {a.text}
                        </p>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <p className="mt-2 rounded bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {sessionId && !review && (
          <Link
            to={`/exam/${sessionId}/review`}
            className="rounded-lg border border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            Review Answers
          </Link>
        )}
        <Link
          to="/exam/setup"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          New Exam
        </Link>
        <Link
          to="/history"
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          View History
        </Link>
        <Link
          to="/dashboard"
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
