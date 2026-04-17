/**
 * CommentItem — renders a single community comment with upvote button.
 */
import { useState } from 'react'
import { practiceApi, type Comment } from '@/services/exam-api'

interface CommentItemProps {
  comment: Comment
  isAuthenticated: boolean
}

export function CommentItem({ comment, isAuthenticated }: CommentItemProps) {
  const [upvoteCount, setUpvoteCount] = useState(comment.upvote_count)
  const [upvotedByMe, setUpvotedByMe] = useState(comment.upvoted_by_me)
  const [upvoting, setUpvoting] = useState(false)

  const handleUpvote = async () => {
    if (!isAuthenticated || upvoting) return
    setUpvoting(true)
    // Optimistic update
    const nextUpvoted = !upvotedByMe
    setUpvotedByMe(nextUpvoted)
    setUpvoteCount((c) => c + (nextUpvoted ? 1 : -1))
    try {
      const result = await practiceApi.upvoteComment(comment.id)
      setUpvotedByMe(result.upvoted)
      setUpvoteCount(result.upvote_count)
    } catch {
      // Revert optimistic update on failure
      setUpvotedByMe(!nextUpvoted)
      setUpvoteCount((c) => c + (nextUpvoted ? -1 : 1))
    } finally {
      setUpvoting(false)
    }
  }

  const timeAgo = new Date(comment.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#0071e3',
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
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
          {timeAgo}
        </span>
      </div>

      {/* Body */}
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>
        {comment.body}
      </p>

      {/* Upvote */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={handleUpvote}
          disabled={!isAuthenticated || upvoting}
          title={isAuthenticated ? 'Upvote' : 'Sign in to upvote'}
          style={{
            background: 'none',
            border: 'none',
            cursor: isAuthenticated ? 'pointer' : 'default',
            padding: '2px 6px',
            borderRadius: '4px',
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
      </div>
    </div>
  )
}
