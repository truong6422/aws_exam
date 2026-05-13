import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PageHeader from '@/components/ui/page-header'
import { feedbackApi, type FeedbackItem, type FeedbackRating } from '@/services/feedback-api'

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  reviewed: '#3b82f6',
  resolved: '#22c55e',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Mới',
  reviewed: 'Đã xem',
  resolved: 'Đã xử lý',
}

const RATING_LABELS: Record<number, { text: string; color: string; icon: string }> = {
  1: { text: 'Rất không hài lòng', color: '#ef4444', icon: '😠' },
  2: { text: 'Không hài lòng', color: '#f97316', icon: '😕' },
  3: { text: 'Bình thường', color: '#fbbf24', icon: '😐' },
  4: { text: 'Hài lòng', color: '#84cc16', icon: '🙂' },
  5: { text: 'Rất hài lòng', color: '#22c55e', icon: '😄' },
}

const StarDisplay = ({ rating, size = 24 }: { rating: number; size?: number }) => (
  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
          stroke={star <= rating ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
          strokeWidth="1"
        />
      </svg>
    ))}
  </div>
)

function FeedbackDetailModal({ 
  feedback, 
  onClose, 
  onStatusUpdate,
  isUpdating 
}: { 
  feedback: FeedbackItem
  onClose: () => void
  onStatusUpdate: (id: number, status: 'reviewed' | 'resolved') => Promise<void>
  isUpdating: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleCopy = async () => {
    const text = `Đánh giá ${feedback.rating}/5 sao
Người dùng: ${feedback.user_name || feedback.user_email || 'Ẩn danh'}
Trạng thái: ${STATUS_LABELS[feedback.status]}
Thời gian: ${new Date(feedback.created_at).toLocaleString('vi-VN')}
Bình luận: ${feedback.comment || '(Không có)'}`

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ratingInfo = RATING_LABELS[feedback.rating] || RATING_LABELS[3]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!mounted) return null

  return createPortal(
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
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ 
              color: '#fff', 
              fontSize: '18px', 
              fontWeight: 700, 
              margin: '0 0 2px' 
            }}>
              Chi tiết đánh giá
            </h2>
            <p style={{ 
              color: 'rgba(255,255,255,0.5)', 
              fontSize: '11px', 
              margin: 0 
            }}>
              #{feedback.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: '16px 20px', 
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Rating Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: `${ratingInfo.color}20`,
              border: `2px solid ${ratingInfo.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0,
            }}>
              {ratingInfo.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <StarDisplay rating={feedback.rating} size={18} />
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: ratingInfo.color 
                }}>
                  {feedback.rating}/5
                </span>
              </div>
              <p style={{ 
                fontSize: '12px', 
                fontWeight: 500, 
                color: ratingInfo.color,
                margin: 0 
              }}>
                {ratingInfo.text}
              </p>
            </div>
          </div>

          {/* User & Status Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
            }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>
                Người dùng
              </p>
              <p style={{ fontSize: '12px', color: '#fff', margin: 0, fontWeight: 500, wordBreak: 'break-word' }}>
                {feedback.user_name || feedback.user_email || 'Ẩn danh'}
              </p>
            </div>
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
            }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>
                Trạng thái
              </p>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '16px',
                background: `${STATUS_COLORS[feedback.status]}20`,
                color: STATUS_COLORS[feedback.status],
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: STATUS_COLORS[feedback.status],
                }} />
                {STATUS_LABELS[feedback.status]}
              </span>
            </div>
          </div>

          {/* Date */}
          <div style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>
              Thời gian
            </p>
            <p style={{ fontSize: '12px', color: '#fff', margin: 0 }}>
              {formatDate(feedback.created_at)}
            </p>
          </div>

          {/* Comment */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 500 }}>
                Nội dung đánh giá
              </p>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  color: copied ? '#22c55e' : 'rgba(255,255,255,0.6)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Đã copy
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div style={{
              padding: '14px',
              background: feedback.comment ? 'rgba(255,255,255,0.04)' : 'transparent',
              borderRadius: '12px',
              border: feedback.comment ? '1px solid rgba(255,255,255,0.08)' : 'none',
              minHeight: '80px',
            }}>
              {feedback.comment ? (
                <p style={{
                  fontSize: '13px',
                  color: '#fff',
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {feedback.comment}
                </p>
              ) : (
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.4)',
                  fontStyle: 'italic',
                  margin: 0,
                  textAlign: 'center',
                  padding: '16px 0',
                }}>
                  Không có bình luận
                </p>
              )}
            </div>
            {feedback.comment && (
              <p style={{ 
                fontSize: '10px', 
                color: 'rgba(255,255,255,0.4)', 
                margin: '6px 0 0',
                textAlign: 'right',
              }}>
                {feedback.comment.length} ký tự
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: '1 1 auto',
              minWidth: '80px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
          {feedback.status === 'new' && (
            <button
              onClick={() => onStatusUpdate(feedback.id, 'reviewed')}
              disabled={isUpdating}
              style={{
                flex: '2 1 auto',
                minWidth: '140px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Đánh dấu đã xem
            </button>
          )}
          {feedback.status === 'reviewed' && (
            <button
              onClick={() => onStatusUpdate(feedback.id, 'resolved')}
              disabled={isUpdating}
              style={{
                flex: '2 1 auto',
                minWidth: '140px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Đánh dấu đã xử lý
            </button>
          )}
          {feedback.status === 'resolved' && (
            <div style={{
              flex: '2 1 auto',
              minWidth: '140px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22c55e',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Đã hoàn tất
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)

  const fetchFeedbacks = (p: number, status: string) => {
    setLoading(true)
    setError('')
    feedbackApi
      .list({ page: p, status: status || undefined })
      .then((res) => {
        setFeedbacks(res.data || [])
        setTotalPages(res.links?.total_pages ?? 1)
        setTotalCount(res.links?.count ?? 0)
      })
      .catch(() => setError('Không thể tải danh sách phản hồi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchFeedbacks(page, statusFilter)
  }, [page, statusFilter])

  const handleStatusUpdate = async (id: number, newStatus: 'reviewed' | 'resolved') => {
    setUpdatingId(id)
    try {
      await feedbackApi.updateStatus(id, newStatus)
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
      )
      if (selectedFeedback?.id === id) {
        setSelectedFeedback((prev) => prev ? { ...prev, status: newStatus } : null)
      }
    } catch {
      setError('Không thể cập nhật trạng thái.')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const countByStatus = (status: string) =>
    feedbacks.filter((f) => f.status === status).length

  const countByRating = (rating: FeedbackRating) =>
    feedbacks.filter((f) => f.rating === rating).length

  const getAverageRating = () => {
    if (feedbacks.length === 0) return 0
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0)
    return (sum / feedbacks.length).toFixed(1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 0 24px' }}>
      <PageHeader title="Phản hồi" subtitle="Quản lý đánh giá từ người dùng" />

      {/* Stats cards - Responsive Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {/* Average rating */}
        <div
          style={{
            background: 'linear-gradient(145deg, #272729 0%, #1c1c1e 100%)',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
            Điểm TB
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: '#fbbf24' }}>
              {getAverageRating()}
            </span>
            <StarDisplay rating={Math.round(Number(getAverageRating()))} size={16} />
          </div>
        </div>

        {/* Total */}
        <div
          style={{
            background: 'linear-gradient(145deg, #272729 0%, #1c1c1e 100%)',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
            Tổng cộng
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff' }}>
            {totalCount}
          </div>
        </div>

        {/* Status cards */}
        {(['new', 'reviewed', 'resolved'] as const).map((status) => (
          <div
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            style={{
              background: statusFilter === status ? `${STATUS_COLORS[status]}15` : 'linear-gradient(145deg, #272729 0%, #1c1c1e 100%)',
              borderRadius: '14px',
              padding: '14px',
              cursor: 'pointer',
              border: statusFilter === status ? `2px solid ${STATUS_COLORS[status]}` : '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
              {STATUS_LABELS[status]}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: STATUS_COLORS[status] }}>
              {countByStatus(status)}
            </div>
          </div>
        ))}
      </div>

      {/* Rating distribution - Horizontal Scroll on Mobile */}
      <div
        style={{
          background: 'linear-gradient(145deg, #272729 0%, #1c1c1e 100%)',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflowX: 'auto',
        }}
      >
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
          Phân bổ đánh giá
        </div>
        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
          {([5, 4, 3, 2, 1] as FeedbackRating[]).map((rating) => {
            const ratingInfo = RATING_LABELS[rating]
            return (
              <div
                key={rating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ fontSize: '16px' }}>{ratingInfo.icon}</span>
                <StarDisplay rating={rating} size={12} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24', minWidth: '16px' }}>
                  {countByRating(rating)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters - Scrollable on Mobile */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => { setStatusFilter(''); setPage(1) }}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: '1px solid',
            borderColor: !statusFilter ? '#0071e3' : 'rgba(255,255,255,0.15)',
            background: !statusFilter ? 'rgba(0,113,227,0.2)' : 'transparent',
            color: !statusFilter ? '#2997ff' : 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Tất cả
        </button>
        {(['new', 'reviewed', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setPage(1) }}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: statusFilter === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.15)',
              background: statusFilter === status ? `${STATUS_COLORS[status]}20` : 'transparent',
              color: statusFilter === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(224,69,60,0.1)', border: '1px solid rgba(224,69,60,0.4)', borderRadius: '12px', padding: '14px', fontSize: '13px', color: '#e0453c' }}>
            {error}
          </div>
        )}

        {!loading && !error && feedbacks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', opacity: 0.3 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p style={{ fontSize: '13px' }}>Chưa có phản hồi nào</p>
          </div>
        )}

        {!loading && !error && feedbacks.map((fb) => {
          const ratingInfo = RATING_LABELS[fb.rating] || RATING_LABELS[3]
          return (
            <div
              key={fb.id}
              onClick={() => setSelectedFeedback(fb)}
              style={{
                background: 'linear-gradient(145deg, #272729 0%, #1c1c1e 100%)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                cursor: 'pointer',
                border: selectedFeedback?.id === fb.id ? '2px solid rgba(0,113,227,0.5)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Rating indicator */}
              <div
                style={{
                  flexShrink: 0,
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: `${ratingInfo.color}15`,
                  border: `1px solid ${ratingInfo.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                {ratingInfo.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {/* Status badge */}
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      background: `${STATUS_COLORS[fb.status]}20`,
                      color: STATUS_COLORS[fb.status],
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      flexShrink: 0,
                    }}
                  >
                    {STATUS_LABELS[fb.status]}
                  </span>

                  <StarDisplay rating={fb.rating} size={12} />

                  {/* Date */}
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                    {formatDate(fb.created_at)}
                  </span>
                </div>

                {/* User */}
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>
                  {fb.user_name || fb.user_email || 'Ẩn danh'}
                </p>

                {/* Comment preview */}
                {fb.comment ? (
                  <p style={{
                    fontSize: '12px',
                    color: '#fff',
                    lineHeight: 1.5,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {fb.comment}
                  </p>
                ) : (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0 }}>
                    Không có nội dung
                  </p>
                )}
              </div>

              {/* Arrow indicator */}
              <div style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination - Responsive */}
      {!loading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', paddingTop: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: page === 1 ? 'transparent' : 'rgba(255,255,255,0.06)',
              color: page === 1 ? 'rgba(255,255,255,0.25)' : '#fff',
              cursor: page === 1 ? 'default' : 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Trước
          </button>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>{page}</span>
            <span style={{ margin: '0 4px' }}>/</span>
            {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: page === totalPages ? 'transparent' : 'rgba(255,255,255,0.06)',
              color: page === totalPages ? 'rgba(255,255,255,0.25)' : '#fff',
              cursor: page === totalPages ? 'default' : 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Tiếp
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={updatingId === selectedFeedback.id}
        />
      )}
    </div>
  )
}
