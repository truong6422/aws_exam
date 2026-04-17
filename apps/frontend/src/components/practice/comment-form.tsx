/**
 * CommentForm — textarea + submit for posting a new community comment.
 * Shows the referenced answer label if provided.
 */
import { useState } from 'react'
import type { Answer } from '@/services/exam-api'

interface CommentFormProps {
  answers: Answer[]
  onSubmit: (body: string, referencedAnswer: number | null) => Promise<void>
}

export function CommentForm({ answers, onSubmit }: CommentFormProps) {
  const [body, setBody] = useState('')
  const [referencedAnswer, setReferencedAnswer] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(body.trim(), referencedAnswer)
      setBody('')
      setReferencedAnswer(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Optional answer reference */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>
          Reference:
        </span>
        <button
          type="button"
          onClick={() => setReferencedAnswer(null)}
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: referencedAnswer === null ? '#0071e3' : 'rgba(255,255,255,0.15)',
            background: referencedAnswer === null ? 'rgba(0,113,227,0.15)' : 'transparent',
            color: referencedAnswer === null ? '#2997ff' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
          }}
        >
          None
        </button>
        {answers.map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setReferencedAnswer(a.id)}
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: referencedAnswer === a.id ? '#0071e3' : 'rgba(255,255,255,0.15)',
              background: referencedAnswer === a.id ? 'rgba(0,113,227,0.15)' : 'transparent',
              color: referencedAnswer === a.id ? '#2997ff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            {String.fromCharCode(65 + i)}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your thoughts on this question..."
        maxLength={2000}
        rows={3}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '13px',
          color: '#fff',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          {body.length}/2000
        </span>
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="btn-primary"
          style={{
            fontSize: '13px',
            padding: '6px 16px',
            opacity: !body.trim() || submitting ? 0.5 : 1,
          }}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
