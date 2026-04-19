import { apiClient } from '@/lib/api-client'

export interface Notification {
    id: number
    title: string
    message: string
    notification_type: 'wallet' | 'chat' | 'system'
    link: string | null
    is_read: boolean
    created_at: string
}

export const notificationApi = {
    getNotifications: () => apiClient.list<Notification>('/notifications/'),
    getUnreadCount: () => apiClient.get<{ unread_count: number }>('/notifications/unread-count/'),
    markAllRead: () => apiClient.post('/notifications/mark-read/', {}),
    markRead: (id: number) => apiClient.post(`/notifications/${id}/mark-read/`, {})
}
