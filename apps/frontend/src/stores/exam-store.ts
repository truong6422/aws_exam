/**
 * Exam session store with Zustand persist middleware.
 * Persists answers, flagged, currentIndex, and attemptId to localStorage.
 * Questions are NOT persisted — re-fetched on reload.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { examApi, type PartialAnswer, type Question } from '@/services/exam-api'

// ── State ─────────────────────────────────────────────────────────────────────

interface ExamState {
  attemptId: number | null
  mode: 'exam' | 'practice'
  questions: Question[]
  answers: Record<number, number[]>
  flagged: number[]
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
  ) => void
  updateAnswer: (questionId: number, answerIds: number[]) => void
  toggleFlag: (questionId: number) => void
  goToQuestion: (index: number) => void
  setTimeRemaining: (seconds: number) => void
  syncToBackend: () => Promise<void>
  clearSession: () => void
  getAnswersAsPartial: () => PartialAnswer[]
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE: ExamState = {
  attemptId: null,
  mode: 'exam',
  questions: [],
  answers: {},
  flagged: [],
  currentIndex: 0,
  timeRemaining: 0,
  isSaving: false,
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useExamStore = create<ExamState & ExamActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      initSession: (attemptId, questions, timeRemaining, mode) =>
        set({
          attemptId,
          questions,
          timeRemaining,
          mode,
          answers: {},
          flagged: [],
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
        const { answers } = get()
        return Object.entries(answers).map(([qId, aIds]) => ({
          question_id: Number(qId),
          answer_ids: aIds,
        }))
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
        currentIndex: state.currentIndex,
        timeRemaining: state.timeRemaining,
      }),
    },
  ),
)
