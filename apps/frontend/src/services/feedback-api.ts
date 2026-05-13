/**
 * Feedback API service — submit user feedback and admin management.
 */
import { apiClient } from '@/lib/api-client'

// ── Types ───────────────────────────────────────────────────────────────────

export type FeedbackRating = 1 | 2 | 3 | 4 | 5

export interface FeedbackItem {
  id: number
  rating: FeedbackRating
  comment: string
  status: 'new' | 'reviewed' | 'resolved'
  user_email: string | null
  user_name: string | null
  created_at: string
}

export interface PaginatedFeedback {
  data: FeedbackItem[]
  links: {
    prev: string | null
    next: string | null
    current_page: number
    total_pages: number
    count: number
  }
}

export interface FeedbackSubmitData {
  rating: FeedbackRating
  comment?: string
}

export interface FeedbackSummary {
  total: number
  ratings: Record<string, number>
  new: number
  reviewed: number
  resolved: number
}

// ── API ─────────────────────────────────────────────────────────────────────

export const feedbackApi = {
  submit: (data: FeedbackSubmitData) =>
    apiClient.post<FeedbackItem>('/questions/feedback/', data),

  list: (params?: { page?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.status) query.append('status', params.status)
    const qs = query.toString()
    return apiClient.get<PaginatedFeedback>(`/questions/feedback/all/${qs ? '?' + qs : ''}`)
  },

  getSummary: () =>
    apiClient.get<FeedbackSummary>('/questions/feedback/summary/'),

  updateStatus: (id: number, status: 'reviewed' | 'resolved') =>
    apiClient.patch<FeedbackItem>(`/questions/feedback/${id}/`, { status }),
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getStarLabel(rating: FeedbackRating): string {
  const labels: Record<FeedbackRating, string> = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng',
  }
  return labels[rating]
}
