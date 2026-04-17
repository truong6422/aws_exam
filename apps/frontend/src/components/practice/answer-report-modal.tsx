import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { practiceApi } from '@/services/exam-api'

interface AnswerReportModalProps {
  questionId: number
  onClose: () => void
}

export function AnswerReportModal({ questionId, onClose }: AnswerReportModalProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await practiceApi.reportAnswer(questionId, reason.trim())
      setSuccess(true)
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 409) {
        setError(t('report.already_reported'))
      } else {
        setError(t('report.error_send'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1d1d1f',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '24px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
            {t('report.title')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>✓</div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              {t('report.success_msg')}
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
              style={{ marginTop: '16px', width: '100%' }}
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              {t('report.subtitle')}
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('report.placeholder')}
              maxLength={1000}
              rows={4}
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

            {error && (
              <p style={{ margin: 0, fontSize: '12px', color: '#ff453a' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                style={{ fontSize: '13px' }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || submitting}
                className="btn-primary"
                style={{
                  fontSize: '13px',
                  opacity: !reason.trim() || submitting ? 0.5 : 1,
                }}
              >
                {submitting ? t('report.sending') : t('report.send_button')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
