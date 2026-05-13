import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type { FeedbackRating } from '@/services/feedback-api'

interface FeedbackModalProps {
  onClose: () => void
  onSubmit: (rating: FeedbackRating, comment: string) => Promise<void>
}

const StarIcon = ({ filled, size = 32 }: { filled: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={filled ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
      stroke={filled ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
      strokeWidth="1"
      style={{
        filter: filled ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' : 'none',
        transition: 'all 0.2s ease',
      }}
    />
  </svg>
)

function FeedbackModalContent({ onClose, onSubmit }: FeedbackModalProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(rating, comment.trim())
      setSubmitted(true)
      setTimeout(onClose, 2200)
    } finally {
      setSubmitting(false)
    }
  }

  const ratingLabels: Record<number, { text: string; color: string; icon: string }> = {
    1: { text: 'Rất không hài lòng', color: '#ef4444', icon: '😠' },
    2: { text: 'Không hài lòng', color: '#f97316', icon: '😕' },
    3: { text: 'Bình thường', color: '#fbbf24', icon: '😐' },
    4: { text: 'Hài lòng', color: '#84cc16', icon: '🙂' },
    5: { text: 'Rất hài lòng', color: '#22c55e', icon: '😄' },
  }

  const currentRating = hoverRating ?? rating ?? 0
  const currentLabel = ratingLabels[currentRating]

  if (submitted) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        onClick={onClose}
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRadius: '24px',
            padding: '48px 40px',
            width: '380px',
            maxWidth: '90vw',
            textAlign: 'center',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,197,94,0.15)',
            border: '1px solid rgba(255,255,255,0.1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(34,197,94,0.4), inset 0 -4px 12px rgba(0,0,0,0.2)',
            animation: 'success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" style={{
                strokeDasharray: 30,
                strokeDashoffset: 30,
                animation: 'draw-check 0.4s ease 0.3s forwards',
              }} />
            </svg>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            marginBottom: '16px',
            animation: 'fade-in 0.4s ease 0.5s both',
          }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  style={{
                    animation: `star-pop 0.3s ease ${0.6 + star * 0.1}s both`,
                  }}
                />
              </svg>
            ))}
          </div>

          <h3 style={{ 
            color: '#fff', 
            fontSize: '24px', 
            fontWeight: 700, 
            margin: '0 0 8px',
            letterSpacing: '-0.5px',
            animation: 'fade-in 0.4s ease 0.4s both',
          }}>
            {t('feedback.thanks') || 'Cảm ơn bạn!'}
          </h3>
          <p style={{ 
            color: 'rgba(255,255,255,0.7)', 
            fontSize: '15px', 
            margin: 0,
            lineHeight: 1.5,
            animation: 'fade-in 0.4s ease 0.5s both',
          }}>
            {t('feedback.thanks_message') || 'Phản hồi của bạn giúp chúng tôi cải thiện dịch vụ.'}
          </p>
        </div>
        
        <style>{`
          @keyframes success-pop {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          @keyframes draw-check {
            to { stroke-dashoffset: 0; }
          }
          @keyframes star-pop {
            0% { transform: scale(0) rotate(-30deg); opacity: 0; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '24px',
          padding: '32px',
          width: '420px',
          maxWidth: '92vw',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes star-glow {
            0%, 100% { filter: drop-shadow(0 0 4px rgba(251,191,36,0.4)); }
            50% { filter: drop-shadow(0 0 12px rgba(251,191,36,0.8)); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Header with animated star */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '28px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.05) 100%)',
              border: '1px solid rgba(251,191,36,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'float 3s ease-in-out infinite',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <h2 style={{ 
                color: '#fff', 
                fontSize: '22px', 
                fontWeight: 700, 
                margin: '0 0 4px',
                letterSpacing: '-0.3px',
              }}>
                {t('feedback.title') || 'Đánh giá của bạn'}
              </h2>
              <p style={{ 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: '13px', 
                margin: 0 
              }}>
                {t('feedback.subtitle') || 'Giúp chúng tôi cải thiện dịch vụ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '28px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                margin: 0,
                textAlign: 'center',
              }}>
                Bạn hài lòng với ứng dụng không?
              </p>
              
              {/* Stars */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {([1, 2, 3, 4, 5] as FeedbackRating[]).map((star) => {
                  const isFilled = star <= currentRating
                  const isHovered = hoverRating !== null && star <= hoverRating
                  
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transform: isHovered ? 'scale(1.2)' : isFilled ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        animation: isFilled ? 'star-glow 2s ease-in-out infinite' : 'none',
                      }}
                    >
                      <StarIcon 
                        filled={isFilled} 
                        size={hoverRating !== null ? (isHovered ? 44 : 36) : (rating === star ? 44 : 36)}
                      />
                    </button>
                  )
                })}
              </div>

              {/* Rating Label */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: currentRating > 0 ? `${currentLabel.color}15` : 'transparent',
                borderRadius: '30px',
                border: `1px solid ${currentRating > 0 ? `${currentLabel.color}30` : 'transparent'}`,
                transition: 'all 0.3s ease',
                minHeight: '44px',
              }}>
                {currentRating > 0 && (
                  <>
                    <span style={{ fontSize: '20px' }}>{currentLabel.icon}</span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: currentLabel.color,
                      transition: 'color 0.3s ease',
                    }}>
                      {currentLabel.text}
                    </span>
                  </>
                )}
                {currentRating === 0 && (
                  <span style={{ 
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.4)' 
                  }}>
                    Nhấn để chọn đánh giá
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Comment Textarea */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <div>
                <span style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                }}>
                  {t('feedback.comment_label') || 'Nhận xét của bạn'}
                </span>
                <span style={{ 
                  color: 'rgba(255,255,255,0.4)', 
                  fontWeight: 400,
                  marginLeft: '6px',
                  fontSize: '12px',
                }}>
                  (tùy chọn)
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: comment.length > 5000 ? '#ef4444' : comment.length > 4500 ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                fontWeight: comment.length > 4500 ? 600 : 400,
                transition: 'color 0.2s ease',
              }}>
                {comment.length} / 5000
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                const newValue = e.target.value
                if (newValue.length <= 5000) {
                  setComment(newValue)
                }
              }}
              onPaste={(e) => {
                e.preventDefault()
                const pastedText = e.clipboardData.getData('text')
                const currentLength = comment.length
                const remainingChars = 5000 - currentLength
                
                if (remainingChars > 0) {
                  const truncatedText = pastedText.slice(0, remainingChars)
                  setComment(comment + truncatedText)
                }
              }}
              placeholder={t('feedback.placeholder') || 'Chia sẻ trải nghiệm của bạn với chúng tôi...'}
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${comment.length > 5000 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '14px',
                padding: '16px',
                fontSize: '14px',
                color: '#fff',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                minHeight: '100px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.1), 0 8px 24px rgba(0,0,0,0.2)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = comment.length > 5000 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              }}
            >
              {t('common.cancel') || 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={!rating || submitting}
              style={{
                flex: 2,
                padding: '14px 20px',
                borderRadius: '14px',
                border: 'none',
                background: rating 
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' 
                  : 'rgba(255,255,255,0.08)',
                color: rating ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: rating && !submitting ? 'pointer' : 'not-allowed',
                opacity: submitting ? 0.8 : 1,
                transition: 'all 0.3s ease',
                boxShadow: rating 
                  ? '0 8px 24px rgba(251,191,36,0.35), inset 0 1px 0 rgba(255,255,255,0.3)' 
                  : 'none',
                letterSpacing: '0.3px',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (rating && !submitting) {
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(251,191,36,0.45), inset 0 1px 0 rgba(255,255,255,0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (rating) {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,191,36,0.35), inset 0 1px 0 rgba(255,255,255,0.3)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  {t('feedback.send') || 'Gửi đánh giá'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function FeedbackModal(props: FeedbackModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <FeedbackModalContent {...props} />,
    document.body
  )
}
