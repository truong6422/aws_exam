/**
 * Exam session store with Zustand persist middleware.
 * Persists answers, flagged, currentIndex, and attemptId to localStorage.
 * Questions are NOT persisted — re-fetched on reload.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { examApi, practiceApi, type PartialAnswer, type Question } from '@/services/exam-api'

// ── State ─────────────────────────────────────────────────────────────────────

interface ExamState {
  attemptId: number | null
  mode: 'exam' | 'practice'
  questions: Question[]
  answers: Record<number, number[]>
  flagged: number[]
  bookmarked: number[]
  currentIndex: number
  timeRemaining: number
  isSaving: boolean
}

// ── Actions ───────────────────────────────────────────────────────────────────

interface ExamActions {
  initSession: (
    attemptId: number,
    questions: Question[],
    timeRemaining: number,
    mode: 'exam' | 'practice',
    initialAnswers?: Record<number, number[]>,
    flaggedIds?: number[],
  ) => void
  updateAnswer: (questionId: number, answerIds: number[]) => void
  toggleFlag: (questionId: number) => void
  goToQuestion: (index: number) => void
  setTimeRemaining: (seconds: number) => void
  syncToBackend: () => Promise<void>
  clearSession: () => void
  getAnswersAsPartial: () => PartialAnswer[]
  setBookmarked: (questionId: number, bookmarked: boolean) => void
  loadBookmarks: () => Promise<void>
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE: ExamState = {
  attemptId: null,
  mode: 'exam',
  questions: [],
  answers: {},
  flagged: [],
  bookmarked: [],
  currentIndex: 0,
  timeRemaining: 0,
  isSaving: false,
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useExamStore = create<ExamState & ExamActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      initSession: (attemptId, questions, timeRemaining, mode, initialAnswers, flaggedIds) =>
        set({
          attemptId,
          questions,
          timeRemaining,
          mode,
          answers: initialAnswers || {},
          flagged: flaggedIds || [],
          currentIndex: 0,
          isSaving: false,
        }),

      updateAnswer: (questionId, answerIds) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: answerIds } })),

      toggleFlag: (questionId) =>
        set((s) => ({
          flagged: s.flagged.includes(questionId)
            ? s.flagged.filter((id) => id !== questionId)
            : [...s.flagged, questionId],
        })),

      goToQuestion: (index) => set({ currentIndex: index }),

      setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),

      syncToBackend: async () => {
        const { attemptId } = get()
        if (!attemptId) return
        set({ isSaving: true })
        try {
          const partial = get().getAnswersAsPartial()
          const result = await examApi.autosaveExam(attemptId, partial)
          set({ timeRemaining: result.time_remaining_seconds })
        } catch {
          // Silently swallow autosave errors — do not interrupt the exam
        } finally {
          set({ isSaving: false })
        }
      },

      clearSession: () => set(INITIAL_STATE),

      getAnswersAsPartial: () => {
        const { answers, flagged } = get()
        const questionIds = Array.from(new Set([
          ...Object.keys(answers).map(Number),
          ...flagged
        ]))

        return questionIds.map(qId => ({
          question_id: qId,
          answer_ids: answers[qId] || [],
          is_flagged: flagged.includes(qId),
        }))
      },

      setBookmarked: (questionId, bookmarked) =>
        set((s) => ({
          bookmarked: bookmarked
            ? [...new Set([...s.bookmarked, questionId])]
            : s.bookmarked.filter((id) => id !== questionId),
        })),

      loadBookmarks: async () => {
        try {
          const result = await practiceApi.getBookmarkedIds()
          set({ bookmarked: result.question_ids })
        } catch {
          // Not critical — silently ignore (e.g. user not logged in)
        }
      },
    }),
    {
      name: 'aws-exam-session',
      // Do NOT persist questions — they are large and re-fetched on reload
      partialize: (state) => ({
        attemptId: state.attemptId,
        mode: state.mode,
        answers: state.answers,
        flagged: state.flagged,
        bookmarked: state.bookmarked,
        currentIndex: state.currentIndex,
        timeRemaining: state.timeRemaining,
      }),
    },
  ),
)
