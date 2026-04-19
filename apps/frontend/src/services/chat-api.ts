import { apiClient } from '@/lib/api-client'

export interface ChatMessage {
    id: number
    sender_type: 'user' | 'admin'
    message: string
    is_read: boolean
    created_at: string
}

export const chatApi = {
    getMessages: () => apiClient.list<ChatMessage>('/chat/messages/'),
    sendMessage: (message: string) => apiClient.post<ChatMessage>('/chat/send/', { message }),
}
