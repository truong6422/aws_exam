/**
 * Exam API service — wraps all exam/practice/certification endpoints.
 * Uses the shared apiClient from lib/api-client.
 */
import { apiClient } from '@/lib/api-client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Answer {
  id: number
  text: string
}

export interface Question {
  id: number
  text: string
  question_type: 'single' | 'multiple'
  answers: Answer[]
}

export interface Certification {
  id: number
  code: string
  name: string
  description: string
  time_limit_minutes: number
  total_questions: number
  passing_score: number
}

export interface Domain {
  id: number
  name: string
  certification: number
}

export interface ExamAttempt {
  id: number
  certification: { id: number; code: string; name: string }
  started_at: string
  time_limit_minutes: number
  status: string
  total_questions: number
  time_remaining_seconds: number
  questions: Question[]
}

export interface PartialAnswer {
  question_id: number
  answer_ids: number[]
}

export interface AutosaveResult {
  status: string
  time_remaining_seconds: number
}

export interface SubmitResult {
  id: number
  score_percentage: number
  correct_count: number
  total_questions: number
  status: string
  submitted_at: string
}

export interface ReviewAnswer {
  id: number
  text: string
  is_correct: boolean
}

export interface ReviewQuestion {
  id: number
  text: string
  explanation: string
  question_type: string
  answers: ReviewAnswer[]
}

export interface ExamReview {
  id: number
  certification: { code: string; name: string }
  score_percentage: number
  correct_count: number
  total_questions: number
  questions: ReviewQuestion[]
  user_answers: Record<number, number[]>
}

export interface ExamListItem {
  id: number
  certification: { code: string; name: string }
  score_percentage: number
  status: string
  started_at: string
  submitted_at: string | null
}

export interface PaginatedExamList {
  count: number
  next: string | null
  previous: string | null
  results: ExamListItem[]
}

// ── API ───────────────────────────────────────────────────────────────────────

export const examApi = {
  getCertifications: () =>
    apiClient.list<Certification>('/questions/certifications/'),

  getDomains: (certId: number) =>
    apiClient.list<Domain>(`/questions/certifications/${certId}/domains/`),

  startExam: (certificationId: number) =>
    apiClient.post<ExamAttempt>('/exams/start/', { certification_id: certificationId }),

  autosaveExam: (attemptId: number, answers: PartialAnswer[]) =>
    apiClient.patch<AutosaveResult>(`/exams/${attemptId}/autosave/`, answers),

  submitExam: (attemptId: number, answers: PartialAnswer[]) =>
    apiClient.post<SubmitResult>(`/exams/${attemptId}/submit/`, answers),

  getExamReview: (attemptId: number) =>
    apiClient.get<ExamReview>(`/exams/${attemptId}/review/`),

  getExamList: (page = 1) =>
    apiClient.get<PaginatedExamList>(`/exams/?page=${page}`),
}
