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

export interface ExamSet {
  id: number
  name: string
  description: string
  is_locked: boolean
  price_credits: number
  is_unlocked: boolean
  question_count: number
}

export interface PurchaseResult {
  exam_set_id: number
  credits_spent: number
  new_balance: number
  unlocked_at: string
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
  user_answers: Record<number, number[]>
  flagged_ids: number[]
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
  question_type: 'single' | 'multiple'
  answers: ReviewAnswer[]
  comment_count: number
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
  exam_set_id: number | null
  score_percentage: number | null
  correct_count: number | null
  total_questions: number
  answered_count: number
  status: string
  started_at: string
  submitted_at: string | null
  time_remaining_seconds: number
  time_spent_seconds: number
}

export interface PaginatedExamList {
  count: number
  next: string | null
  previous: string | null
  results: ExamListItem[]
}

// ── Practice Community Types ──────────────────────────────────────────────────

export interface Comment {
  id: number
  parent: number | null
  body: string
  referenced_answers: number[]
  author_name: string
  upvote_count: number
  upvoted_by_me: boolean
  replies: Comment[]
  created_at: string
}

export interface BookmarkListResult {
  question_ids: number[]
}

export interface UpvoteResult {
  upvoted: boolean
  upvote_count: number
}

export interface BookmarkResult {
  bookmarked: boolean
}

export interface PaginatedQuestions {
  links: {
    prev: string | null
    next: string | null
    current_page: number
    total_pages: number
    count: number
  }
  data: ReviewQuestion[]
}

// ── API ───────────────────────────────────────────────────────────────────────

export const examApi = {
  getCertifications: () =>
    apiClient.list<Certification>('/questions/certifications/'),


  getExamSets: (certId: number) =>
    apiClient.list<ExamSet>(`/questions/certifications/${certId}/sets/`),

  startExam: (certificationId?: number | null, examSetId?: number | null) =>
    apiClient.post<ExamAttempt>('/exams/start/', {
      certification_id: certificationId,
      exam_set_id: examSetId,
    }),

  autosaveExam: (attemptId: number, answers: PartialAnswer[]) =>
    apiClient.patch<AutosaveResult>(`/exams/${attemptId}/autosave/`, answers),

  submitExam: (attemptId: number, answers: PartialAnswer[]) =>
    apiClient.post<SubmitResult>(`/exams/${attemptId}/submit/`, answers),

  getExamReview: (attemptId: number) =>
    apiClient.get<ExamReview>(`/exams/${attemptId}/review/`),

  getExamList: (page = 1) =>
    apiClient.list<ExamListItem>(`/exams/?page=${page}`),

  getExamSetHistory: (examSetId: number) =>
    apiClient.list<ExamListItem>(`/exams/?exam_set_id=${examSetId}&page_size=20`),


  pauseExam: (attemptId: number, answers: PartialAnswer[]) =>
    apiClient.post<{ status: string }>(`/exams/${attemptId}/pause/`, answers),

  resumeExam: (attemptId: number) =>
    apiClient.post<ExamAttempt>(`/exams/${attemptId}/resume/`, {}),

  purchaseExamSet: (setId: number) =>
    apiClient.post<PurchaseResult>(`/questions/sets/${setId}/purchase/`, {}),
}

export const practiceApi = {
  getQuestions: (certId?: number, page = 1) =>
    apiClient.get<PaginatedQuestions>(`/questions/practice/?certification_id=${certId || ''}&page=${page}`),

  getComments: (questionId: number) =>
    apiClient.list<Comment>(`/questions/${questionId}/comments/`),

  postComment: (questionId: number, body: string, referencedAnswers?: number[], parent?: number | null) =>
    apiClient.post<Comment>(`/questions/${questionId}/comments/`, {
      body,
      referenced_answers: referencedAnswers ?? [],
      parent: parent ?? null,
    }),

  upvoteComment: (commentId: number) =>
    apiClient.post<UpvoteResult>(`/questions/comments/${commentId}/upvote/`, {}),

  toggleBookmark: (questionId: number) =>
    apiClient.post<BookmarkResult>(`/questions/${questionId}/bookmark/`, {}),

  getBookmarkedIds: () =>
    apiClient.get<BookmarkListResult>('/questions/bookmarks/'),

  reportAnswer: (questionId: number, reason: string) =>
    apiClient.post<{ id: number; reason: string }>(`/questions/${questionId}/report/`, { reason }),
}
