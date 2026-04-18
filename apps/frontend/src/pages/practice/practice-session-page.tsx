/**
 * Practice Session Page — Displays a list of 5 questions per page.
 * Users can reveal answers individually and see community comments.
 * Filtered for unlocked exam sets only.
 */
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { useAuthStore } from '@/stores/auth-store'
import { useExamStore } from '@/stores/exam-store'
import { AnswerOption } from '@/components/exam/answer-option'
import { BookmarkButton } from '@/components/practice/bookmark-button'
import { CommentSection } from '@/components/practice/comment-section'
import { AnswerReportModal } from '@/components/practice/answer-report-modal'
import { practiceApi, type ReviewQuestion } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'

// ── Question Item Component ──────────────────────────────────────────────────

interface QuestionItemProps {
  index: number
  question: ReviewQuestion
  isAuthenticated: boolean
  isBookmarked: boolean
  onToggleBookmark: (id: number, state: boolean) => void
}

function PracticeQuestionItem({ index, question, isAuthenticated, isBookmarked, onToggleBookmark }: QuestionItemProps) {
  const { t } = useTranslation()
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [revealed, setRevealed] = useState(false)
  const [commentsOpened, setCommentsOpened] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const handleSelect = (answerId: number) => {
    if (revealed) return
    if (question.question_type === 'single') {
      setSelectedAnswers([answerId])
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId]
      )
    }
  }

  const handleReveal = () => {
    if (selectedAnswers.length === 0) {
      useUiStore.getState().addToast({ type: 'warning', message: 'Vui lòng chọn một đáp án trước.' })
      return
    }
    setRevealed(true)
    setCommentsOpened(true)
  }

  const getIsCorrect = (answerId: number): boolean => {
    return question.answers.find((a) => a.id === answerId)?.is_correct ?? false
  }

  const isMulti = question.question_type === 'multiple'

  return (
    <div style={{
      background: '#272729',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('practice.question_number', { index })}
          </span>
          {isMulti && (
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#2997ff',
              background: 'rgba(0,113,227,0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
              width: 'fit-content'
            }}>
              {t('practice.select_all')}
            </span>
          )}
        </div>
        {isAuthenticated && (
          <BookmarkButton
            questionId={question.id}
            isBookmarked={isBookmarked}
            onToggle={onToggleBookmark}
          />
        )}
      </div>

      <p style={{ fontSize: '17px', fontWeight: 450, color: '#fff', lineHeight: 1.5, margin: 0 }}>
        {question.text}
      </p>

      {/* Options */}
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

      {/* Suggestion Text */}
      {!revealed && (
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0, fontStyle: 'italic' }}>
          {t('practice.suggestion')}
        </p>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            if (!revealed) {
              handleReveal()
            } else {
              setRevealed(false)
            }
          }}
          disabled={!revealed && selectedAnswers.length === 0}
          className={revealed ? "btn-ghost" : "btn-primary"}
          style={{
            fontSize: '13px',
            opacity: !revealed && selectedAnswers.length === 0 ? 0.5 : 1
          }}
        >
          {revealed ? 'Ẩn kết quả' : 'Kiểm tra đáp án'}
        </button>
        <button
          onClick={() => setCommentsOpened(!commentsOpened)}
          className="btn-ghost"
          style={{ fontSize: '13px' }}
        >
          {commentsOpened ? 'Ẩn thảo luận' : `Xem thảo luận (${question.comment_count})`}
        </button>
      </div>

      {/* Report button after reveal */}
      {revealed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px' }}>
          <button
            onClick={() => setShowReport(true)}
            style={{ background: 'none', border: 'none', fontSize: '12px', color: 'rgba(255,82,82,0.6)', cursor: 'pointer' }}
          >
            Báo lỗi đáp án
          </button>
        </div>
      )}

      {/* Comments Section */}
      {commentsOpened && (
        <CommentSection
          questionId={question.id}
          answers={question.answers}
          isAuthenticated={isAuthenticated}
        />
      )}

      {showReport && (
        <AnswerReportModal
          questionId={question.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function PracticeSessionPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { bookmarked, loadBookmarks, setBookmarked } = useExamStore()

  const certId = Number(searchParams.get('certification_id')) || undefined
  const currentPage = Number(searchParams.get('page')) || 1

  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await practiceApi.getQuestions(certId, currentPage)
      setQuestions(resp.data)
      setTotalPages(resp.links.total_pages)
      setTotalCount(resp.links.count)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      addToast({ type: 'error', message: t('practice.error_load_questions') })
    } finally {
      setLoading(false)
    }
  }, [certId, currentPage, addToast])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    if (isAuthenticated) loadBookmarks()
  }, [isAuthenticated, loadBookmarks])

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      certification_id: certId?.toString() || '',
      page: newPage.toString()
    })
  }

  if (loading && questions.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
      <PageHeader
        title={t('practice.setup_title')}
        subtitle={t('practice.total_questions', { count: totalCount })}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {questions.map((q, idx) => (
          <PracticeQuestionItem
            key={q.id}
            index={((currentPage - 1) * 5) + idx + 1}
            question={q}
            isAuthenticated={isAuthenticated}
            isBookmarked={bookmarked.includes(q.id)}
            onToggleBookmark={setBookmarked}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-ghost"
            style={{ padding: '8px 16px' }}
          >
            ← Trước
          </button>

          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
            Trang {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-ghost"
            style={{ padding: '8px 16px' }}
          >
            Sau →
          </button>
        </div>
      )}

      {/* Back to setup */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => navigate('/practice/setup')} className="btn-ghost" style={{ fontSize: '13px' }}>
          {t('practice.back_to_setup')}
        </button>
      </div>
    </div>
  )
}
