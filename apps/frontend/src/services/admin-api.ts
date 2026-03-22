/**
 * Admin API service — wraps import and question management endpoints.
 * Reuses certifications/domains from exam-api for question browsing.
 */
import { apiClient } from '@/lib/api-client'
import type { Certification, Domain } from '@/services/exam-api'

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

// ── API ───────────────────────────────────────────────────────────────────────

export const adminApi = {
  importQuestions: (data: ImportPayload) =>
    apiClient.post<ImportResult>('/imports/questions/', data),

  getCertifications: () =>
    apiClient.list<Certification>('/questions/certifications/'),

  getDomains: (certId: number) =>
    apiClient.list<Domain>(`/questions/certifications/${certId}/domains/`),
}
