// Shared domain types used across the app

export type UserRole = 'student' | 'admin'

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: UserRole
}

export type ExamMode = 'exam' | 'practice'

export interface ExamSession {
  session_id: string
  mode: ExamMode
  domain_filter?: string[]
  question_count: number
  time_limit_minutes?: number
  started_at: string
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}
