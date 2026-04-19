import { useEffect, useState, useRef } from 'react'
import { chatApi, type ChatMessage } from '@/services/chat-api'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'

const userBubbleStyle: React.CSSProperties = {
    alignSelf: 'flex-end',
    background: '#0071e3',
    color: '#fff',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 16px',
    maxWidth: '80%',
    fontSize: '15px',
    lineHeight: '1.4'
}

const adminBubbleStyle: React.CSSProperties = {
    alignSelf: 'flex-start',
    background: '#2c2c2e',
    color: '#fff',
    borderRadius: '18px 18px 18px 4px',
    padding: '10px 16px',
    maxWidth: '80%',
    fontSize: '15px',
    lineHeight: '1.4'
}

export default function ChatPage() {
    const { t } = useTranslation()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const fetchMessages = async () => {
        try {
            const data: any = await chatApi.getMessages()
            const msgList = Array.isArray(data) ? data : (data.data || data.results || [])
            setMessages(msgList)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        fetchMessages()
        const timer = setInterval(fetchMessages, 10000) // Poll every 10s
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const msg = await chatApi.sendMessage(newMessage)
            setMessages([...messages, msg])
            setNewMessage('')
        } catch (err) {
            console.error(err)
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            <PageHeader
                title={t('chat.title')}
                subtitle={t('chat.subtitle')}
            />

            <div style={{
                flex: 1,
                background: '#1c1c1e',
                borderRadius: '20px',
                marginTop: '24px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                {/* Chat Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {loading && messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: '40px' }}>{t('chat.loading')}</div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: '40px' }}>
                            {t('chat.start_conversation')}
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                style={msg.sender_type === 'user' ? userBubbleStyle : adminBubbleStyle}
                            >
                                {msg.message}
                                <div style={{
                                    fontSize: '10px',
                                    opacity: 0.5,
                                    marginTop: '4px',
                                    textAlign: msg.sender_type === 'user' ? 'right' : 'left'
                                }}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSend}
                    style={{
                        padding: '16px 24px',
                        background: 'rgba(255,255,255,0.03)',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        gap: '12px'
                    }}
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={t('chat.placeholder')}
                        style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            padding: '10px 20px',
                            color: '#fff',
                            fontSize: '15px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        style={{
                            background: '#0071e3',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: sending || !newMessage.trim() ? 0.5 : 1
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    )
}
