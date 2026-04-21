import { useEffect, useState, useRef } from 'react'
import { adminApi } from '@/services/admin-api'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { useIsMobile } from '@/hooks/use-is-mobile'

export default function AdminChatPage() {
    const { t } = useTranslation()
    const isMobile = useIsMobile()
    const [sessions, setSessions] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any | null>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loadingSessions, setLoadingSessions] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const fetchSessions = async () => {
        try {
            const data: any = await adminApi.getChatSessions()
            // Handle custom pagination (data field)
            const sessionList = Array.isArray(data) ? data : (data.data || data.results || [])
            setSessions(sessionList)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingSessions(false)
        }
    }

    const fetchMessages = async (userId: number) => {
        try {
            const data: any = await adminApi.getChatMessages(userId)
            // Handle custom pagination (data field)
            const msgList = Array.isArray(data) ? data : (data.data || data.results || [])
            setMessages(msgList)
        } catch (err) {
            console.error(err)
        } finally {
        }
    }

    useEffect(() => {
        fetchSessions()
        const timer = setInterval(fetchSessions, 15000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id)
            const msgTimer = setInterval(() => fetchMessages(selectedUser.id), 5000)
            return () => clearInterval(msgTimer)
        }
    }, [selectedUser])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser || !newMessage.trim() || sending) return

        setSending(true)
        try {
            const msg = await adminApi.sendChatMessage(selectedUser.id, newMessage)
            setMessages([...messages, msg])
            setNewMessage('')
            fetchSessions() // Update last message in list
        } catch (err) {
            console.error(err)
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            <PageHeader title={t('admin.chat.title')} subtitle={t('admin.chat.subtitle')} />

            <div style={{
                flex: 1,
                display: 'flex',
                background: '#1c1c1e',
                borderRadius: '20px',
                marginTop: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                {/* User List — hidden on mobile when a user is selected */}
                {(!isMobile || !selectedUser) && (
                <div style={{
                    width: isMobile ? '100%' : 'min(300px, 40%)',
                    borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '14px', fontWeight: 600 }}>
                        {t('admin.chat.sessions_count', { count: sessions.length })}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loadingSessions && sessions.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.3 }}>{t('admin.chat.loading')}</div>
                        ) : (
                            sessions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedUser(s)}
                                    style={{
                                        padding: '16px',
                                        cursor: 'pointer',
                                        background: selectedUser?.id === s.id ? 'rgba(0,113,227,0.1)' : 'transparent',
                                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{s.name}</span>
                                        {s.unread_count > 0 && (
                                            <span style={{ background: '#ff3b30', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>{s.unread_count}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {s.last_message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                )}

                {/* Chat Window — full width on mobile when user is selected */}
                {(!isMobile || selectedUser) && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {selectedUser ? (
                        <>
                            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {isMobile && (
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', fontSize: '18px', lineHeight: 1 }}
                                        aria-label="Back"
                                    >
                                        ←
                                    </button>
                                )}
                                <span style={{ fontWeight: 600 }}>{selectedUser.name} ({selectedUser.email})</span>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {messages && messages.length > 0 ? (
                                    messages.map((msg: any) => (
                                        <div
                                            key={msg.id}
                                            style={{
                                                alignSelf: msg.sender_type === 'admin' ? 'flex-end' : 'flex-start',
                                                background: msg.sender_type === 'admin' ? '#0071e3' : '#2c2c2e',
                                                color: '#fff',
                                                padding: '10px 16px',
                                                borderRadius: '18px',
                                                maxWidth: '70%',
                                                fontSize: '14px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <div style={{ wordBreak: 'break-word' }}>{msg.message}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', marginTop: '20px' }}>{t('admin.chat.no_messages')}</div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSend} style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px' }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder={t('admin.chat.reply_placeholder')}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        padding: '10px 16px',
                                        color: '#fff'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    style={{
                                        background: '#0071e3', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 20px', cursor: 'pointer', opacity: (sending || !newMessage.trim()) ? 0.5 : 1
                                    }}
                                >
                                    {t('admin.chat.send')}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                            {t('admin.chat.select_session')}
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    )
}
