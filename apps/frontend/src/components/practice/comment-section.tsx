/**
 * CommentSection — loads and displays community comments for a question.
 * Only rendered after the user has revealed the answer in Practice Mode.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { practiceApi, type Comment } from '@/services/exam-api'
import type { Answer } from '@/services/exam-api'
import { CommentItem } from './comment-item'
import { CommentForm } from './comment-form'

interface CommentSectionProps {
  questionId: number
  answers: Answer[]
  isAuthenticated: boolean
}

export function CommentSection({ questionId, answers, isAuthenticated }: CommentSectionProps) {
  const { t } = useTranslation()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    practiceApi
      .getComments(questionId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [questionId])

  const handlePost = async (body: string, referencedAnswers: number[], parent?: number | null) => {
    const newComment = await practiceApi.postComment(questionId, body, referencedAnswers, parent)

    if (parent) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parent
            ? { ...c, replies: [...(c.replies || []), newComment] }
            : c
        )
      )
    } else {
      setComments((prev) => [newComment, ...prev])
    }
  }

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '-0.12px',
          textTransform: 'uppercase',
        }}
      >
        {t('practice_extended.comment_section.community')} ({comments.length})
      </h3>

      {isAuthenticated && (
        <CommentForm answers={answers} onSubmit={handlePost} />
      )}

      {loading ? (
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>
          {t('practice_extended.comment_section.loading_comments')}
        </div>
      ) : comments.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>
          {isAuthenticated ? t('practice_extended.comment_section.no_comments') : t('practice_extended.comment_section.no_comments_login')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              answers={answers}
              isAuthenticated={isAuthenticated}
              onReply={handlePost as any}
            />
          ))}
        </div>
      )}
    </div>
  )
}
