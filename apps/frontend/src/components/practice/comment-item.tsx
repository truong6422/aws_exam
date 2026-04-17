import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { practiceApi, type Comment, type Answer } from '@/services/exam-api'
import { CommentForm } from './comment-form'

interface CommentItemProps {
  comment: Comment
  answers: Answer[]
  isAuthenticated: boolean
  onReply: (body: string, referencedAnswers: number[], parent: number) => Promise<void>
}

export function CommentItem({ comment, answers, isAuthenticated, onReply }: CommentItemProps) {
  const { t, i18n } = useTranslation()
  const [upvoteCount, setUpvoteCount] = useState(comment.upvote_count)
  const [upvotedByMe, setUpvotedByMe] = useState(comment.upvoted_by_me)
  const [upvoting, setUpvoting] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)

  const handleUpvote = async () => {
    if (!isAuthenticated || upvoting) return
    setUpvoting(true)
    const nextUpvoted = !upvotedByMe
    setUpvotedByMe(nextUpvoted)
    setUpvoteCount((c) => c + (nextUpvoted ? 1 : -1))
    try {
      const result = await practiceApi.upvoteComment(comment.id)
      setUpvotedByMe(result.upvoted)
      setUpvoteCount(result.upvote_count)
    } catch {
      setUpvotedByMe(!nextUpvoted)
      setUpvoteCount((c) => c + (nextUpvoted ? -1 : 1))
    } finally {
      setUpvoting(false)
    }
  }

  const lang = i18n.language === 'en' ? 'en-US' : 'vi-VN'
  const timeAgo = new Date(comment.created_at).toLocaleDateString(lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const getAnswerLetter = (id: number) => {
    const idx = answers.findIndex(a => a.id === id)
    return idx !== -1 ? String.fromCharCode(65 + idx) : '?'
  }

  return (
    <div
      style={{
        padding: '12px 14px',
        background: comment.parent ? 'transparent' : 'rgba(255,255,255,0.04)',
        borderLeft: comment.parent ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderRadius: comment.parent ? '0' : '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginLeft: comment.parent ? '12px' : '0',
      }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: comment.parent ? '#5e5e60' : '#0071e3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {comment.author_name[0].toUpperCase()}
        </div>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
          {comment.author_name}
        </span>
        {comment.referenced_answers && comment.referenced_answers.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
            {comment.referenced_answers.map(id => (
              <span
                key={id}
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#2997ff',
                  background: 'rgba(0,113,227,0.1)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid rgba(0,113,227,0.3)',
                }}
              >
                {getAnswerLetter(id)}
              </span>
            ))}
          </div>
        )}
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
          {timeAgo}
        </span>
      </div>

      {/* Body */}
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>
        {comment.body}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleUpvote}
          disabled={!isAuthenticated || upvoting}
          style={{
            background: 'none',
            border: 'none',
            cursor: isAuthenticated ? 'pointer' : 'default',
            padding: '2px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: upvotedByMe ? '#2997ff' : 'rgba(255,255,255,0.4)',
            transition: 'color 0.15s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1L11 9H1L6 1Z" />
          </svg>
          {upvoteCount}
        </button>

        {isAuthenticated && !comment.parent && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {t('common.reply')}
          </button>
        )}
      </div>

      {showReplyForm && (
        <div style={{ marginTop: '4px' }}>
          <CommentForm
            answers={answers}
            parent={comment.id}
            onSubmit={async (body, ras, p) => {
              await onReply(body, ras, p!)
              setShowReplyForm(false)
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              answers={answers}
              isAuthenticated={isAuthenticated}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}
