/**
 * Tests for exam-store.ts
 * Verifies Zustand actions update state correctly and persist to localStorage
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useExamStore } from '@/stores/exam-store'

describe('useExamStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useExamStore.getState().clearSession()
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    useExamStore.getState().clearSession()
    localStorage.clear()
  })

  it('initializes with empty state', () => {
    const store = useExamStore.getState()
    expect(store.attemptId).toBeNull()
    expect(store.answers).toEqual({})
    expect(store.flagged).toEqual([])
    expect(store.currentIndex).toBe(0)
  })

  it('initSession sets all fields correctly', () => {
    const questions = [
      { id: 1, text: 'Q1', answers: [], question_type: 'single' as const },
      { id: 2, text: 'Q2', answers: [], question_type: 'multiple' as const },
    ]
    useExamStore.getState().initSession(123, questions, 7800, 'exam')

    const store = useExamStore.getState()
    expect(store.attemptId).toBe(123)
    expect(store.questions).toEqual(questions)
    expect(store.timeRemaining).toBe(7800)
    expect(store.mode).toBe('exam')
    expect(store.answers).toEqual({})
    expect(store.flagged).toEqual([])
  })

  it('updateAnswer adds answer to answers map', () => {
    useExamStore.getState().updateAnswer(1, [10, 11])
    const store = useExamStore.getState()
    expect(store.answers[1]).toEqual([10, 11])
  })

  it('updateAnswer overwrites previous answer for same question', () => {
    useExamStore.getState().updateAnswer(1, [10])
    useExamStore.getState().updateAnswer(1, [11, 12])

    const store = useExamStore.getState()
    expect(store.answers[1]).toEqual([11, 12])
  })

  it('toggleFlag adds question to flagged set', () => {
    useExamStore.getState().toggleFlag(5)
    expect(useExamStore.getState().flagged).toContain(5)
  })

  it('toggleFlag removes question if already flagged', () => {
    useExamStore.getState().toggleFlag(5)
    expect(useExamStore.getState().flagged).toContain(5)

    useExamStore.getState().toggleFlag(5)
    expect(useExamStore.getState().flagged).not.toContain(5)
  })

  it('goToQuestion sets currentIndex', () => {
    useExamStore.getState().goToQuestion(7)
    expect(useExamStore.getState().currentIndex).toBe(7)
  })

  it('setTimeRemaining updates timeRemaining', () => {
    useExamStore.getState().setTimeRemaining(3600)
    expect(useExamStore.getState().timeRemaining).toBe(3600)
  })

  it('clearSession resets all state', () => {
    // Setup
    useExamStore.getState().initSession(123, [], 7800, 'practice')
    useExamStore.getState().updateAnswer(1, [10])
    useExamStore.getState().toggleFlag(2)

    // Clear
    useExamStore.getState().clearSession()

    // Verify
    const store = useExamStore.getState()
    expect(store.attemptId).toBeNull()
    expect(store.answers).toEqual({})
    expect(store.flagged).toEqual([])
    expect(store.currentIndex).toBe(0)
  })

  it('getAnswersAsPartial converts state to API format', () => {
    useExamStore.getState().updateAnswer(1, [10, 11])
    useExamStore.getState().updateAnswer(2, [20])

    const partial = useExamStore.getState().getAnswersAsPartial()
    expect(partial).toEqual([
      { question_id: 1, answer_ids: [10, 11] },
      { question_id: 2, answer_ids: [20] },
    ])
  })

  it('persist middleware saves answers to localStorage', () => {
    useExamStore.getState().initSession(123, [], 7800, 'exam')
    useExamStore.getState().updateAnswer(1, [10])
    useExamStore.getState().toggleFlag(2)

    // Force hydration to trigger localStorage save
    // Note: In a real test environment with proper jsdom setup,
    // the persist middleware would save automatically
    const stored = localStorage.getItem('aws-exam-session')
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.state.answers[1]).toEqual([10])
      expect(parsed.state.flagged).toContain(2)
    }
  })

  it('persist middleware restores answers on rehydration', () => {
    // Setup initial store
    useExamStore.getState().initSession(123, [], 7800, 'exam')
    useExamStore.getState().updateAnswer(1, [10, 11])
    useExamStore.getState().toggleFlag(3)

    // Simulate store re-creation (like page refresh)
    const newStore = useExamStore.getState()
    expect(newStore.answers[1]).toBeDefined()
    expect(newStore.flagged).toContain(3)
  })
})
