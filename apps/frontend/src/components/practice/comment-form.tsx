import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Answer } from '@/services/exam-api'

interface CommentFormProps {
  answers: Answer[]
  parent?: number | null
  onSubmit: (body: string, referencedAnswers: number[], parent?: number | null) => Promise<void>
  onCancel?: () => void
}

export function CommentForm({ answers, parent = null, onSubmit, onCancel }: CommentFormProps) {
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  const [referencedAnswers, setReferencedAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(body.trim(), referencedAnswers, parent)
      setBody('')
      setReferencedAnswers([])
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAnswer = (id: number) => {
    setReferencedAnswers((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Optional answer reference */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>
          {t('comment.reference')}
        </span>
        <button
          type="button"
          onClick={() => setReferencedAnswers([])}
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: referencedAnswers.length === 0 ? '#0071e3' : 'rgba(255,255,255,0.15)',
            background: referencedAnswers.length === 0 ? 'rgba(0,113,227,0.15)' : 'transparent',
            color: referencedAnswers.length === 0 ? '#2997ff' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
          }}
        >
          {t('comment.none')}
        </button>
        {answers.map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => toggleAnswer(a.id)}
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: referencedAnswers.includes(a.id) ? '#0071e3' : 'rgba(255,255,255,0.15)',
              background: referencedAnswers.includes(a.id) ? 'rgba(0,113,227,0.15)' : 'transparent',
              color: referencedAnswers.includes(a.id) ? '#2997ff' : 'rgba(255,255,255,0.5)',
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
        placeholder={parent ? t('comment.reply_placeholder') : t('comment.comment_placeholder')}
        autoFocus={!!parent}
        maxLength={2000}
        rows={parent ? 2 : 3}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            {body.length}/2000
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
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
          {submitting ? t('comment.posting') : parent ? t('comment.reply') : t('comment.post_comment')}
        </button>
      </div>
    </form>
  )
}
