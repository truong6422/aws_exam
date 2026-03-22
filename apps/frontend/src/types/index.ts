// Shared domain types used across the app

export interface User {
  id: number
  email: string
  username: string
  name: string         // matches API field from UserProfileSerializer
  is_staff: boolean    // matches API field; use this to derive admin role
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
