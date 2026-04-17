/**
 * Practice Session Page — instant feedback mode with community features.
 * After selecting an answer, reveals correct/incorrect state and explanation.
 * No timer, no autosave. Free navigation grid, bookmarks, comments, report.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { useExamStore } from '@/stores/exam-store'
import { useAuthStore } from '@/stores/auth-store'
import { AnswerOption } from '@/components/exam/answer-option'
import { BookmarkButton } from '@/components/practice/bookmark-button'
import { CommentSection } from '@/components/practice/comment-section'
import { AnswerReportModal } from '@/components/practice/answer-report-modal'
import { examApi } from '@/services/exam-api'
import type { ReviewQuestion } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'

export default function PracticeSessionPage() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const {
    attemptId, questions, answers, currentIndex, bookmarked,
    updateAnswer, goToQuestion, clearSession, getAnswersAsPartial,
    setBookmarked, loadBookmarks,
  } = useExamStore()

  const [revealed, setRevealed] = useState(false)
  const [reviewQuestion, setReviewQuestion] = useState<ReviewQuestion | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showGrid, setShowGrid] = useState(false)

  // Load bookmarks once on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) loadBookmarks()
  }, [isAuthenticated, loadBookmarks])

  // Reset reveal state when navigating to a different question
  useEffect(() => {
    setRevealed(false)
    setReviewQuestion(null)
  }, [currentIndex])

  const question = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  // Redirect if no session
  if (!question) {
    navigate('/practice/setup')
    return null
  }

  const selectedAnswers = answers[question.id] ?? []
  const isBookmarked = bookmarked.includes(question.id)

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
      addToast({ type: 'warning', message: 'Vui lòng chọn một đáp án trước.' })
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

    // Fetch review data for explanation
    if (attemptId) {
      try {
        const review = await examApi.getExamReview(attemptId)
        const rq = review.questions.find((q) => q.id === question.id) ?? null
        setReviewQuestion(rq)
      } catch {
        // Non-blocking — explanation falls back to empty string
      }
    }
  }

  const handleNext = async () => {
    if (!isLast) {
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
        addToast({ type: 'error', message: (err as Error).message || 'Không thể kết thúc buổi luyện tập.' })
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
          title="Phiên luyện tập"
          subtitle={`Câu ${currentIndex + 1} / ${questions.length}`}
        />
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '4px' }}>
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="btn-ghost"
            style={{ fontSize: '12px' }}
          >
            {showGrid ? 'Ẩn lưới' : 'Câu hỏi'}
          </button>
          <button onClick={handleEnd} className="btn-ghost">
            Kết thúc
          </button>
        </div>
      </div>

      {/* Free navigation grid */}
      {showGrid && (
        <div
          style={{
            background: '#272729',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {questions.map((q, idx) => {
            const isAnswered = (answers[q.id] ?? []).length > 0
            const isCurrent = idx === currentIndex
            const isBookmarkedQ = bookmarked.includes(q.id)
            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: isCurrent
                    ? '2px solid #0071e3'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: isCurrent
                    ? 'rgba(0,113,227,0.15)'
                    : isAnswered
                      ? 'rgba(52,199,89,0.15)'
                      : 'transparent',
                  color: isCurrent ? '#2997ff' : isAnswered ? '#34c759' : 'rgba(255,255,255,0.5)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {idx + 1}
                {isBookmarkedQ && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#0071e3',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

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
        {/* Bookmark button row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          {question.question_type === 'multiple' ? (
            <span
              style={{
                display: 'inline-block',
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
              Chọn tất cả đáp án đúng
            </span>
          ) : (
            <span />
          )}
          {isAuthenticated && (
            <BookmarkButton
              questionId={question.id}
              isBookmarked={isBookmarked}
              onToggle={setBookmarked}
            />
          )}
        </div>
        <p style={{ fontSize: '17px', fontWeight: 400, color: '#fff', lineHeight: 1.47, letterSpacing: '-0.374px', margin: 0 }}>
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
                Giải thích:{' '}
              </span>
              {reviewQuestion.explanation}
            </>
          ) : (
            'Đã nộp đáp án. Tiếp tục câu tiếp theo.'
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        {/* Back button */}
        <button
          onClick={() => goToQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="btn-ghost"
          style={{ opacity: currentIndex === 0 ? 0.3 : 1, fontSize: '13px' }}
        >
          ← Trước
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Report button — only after reveal and authenticated */}
          {revealed && isAuthenticated && (
            <button
              onClick={() => setShowReport(true)}
              className="btn-ghost"
              style={{ fontSize: '12px', color: 'rgba(255,82,82,0.8)', borderColor: 'rgba(255,82,82,0.3)' }}
            >
              Báo lỗi đáp án
            </button>
          )}

          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={selectedAnswers.length === 0}
              className="btn-primary"
              style={{ opacity: selectedAnswers.length === 0 ? 0.5 : 1 }}
            >
              Nộp đáp án
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="btn-primary"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Đang kết thúc...' : isLast ? 'Kết thúc phiên' : 'Câu tiếp theo →'}
            </button>
          )}
        </div>
      </div>

      {/* Community comments — visible after reveal */}
      {revealed && (
        <CommentSection
          questionId={question.id}
          answers={question.answers}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Answer report modal */}
      {showReport && (
        <AnswerReportModal
          questionId={question.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
