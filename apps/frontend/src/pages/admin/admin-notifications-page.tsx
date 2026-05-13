import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/page-header'
import { adminApi, BroadcastNotificationPayload } from '@/services/admin-api'
import { apiClient } from '@/lib/api-client'

type NotificationType = 'system' | 'survey' | 'announcement'
type ActionType = 'none' | 'rate_app'
type TargetType = 'all' | 'active' | 'inactive' | 'selected'

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'announcement', label: 'Thông báo chung' },
  { value: 'survey', label: 'Khảo sát / Đánh giá' },
  { value: 'system', label: 'Hệ thống' },
]

const ACTION_TYPES: { value: ActionType; label: string; description: string }[] = [
  { value: 'none', label: 'Không có hành động', description: 'Chỉ hiển thị thông báo' },
  { value: 'rate_app', label: 'Mở popup đánh giá', description: 'Khi ấn vào sẽ hiện popup đánh giá ứng dụng' },
]

const TARGET_TYPES: { value: TargetType; label: string }[] = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'active', label: 'Người dùng đã thi' },
  { value: 'inactive', label: 'Người dùng chưa thi' },
  { value: 'selected', label: 'Chọn người dùng cụ thể' },
]

interface SentNotification {
  id: string
  title: string
  message: string
  notification_type: NotificationType
  action_type: ActionType
  recipient_count: number
  created_at: string
}

function CreateNotificationModal({
  onClose,
  onSuccess
}: {
  onClose: () => void
  onSuccess: (count: number) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notificationType, setNotificationType] = useState<NotificationType>('announcement')
  const [actionType, setActionType] = useState<ActionType>('none')
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [targetIds, setTargetIds] = useState('')
  const [excludeAdmin, setExcludeAdmin] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề thông báo')
      return
    }
    if (!message.trim()) {
      setError('Vui lòng nhập nội dung thông báo')
      return
    }

    const payload: BroadcastNotificationPayload = {
      title: title.trim(),
      message: message.trim(),
      notification_type: notificationType,
      action_type: actionType,
      target_type: targetType,
      exclude_admin: excludeAdmin,
    }

    if (targetType === 'selected' && targetIds.trim()) {
      const ids = targetIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      if (ids.length === 0) {
        setError('Vui lòng nhập danh sách ID người dùng hợp lệ')
        return
      }
      payload.target_ids = ids
    }

    setLoading(true)
    try {
      const result = await adminApi.broadcastNotification(payload)
      setSuccess(`Đã gửi thông báo đến ${result.sent_count} người dùng!`)
      onSuccess(result.sent_count)
      setTimeout(onClose, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gửi thông báo thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
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
        backdropFilter: 'blur(8px)',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#1c1c1e',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
            Tạo thông báo mới
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Success */}
        {success && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(48, 209, 88, 0.15)',
            border: '1px solid rgba(48, 209, 88, 0.3)',
            color: '#30d158',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(255, 69, 58, 0.15)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            color: '#ff453a',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              Tiêu đề *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Khảo sát mức độ hài lòng"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Message */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Nội dung *
              </label>
              <span style={{
                fontSize: '11px',
                color: message.length > 5000 ? '#ff453a' : message.length > 4500 ? '#ff9f0a' : 'rgba(255,255,255,0.4)',
                fontWeight: message.length > 4500 ? 600 : 400,
              }}>
                {message.length} / 5000
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => {
                const newValue = e.target.value
                if (newValue.length <= 5000) {
                  setMessage(newValue)
                }
              }}
              onPaste={(e) => {
                e.preventDefault()
                const pastedText = e.clipboardData.getData('text')
                const currentLength = message.length
                const remainingChars = 5000 - currentLength
                if (remainingChars > 0) {
                  const truncatedText = pastedText.slice(0, remainingChars)
                  setMessage(message + truncatedText)
                }
              }}
              placeholder="Nhập nội dung thông báo..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${message.length > 5000 ? 'rgba(255,69,58,0.5)' : 'rgba(255,255,255,0.12)'}`,
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
            />
          </div>

          {/* Notification Type */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              Loại thông báo
            </label>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value as NotificationType)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type.value} value={type.value} style={{ background: '#1c1c1e' }}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              Hành động khi nhấn
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ActionType)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value} style={{ background: '#1c1c1e' }}>
                  {type.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              {ACTION_TYPES.find(a => a.value === actionType)?.description}
            </p>
          </div>

          {/* Target Type */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              Gửi đến
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as TargetType)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {TARGET_TYPES.map((type) => (
                <option key={type.value} value={type.value} style={{ background: '#1c1c1e' }}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target IDs */}
          {targetType === 'selected' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                Danh sách User IDs
              </label>
              <input
                type="text"
                value={targetIds}
                onChange={(e) => setTargetIds(e.target.value)}
                placeholder="1, 2, 3, 4, 5"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                Nhập danh sách ID người dùng, cách nhau bằng dấu phẩy
              </p>
            </div>
          )}

          {/* Exclude Admin */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={excludeAdmin}
              onChange={(e) => setExcludeAdmin(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#0071e3' }}
            />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              Không gửi đến tài khoản admin
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? 'rgba(0,113,227,0.5)' : '#0071e3',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Đang gửi...' : 'Gửi Thông báo'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<SentNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<NotificationType | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchNotifications = async (p: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams()
      query.append('page', p.toString())
      if (filter !== 'all') {
        query.append('notification_type', filter)
      }
      const response = await apiClient.get<{
        data: SentNotification[]
        links: { total_pages: number; count: number }
      }>(`/notifications/admin/history/?${query.toString()}`)
      setNotifications(response.data || [])
      setTotalPages(response.links?.total_pages || 1)
      setTotalCount(response.links?.count || 0)
    } catch (err) {
      setError('Không thể tải danh sách thông báo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(page)
  }, [page, filter])

  const handleSuccess = (_count: number) => {
    fetchNotifications(1)
    setPage(1)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      announcement: { bg: 'rgba(0,113,227,0.2)', text: '#0071e3' },
      survey: { bg: 'rgba(255,159,10,0.2)', text: '#ff9f0a' },
      system: { bg: 'rgba(48,209,88,0.2)', text: '#30d158' },
      wallet: { bg: 'rgba(168,85,247,0.2)', text: '#a855f7' },
      chat: { bg: 'rgba(56,189,248,0.2)', text: '#38bdf8' },
    }
    const labels: Record<string, string> = {
      announcement: 'Thông báo',
      survey: 'Khảo sát',
      system: 'Hệ thống',
      wallet: 'Ví xu',
      chat: 'Chat',
    }
    const color = colors[type] || { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' }
    const label = labels[type] || type
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        background: color.bg,
        color: color.text,
      }}>
        {label}
      </span>
    )
  }

  const getActionBadge = (action: string) => {
    if (action === 'rate_app') {
      return (
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 500,
          background: 'rgba(251,191,36,0.2)',
          color: '#fbbf24',
        }}>
          ⭐ Mở đánh giá
        </span>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <PageHeader
          title="Thông báo"
          subtitle="Danh sách thông báo đã gửi"
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(['all', 'announcement', 'survey', 'system'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setFilter(type); setPage(1) }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: filter === type ? '#0071e3' : 'rgba(255,255,255,0.12)',
                  background: filter === type ? 'rgba(0,113,227,0.2)' : 'transparent',
                  color: filter === type ? '#0071e3' : 'rgba(255,255,255,0.6)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {type === 'all' ? 'Tất cả' : type === 'announcement' ? 'Thông báo' : type === 'survey' ? 'Khảo sát' : 'Hệ thống'}
              </button>
            ))}
          </div>

          {/* Send Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0071e3',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Gửi thông báo
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(255, 69, 58, 0.15)',
          border: '1px solid rgba(255, 69, 58, 0.3)',
          color: '#ff453a',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
      }}>
        <div style={{
          background: '#272729',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Tổng thông báo</div>
        </div>
        <div style={{
          background: '#272729',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0071e3' }}>
            {notifications.filter(n => n.notification_type === 'announcement').length}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Thông báo</div>
        </div>
        <div style={{
          background: '#272729',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff9f0a' }}>
            {notifications.filter(n => n.notification_type === 'survey').length}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Khảo sát</div>
        </div>
      </div>

      {/* List */}
      <div style={{ background: '#272729', borderRadius: '12px', overflow: 'hidden' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Đang tải...
          </div>
        ) : !loading && notifications.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Chưa có thông báo nào được gửi
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)' }}>
                    TIÊU ĐỀ
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)', display: { xs: 'none', sm: 'table-cell' } as any }}>
                    LOẠI
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)', display: { xs: 'none', md: 'table-cell' } as any }}>
                    HÀNH ĐỘNG
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)', display: { xs: 'none', md: 'table-cell' } as any }}>
                    NGƯỜI NHẬN
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)' }}>
                    NGÀY GỬI
                  </th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 500, color: '#fff', wordBreak: 'break-word' }}>{notif.title}</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', lineHeight: '1.4' }}>
                          {notif.message}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', display: { xs: 'none', sm: 'table-cell' } as any }}>
                      {getTypeBadge(notif.notification_type)}
                    </td>
                    <td style={{ padding: '12px 16px', display: { xs: 'none', md: 'table-cell' } as any }}>
                      {getActionBadge(notif.action_type)}
                    </td>
                    <td style={{ padding: '12px 16px', display: { xs: 'none', md: 'table-cell' } as any, textAlign: 'center' }}>
                      <span style={{
                        background: 'rgba(48,209,88,0.15)',
                        color: '#30d158',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {notif.recipient_count} người
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {formatDate(notif.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <span>Trang {page}/{totalPages} · {totalCount} thông báo</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: page === 1 ? 'transparent' : 'rgba(255,255,255,0.06)',
                  color: page === 1 ? 'rgba(255,255,255,0.25)' : '#fff',
                  cursor: page === 1 ? 'default' : 'pointer',
                  fontSize: '12px',
                }}
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: page === totalPages ? 'transparent' : 'rgba(255,255,255,0.06)',
                  color: page === totalPages ? 'rgba(255,255,255,0.25)' : '#fff',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  fontSize: '12px',
                }}
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateNotificationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
