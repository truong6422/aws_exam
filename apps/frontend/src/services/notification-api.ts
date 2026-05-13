import { apiClient } from '@/lib/api-client'

export interface Notification {
    id: number
    title: string
    message: string
    notification_type: 'wallet' | 'chat' | 'system' | 'survey' | 'announcement'
    link: string | null
    action_type: 'none' | 'open_url' | 'open_form' | 'rate_app' | 'rate_exam' | 'view_exam'
    action_data: Record<string, any>
    is_read: boolean
    created_at: string
}

export const notificationApi = {
    getNotifications: () => apiClient.list<Notification>('/notifications/'),
    getUnreadCount: () => apiClient.get<{ unread_count: number }>('/notifications/unread-count/'),
    markAllRead: () => apiClient.post('/notifications/mark-read/', {}),
    markRead: (id: number) => apiClient.post(`/notifications/${id}/mark-read/`, {})
}
