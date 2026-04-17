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

  const score = navState.result?.score_percentage ?? review?.score_percentage ?? 0
  const correct = navState.result?.correct_count ?? review?.correct_count ?? 0
  const total = navState.result?.total_questions ?? review?.total_questions ?? 0
  // Approximate pass threshold at 72% if no review data
  const passed = score >= 72

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Kết quả thi"
        subtitle={review ? `${review.certification.code} — ${review.certification.name}` : `Lần thi #${sessionId}`}
      />

      {/* Score hero */}
      <div
        style={{
          background: passed ? 'rgba(29,155,94,0.12)' : 'rgba(224,69,60,0.12)',
          borderRadius: '12px',
          border: `1px solid ${passed ? 'rgba(29,155,94,0.4)' : 'rgba(224,69,60,0.4)'}`,
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
            fontSize: '72px',
            fontWeight: 700,
            color: passed ? '#1d9b5e' : '#e0453c',
            lineHeight: 1,
            letterSpacing: '-0.5px',
            marginBottom: '8px',
          }}
        >
          {Math.round(score)}%
        </p>
        <p style={{ fontSize: '12px', letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
          Điểm của bạn
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <span
            style={{
              padding: '6px 20px',
              borderRadius: '6px',
              border: `1px solid ${passed ? 'rgba(29,155,94,0.5)' : 'rgba(224,69,60,0.5)'}`,
              color: passed ? '#1d9b5e' : '#e0453c',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '-0.12px',
            }}
          >
            {passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
          </span>
          <span
            style={{
              padding: '6px 20px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              letterSpacing: '-0.12px',
            }}
          >
            {correct} / {total} câu đúng
          </span>
        </div>
      </div>

      {/* Review section — only if review data is available */}
      {review && review.questions.length > 0 && (
        <div
          style={{
            background: '#272729',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '-0.12px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '16px',
            }}
          >
            Xem lại đáp án
          </h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {review.questions.map((q, idx) => {
              const userAnswerIds = review.user_answers[q.id] ?? []
              return (
                <div key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>
                    {idx + 1}. {q.text}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {q.answers.map((a) => {
                      const isUserAnswer = userAnswerIds.includes(a.id)
                      const color = a.is_correct ? '#1d9b5e' : isUserAnswer ? '#e0453c' : 'rgba(255,255,255,0.4)'
                      return (
                        <p key={a.id} style={{ fontSize: '12px', color, fontWeight: a.is_correct ? 600 : 400 }}>
                          {a.is_correct ? '+ ' : isUserAnswer ? '- ' : '  '}{a.text}
                        </p>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <p
                      style={{
                        marginTop: '8px',
                        background: 'rgba(0,113,227,0.1)',
                        border: '1px solid rgba(0,113,227,0.4)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#2997ff',
                        letterSpacing: '-0.12px',
                      }}
                    >
                      {q.explanation}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {sessionId && !review && (
          <Link
            to={`/exam/${sessionId}/review`}
            className="btn-ghost"
            style={{ textDecoration: 'none' }}
          >
            Xem lại đáp án
          </Link>
        )}
        <Link
          to="/exam/setup"
          className="btn-primary"
          style={{ textDecoration: 'none' }}
        >
          Bài thi mới
        </Link>
        <Link
          to="/history"
          className="btn-ghost"
          style={{ textDecoration: 'none' }}
        >
          Xem lịch sử
        </Link>
        <Link
          to="/dashboard"
          className="btn-ghost"
          style={{ textDecoration: 'none' }}
        >
          Bảng điều khiển
        </Link>
      </div>
    </div>
  )
}
