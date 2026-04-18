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
}

// ── API ───────────────────────────────────────────────────────────────────────

export const adminApi = {
  importQuestions: (data: ImportPayload) =>
    apiClient.post<ImportResult>('/imports/questions/', data),

  getCertifications: () =>
    apiClient.list<Certification>('/questions/certifications/'),

  getExamSets: (certId: number) =>
    apiClient.list<any>(`/questions/certifications/${certId}/sets/`),

  updateExamSet: (setId: number, data: { is_locked: boolean }) =>
    apiClient.patch<any>(`/questions/sets/${setId}/`, data),

  getUsers: (params?: { page?: number; page_size?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.page_size) query.append('page_size', params.page_size.toString())
    if (params?.search) query.append('search', params.search)
    const qs = query.toString()
    return apiClient.list<AdminUser>(`/auth/users/${qs ? '?' + qs : ''}`)
  },

  updateUser: (userId: number, data: Partial<AdminUser>) =>
    apiClient.patch<AdminUser>(`/auth/users/${userId}/`, data),

  deleteUser: (userId: number) =>
    apiClient.delete(`/auth/users/${userId}/`),

  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/auth/users/dashboard_stats/'),
}
