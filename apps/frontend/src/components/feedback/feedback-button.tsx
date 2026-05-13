import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { feedbackApi, type FeedbackRating } from '@/services/feedback-api'
import { FeedbackModal } from './feedback-modal'

interface FeedbackButtonProps {
  variant?: 'button' | 'icon'
}

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
)

export function FeedbackButton({ variant = 'icon' }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return null

  const handleSubmit = async (rating: FeedbackRating, comment: string) => {
    await feedbackApi.submit({ rating, comment })
  }

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '10px',
            cursor: 'pointer',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#fbbf24',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(251,191,36,0.1) 100%)'
            e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(251,191,36,0.2), 0 4px 12px rgba(0,0,0,0.3)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)'
            e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          title="Đánh giá ứng dụng"
          aria-label="Đánh giá ứng dụng"
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}>
            <StarIcon />
          </span>
          <span style={{ letterSpacing: '0.3px' }}>Đánh giá</span>
        </button>

        <style>{`
          @keyframes pulse-glow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
        `}</style>

        {isOpen && (
          <FeedbackModal
            onClose={() => setIsOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          zIndex: 999,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(102, 126, 234, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)'
        }}
        title="Gửi phản hồi"
      >
        💬
      </button>

      {isOpen && (
        <FeedbackModal
          onClose={() => setIsOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  )
}

export default FeedbackButton
