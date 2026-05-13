import { useEffect, useState, useRef } from 'react'
import { notificationApi, type Notification } from '@/services/notification-api'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FeedbackModal } from '@/components/feedback/feedback-modal'
import { feedbackApi } from '@/services/feedback-api'
import type { FeedbackRating } from '@/services/feedback-api'

export default function NotificationCenter() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const lang = i18n.language === 'en' ? 'en-US' : 'vi-VN'
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
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
        setIsOpen(false)

        if (notif.action_type === 'rate_app') {
            setShowFeedbackModal(true)
        } else if (notif.link) {
            navigate(notif.link)
        }
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

            {showFeedbackModal && (
                <FeedbackModal
                    onClose={() => setShowFeedbackModal(false)}
                    onSubmit={handleFeedbackSubmit}
                />
            )}
        </>
    )
}
