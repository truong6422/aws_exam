import { create } from 'zustand'
import type { ExamMode } from '@/types'

interface ExamProgress {
  currentIndex: number
  totalQuestions: number
  answeredCount: number
  flaggedIndices: number[]
}

interface ExamState {
  sessionId: string | null
  mode: ExamMode | null
  progress: ExamProgress | null
  // Actions
  startSession: (sessionId: string, mode: ExamMode, totalQuestions: number) => void
  updateProgress: (patch: Partial<ExamProgress>) => void
  toggleFlag: (index: number) => void
  clearSession: () => void
}

const DEFAULT_PROGRESS: ExamProgress = {
  currentIndex: 0,
  totalQuestions: 0,
  answeredCount: 0,
  flaggedIndices: [],
}

export const useExamStore = create<ExamState>()((set, get) => ({
  sessionId: null,
  mode: null,
  progress: null,

  startSession: (sessionId, mode, totalQuestions) =>
    set({
      sessionId,
      mode,
      progress: { ...DEFAULT_PROGRESS, totalQuestions },
    }),

  updateProgress: (patch) => {
    const current = get().progress
    if (!current) return
    set({ progress: { ...current, ...patch } })
  },

  toggleFlag: (index) => {
    const current = get().progress
    if (!current) return
    const flagged = current.flaggedIndices.includes(index)
      ? current.flaggedIndices.filter((i) => i !== index)
      : [...current.flaggedIndices, index]
    set({ progress: { ...current, flaggedIndices: flagged } })
  },

  clearSession: () => set({ sessionId: null, mode: null, progress: null }),
}))
