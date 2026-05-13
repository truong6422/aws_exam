/**
 * Admin API service — wraps import and question management endpoints.
 * Reuses certifications/domains from exam-api for question browsing.
 */
import { apiClient } from '@/lib/api-client'
import type { Certification } from '@/services/exam-api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportAnswer {
  text: string
  is_correct: boolean
}

export interface ImportQuestion {
  text: string
  explanation?: string
  source?: string
  question_type?: 'single' | 'multiple'
  answers: ImportAnswer[]
}

export interface ImportPayload {
  certification_code: string
  domain_name: string
  questions: ImportQuestion[]
}

export interface ImportResult {
  imported: number
  errors: string[]
}

export interface AdminUser {
  id: number
  email: string
  username: string
  name: string
  date_joined: string
  is_staff: boolean
  is_active: boolean
  last_login: string | null
  total_exam_seconds?: number
  total_questions_done?: number
  total_comments?: number
}

export interface PaginatedUsers {
  data: AdminUser[]
  links: {
    prev: string | null
    next: string | null
    current_page: number
    total_pages: number
    count: number
  }
}

export interface DashboardStats {
  users: number
  certifications: number
  questions: number
  exam_sets: {
    total: number
    unlocked: number
    locked: number
  }
  total_time_seconds: number
  total_questions_done: number
}

export interface TopUpRequestAdmin {
  id: number
  user_id: number
  user_email: string
  user_name: string
  amount_credits: number
  amount_vnd: number
  transaction_code: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string
  created_at: string
  approved_at: string | null
}

export interface BroadcastNotificationPayload {
  title: string
  message: string
  notification_type: 'system' | 'survey' | 'announcement'
  action_type: 'none' | 'rate_app'
  link?: string
  target_type: 'all' | 'active' | 'inactive' | 'selected'
  target_ids?: number[]
  exclude_admin?: boolean
}

export interface BroadcastResult {
  status: 'ok'
  sent_count: number
  message: string
}

// ── API ───────────────────────────────────────────────────────────────────────

export const adminApi = {
  importQuestions: (data: ImportPayload) =>
    apiClient.post<ImportResult>('/imports/questions/', data),

  getCertifications: () =>
    apiClient.list<Certification>('/questions/certifications/'),

  getExamSets: (certId: number) =>
    apiClient.list<any>(`/questions/certifications/${certId}/sets/`),

  updateExamSet: (setId: number, data: { is_locked?: boolean; price_credits?: number }) =>
    apiClient.patch<any>(`/questions/sets/${setId}/`, data),

  bulkUpdateExamSets: (ids: number[], data: { is_locked?: boolean; price_credits?: number }) =>
    apiClient.post<any>('/questions/sets/bulk-update/', { ids, ...data }),

  freeIncompleteExamSets: () =>
    apiClient.post<any>('/questions/sets/free-incomplete/', {}),

  getUsers: (params?: { page?: number; page_size?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.page_size) query.append('page_size', params.page_size.toString())
    if (params?.search) query.append('search', params.search)
    const qs = query.toString()
    return apiClient.get<PaginatedUsers>(`/auth/users/${qs ? '?' + qs : ''}`)
  },

  updateUser: (userId: number, data: Partial<AdminUser>) =>
    apiClient.patch<AdminUser>(`/auth/users/${userId}/`, data),

  deleteUser: (userId: number) =>
    apiClient.delete(`/auth/users/${userId}/`),

  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/auth/users/dashboard_stats/'),

  getTopUpRequests: (params?: { status?: string, search?: string }) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.search) query.append('search', params.search)
    const qs = query.toString()
    return apiClient.list<TopUpRequestAdmin>(`/wallet/admin/topup-requests/${qs ? '?' + qs : ''}`)
  },

  getTopUpSummary: () =>
    apiClient.get<{ pending: number, approved: number, rejected: number, total: number }>('/wallet/admin/topup-requests/summary/'),

  approveTopUp: (requestId: number) =>
    apiClient.post<TopUpRequestAdmin>(`/wallet/admin/topup-requests/${requestId}/approve/`, {}),

  rejectTopUp: (requestId: number, data: { admin_note?: string }) =>
    apiClient.post<TopUpRequestAdmin>(`/wallet/admin/topup-requests/${requestId}/reject/`, data),

  getSystemConfig: () =>
    apiClient.get<any>('/wallet/admin/system-config/'),

  updateSystemConfig: (data: {
    telegram_username?: string,
    telegram_bot_token?: string,
    admin_chat_id?: string
  }) =>
    apiClient.post<any>('/wallet/admin/system-config/', data),

  // Chat Management
  getChatSessions: () => apiClient.get<any[]>('/chat/admin/sessions/'),
  getChatMessages: (userId: number) => apiClient.get<any[]>(`/chat/admin/messages/?user_id=${userId}`),
  sendChatMessage: (userId: number, message: string) =>
    apiClient.post<any>('/chat/admin/send/', { user_id: userId, message }),

  // Notification Management
  broadcastNotification: (data: BroadcastNotificationPayload) =>
    apiClient.post<BroadcastResult>('/notifications/admin/broadcast/', data),

  getNotificationHistory: (params?: { target_type?: string }) => {
    const query = new URLSearchParams()
    if (params?.target_type) query.append('target_type', params.target_type)
    const qs = query.toString()
    return apiClient.get<any[]>(`/notifications/admin/history/${qs ? '?' + qs : ''}`)
  },
}
