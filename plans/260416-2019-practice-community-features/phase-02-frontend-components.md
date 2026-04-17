---
phase: "02"
title: Frontend Comment, Report, and Bookmark Components
status: pending
---

# Phase 02 — Frontend Comment, Report, and Bookmark Components

## Acceptance Criteria

- [ ] `CommentSection` component renders nothing before reveal, full comment list + form after reveal
- [ ] `CommentForm` submit button disabled when body is empty; calls API on submit; clears on success
- [ ] `CommentItem` shows author name, body, optional referenced_answer label, upvote button + count
- [ ] Upvote button filled/outlined based on `upvoted_by_me`; optimistic count increment on click
- [ ] `AnswerReportModal` opens via trigger button; submits report; shows warning on 409 (already reported)
- [ ] Bookmark button renders bookmark icon (filled = bookmarked); toggles on click with optimistic state
- [ ] All new components are in `apps/frontend/src/components/practice/`
- [ ] New API functions added to `exam-api.ts`
- [ ] Vitest unit tests pass for `CommentSection` render states and `CommentForm` submit

## File Ownership

```
apps/frontend/src/components/practice/comment-section.tsx    # NEW
apps/frontend/src/components/practice/comment-form.tsx       # NEW
apps/frontend/src/components/practice/comment-item.tsx       # NEW
apps/frontend/src/components/practice/answer-report-modal.tsx # NEW
apps/frontend/src/components/practice/bookmark-button.tsx    # NEW
apps/frontend/src/services/exam-api.ts                       # ADD practiceApi functions
apps/frontend/src/components/practice/comment-section.test.tsx # NEW
```

## Types to Add to `exam-api.ts`

```typescript
export interface Comment {
  id: number
  body: string
  referenced_answer: number | null
  author_name: string
  upvote_count: number
  upvoted_by_me: boolean
  created_at: string
}

export interface UpvoteResult {
  upvoted: boolean
  upvote_count: number
}

export interface BookmarkToggleResult {
  bookmarked: boolean
}

export interface BookmarkListResult {
  question_ids: number[]
}
```

## API Functions to Add to `exam-api.ts`

Append a `practiceApi` object alongside existing `examApi`:

```typescript
export const practiceApi = {
  listComments: (questionId: number) =>
    apiClient.list<Comment>(`/questions/${questionId}/comments/`),

  createComment: (questionId: number, body: string, referenced_answer?: number) =>
    apiClient.post<Comment>(`/questions/${questionId}/comments/`, { body, referenced_answer }),

  toggleUpvote: (commentId: number) =>
    apiClient.post<UpvoteResult>(`/questions/comments/${commentId}/upvote/`, {}),

  toggleBookmark: (questionId: number) =>
    apiClient.post<BookmarkToggleResult>(`/questions/${questionId}/bookmark/`, {}),

  getBookmarks: () =>
    apiClient.get<BookmarkListResult>('/questions/bookmarks/'),

  createReport: (questionId: number, reason: string) =>
    apiClient.post<{ id: number; reason: string }>(`/questions/${questionId}/report/`, { reason }),
}
```

## Implementation Steps

### Step 1 — `comment-item.tsx`

Props: `comment: Comment`, `onUpvote: (id: number) => void`

```tsx
import type { Comment } from '@/services/exam-api'

interface Props {
  comment: Comment
  onUpvote: (commentId: number) => void
}

export function CommentItem({ comment, onUpvote }: Props) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
            {comment.author_name}
          </span>
          {comment.referenced_answer !== null && (
            <span style={{ fontSize: '11px', color: '#2997ff', marginLeft: '8px' }}>
              re: answer option
            </span>
          )}
        </div>
        <button
          onClick={() => onUpvote(comment.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: comment.upvoted_by_me ? '#2997ff' : 'rgba(255,255,255,0.4)',
            fontSize: '12px', padding: '2px 6px', borderRadius: '4px',
            transition: 'color 0.15s',
          }}
          aria-label={comment.upvoted_by_me ? 'Remove upvote' : 'Upvote'}
        >
          ▲ {comment.upvote_count}
        </button>
      </div>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '6px', lineHeight: 1.5 }}>
        {comment.body}
      </p>
    </div>
  )
}
```

### Step 2 — `comment-form.tsx`

Props: `questionId: number`, `onSubmitted: (comment: Comment) => void`

```tsx
import { useState } from 'react'
import { practiceApi } from '@/services/exam-api'
import type { Comment } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'

interface Props {
  questionId: number
  onSubmitted: (comment: Comment) => void
}

export function CommentForm({ questionId, onSubmitted }: Props) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const addToast = useUiStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    try {
      const comment = await practiceApi.createComment(questionId, body.trim())
      onSubmitted(comment)
      setBody('')
    } catch {
      addToast({ type: 'error', message: 'Failed to post comment.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share why you chose this answer..."
        maxLength={2000}
        rows={3}
        style={{
          width: '100%', background: '#1d1d1f', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px', padding: '10px 12px', color: '#fff',
          fontSize: '14px', resize: 'vertical', outline: 'none',
          fontFamily: 'inherit', letterSpacing: '-0.224px',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="btn-primary"
          style={{ opacity: !body.trim() || submitting ? 0.5 : 1, padding: '6px 16px', fontSize: '13px' }}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
```

### Step 3 — `comment-section.tsx`

Orchestrates list + form. Only rendered when `isRevealed=true`.

```tsx
import { useEffect, useState } from 'react'
import { practiceApi } from '@/services/exam-api'
import type { Comment } from '@/services/exam-api'
import { CommentItem } from './comment-item'
import { CommentForm } from './comment-form'

interface Props {
  questionId: number
  isRevealed: boolean
}

export function CommentSection({ questionId, isRevealed }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isRevealed) return
    setLoading(true)
    practiceApi.listComments(questionId)
      .then(setComments)
      .finally(() => setLoading(false))
  }, [questionId, isRevealed])

  if (!isRevealed) return null

  const handleUpvote = async (commentId: number) => {
    try {
      const result = await practiceApi.toggleUpvote(commentId)
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, upvoted_by_me: result.upvoted, upvote_count: result.upvote_count }
            : c
        )
      )
    } catch { /* silent */ }
  }

  const handleSubmitted = (comment: Comment) => {
    setComments((prev) => [comment, ...prev])
  }

  return (
    <div
      style={{
        background: '#1d1d1f', borderRadius: '12px', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}
    >
      <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '-0.12px' }}>
        Community Discussion
      </h3>
      <CommentForm questionId={questionId} onSubmitted={handleSubmitted} />
      {loading ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>No comments yet. Be the first!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} onUpvote={handleUpvote} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Step 4 — `bookmark-button.tsx`

```tsx
interface Props {
  bookmarked: boolean
  onToggle: () => void
}

export function BookmarkButton({ bookmarked, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark for later'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
        color: bookmarked ? '#f5a623' : 'rgba(255,255,255,0.4)',
        fontSize: '18px', lineHeight: 1, transition: 'color 0.15s',
      }}
    >
      {bookmarked ? '★' : '☆'}
    </button>
  )
}
```

### Step 5 — `answer-report-modal.tsx`

```tsx
import { useState } from 'react'
import { practiceApi } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'

interface Props {
  questionId: number
  onClose: () => void
}

export function AnswerReportModal({ questionId, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const addToast = useUiStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      await practiceApi.createReport(questionId, reason.trim())
      addToast({ type: 'success', message: 'Report submitted. Thank you!' })
      onClose()
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 409) {
        addToast({ type: 'warning', message: 'You have already reported this question.' })
        onClose()
      } else {
        addToast({ type: 'error', message: 'Failed to submit report.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#272729', borderRadius: '12px', padding: '24px',
          width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#fff', margin: 0 }}>
          Report Wrong Answer
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Describe what you think is incorrect about this question or its answers.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. The correct answer should be B because..."
            maxLength={1000}
            rows={4}
            style={{
              background: '#1d1d1f', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', padding: '10px 12px', color: '#fff',
              fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              type="submit"
              disabled={!reason.trim() || submitting}
              className="btn-primary"
              style={{ opacity: !reason.trim() || submitting ? 0.5 : 1 }}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Step 6 — Unit Tests in `comment-section.test.tsx`

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CommentSection } from './comment-section'

vi.mock('@/services/exam-api', () => ({
  practiceApi: {
    listComments: vi.fn().mockResolvedValue([]),
    toggleUpvote: vi.fn(),
  },
}))

afterEach(() => vi.restoreAllMocks())

describe('CommentSection', () => {
  it('renders nothing when isRevealed=false', () => {
    const { container } = render(<CommentSection questionId={1} isRevealed={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders comment form and empty state when isRevealed=true', async () => {
    render(<CommentSection questionId={1} isRevealed={true} />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/share why/i)).toBeInTheDocument()
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
    })
  })
})
```
