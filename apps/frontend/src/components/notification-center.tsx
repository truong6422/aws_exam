import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { notificationApi, type Notification } from '@/services/notification-api'
import { useTranslation } from 'react-i18next'
import { FeedbackModal } from '@/components/feedback/feedback-modal'
import { feedbackApi } from '@/services/feedback-api'
import type { FeedbackRating } from '@/services/feedback-api'

const NOTIF_TYPE_LABELS: Record<string, string> = {
  wallet: 'Ví xu',
  chat: 'Chat',
  system: 'Hệ thống',
  survey: 'Khảo sát',
  announcement: 'Thông báo',
}

const NOTIF_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  wallet: { bg: 'rgba(168,85,247,0.2)', text: '#a855f7' },
  chat: { bg: 'rgba(56,189,248,0.2)', text: '#38bdf8' },
  system: { bg: 'rgba(48,209,88,0.2)', text: '#30d158' },
  survey: { bg: 'rgba(255,159,10,0.2)', text: '#ff9f0a' },
  announcement: { bg: 'rgba(0,113,227,0.2)', text: '#0071e3' },
}

function NotificationDetailModal({
  notification,
  onClose,
  onOpenFeedback,
}: {
  notification: Notification
  onClose: () => void
  onOpenFeedback: () => void
}) {
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const typeColor = NOTIF_TYPE_COLORS[notification.notification_type] || { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' }
  const typeLabel = NOTIF_TYPE_LABELS[notification.notification_type] || notification.notification_type

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
          maxWidth: '480px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: typeColor.bg,
              color: typeColor.text,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}>
              {typeLabel}
            </span>
            {notification.action_type === 'rate_app' && (
              <span style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(251,191,36,0.2)',
                color: '#fbbf24',
                fontWeight: 600,
              }}>
                ⭐ Đánh giá
              </span>
            )}
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
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Title */}
          <h2 style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
            margin: '0 0 12px',
            lineHeight: 1.3,
          }}>
            {notification.title}
          </h2>

          {/* Date */}
          <p style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            margin: '0 0 16px',
          }}>
            {formatDate(notification.created_at)}
          </p>

          {/* Message */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{
              fontSize: '14px',
              color: '#fff',
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {notification.message}
            </p>
          </div>

          {/* Character count */}
          <p style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            margin: '8px 0 0',
            textAlign: 'right',
          }}>
            {notification.message.length} ký tự
          </p>
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
          {notification.action_type === 'rate_app' && (
            <button
              onClick={onOpenFeedback}
              style={{
                flex: '2 1 auto',
                minWidth: '160px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#000',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(251,191,36,0.3)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Đánh giá ngay
            </button>
          )}
          {notification.action_type !== 'rate_app' && notification.link && (
            <button
              onClick={() => {
                onClose()
                window.location.href = notification.link!
              }}
              style={{
                flex: '2 1 auto',
                minWidth: '160px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0,113,227,0.3)',
              }}
            >
              Xem chi tiết
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function NotificationCenter() {
    const { t, i18n } = useTranslation()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const lang = i18n.language === 'en' ? 'en-US' : 'vi-VN'
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const [list, count] = await Promise.all([
                notificationApi.getNotifications(),
                notificationApi.getUnreadCount()
            ])
            setNotifications(list)
            setUnreadCount(count.unread_count)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const timer = setInterval(() => {
            notificationApi.getUnreadCount().then(res => setUnreadCount(res.unread_count))
        }, 30000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleToggle = () => {
        if (!isOpen) {
            fetchNotifications()
        }
        setIsOpen(!isOpen)
    }

    const handleMarkAllRead = async () => {
        await notificationApi.markAllRead()
        setNotifications(notifications.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.is_read) {
            await notificationApi.markRead(notif.id)
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
        // Open detail modal instead of directly navigating
        setSelectedNotification(notif)
    }

    const handleOpenFeedback = () => {
        setSelectedNotification(null)
        setShowFeedbackModal(true)
    }

    const handleCloseDetail = () => {
        setSelectedNotification(null)
    }

    const handleFeedbackSubmit = async (rating: FeedbackRating, comment: string) => {
        await feedbackApi.submit({ rating, comment })
    }

    return (
        <>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                    onClick={handleToggle}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
                        display: 'flex', alignItems: 'center', position: 'relative'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: '6px', right: '6px', background: '#ff3b30',
                            color: '#fff', fontSize: '9px', fontWeight: 700, minWidth: '14px',
                            height: '14px', borderRadius: '7px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', border: '1.5px solid #000'
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div style={{
                        position: 'absolute', top: '40px', right: 0, width: '320px',
                        background: '#1d1d1f', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        zIndex: 100, overflow: 'hidden'
                    }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{t('notifications.title')}</span>
                            <button
                                onClick={handleMarkAllRead}
                                style={{ background: 'none', border: 'none', color: '#0071e3', fontSize: '12px', cursor: 'pointer' }}
                            >
                                {t('notifications.mark_all_read')}
                            </button>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {loading && notifications.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{t('common.loading')}</div>
                            ) : notifications.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{t('notifications.empty')}</div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        style={{
                                            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.02)',
                                            background: n.is_read ? 'transparent' : 'rgba(0,113,227,0.05)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{n.title}</div>
                                            {n.action_type !== 'none' && (
                                                <span style={{
                                                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                    background: 'rgba(0,113,227,0.2)', color: '#0071e3', flexShrink: 0
                                                }}>
                                                    {n.action_type === 'rate_app' ? '⭐' : '🔗'}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>{n.message}</div>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                                            {new Date(n.created_at).toLocaleString(lang)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    onClose={handleCloseDetail}
                    onOpenFeedback={handleOpenFeedback}
                />
            )}

            {showFeedbackModal && (
                <FeedbackModal
                    onClose={() => setShowFeedbackModal(false)}
                    onSubmit={handleFeedbackSubmit}
                />
            )}
        </>
    )
}
