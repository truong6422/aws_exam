/**
 * Analytics API service — wraps /api/v1/analytics/ endpoints.
 * Uses the shared apiClient from lib/api-client.
 */
import { apiClient } from '@/lib/api-client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface RecentTrendItem {
  date: string
  score: number
  certification_code: string
}

export interface OverviewResponse {
  total_attempts: number
  total_submitted: number
  avg_score: number
  best_score: number
  recent_trend: RecentTrendItem[]
}

export interface WeakDomainItem {
  domain_id: number
  domain_name: string
  certification_code: string
  total_questions: number
  correct_count: number
  accuracy_percentage: number
}

export interface HistoryItem {
  id: number
  certification_code: string
  certification_name: string
  started_at: string
  submitted_at: string | null
  status: string
  score_percentage: number | null
  total_questions: number
  correct_count: number | null
}

export interface PaginatedHistory {
  count: number
  next: string | null
  previous: string | null
  results: HistoryItem[]
}

// ── API ───────────────────────────────────────────────────────────────────────

export const analyticsApi = {
  getOverview: () =>
    apiClient.get<OverviewResponse>('/analytics/overview/'),

  getWeakDomains: (certificationId?: number) => {
    const url = certificationId
      ? `/analytics/weak-domains/?certification_id=${certificationId}`
      : '/analytics/weak-domains/'
    return apiClient.get<WeakDomainItem[]>(url)
  },

  getHistory: (page = 1) =>
    apiClient.get<PaginatedHistory>(`/analytics/history/?page=${page}`),
}
