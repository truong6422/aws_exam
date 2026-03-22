/**
 * Tests for use-exam-timer.ts
 * Verifies countdown, time warning/critical states
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useExamTimer } from '@/hooks/use-exam-timer'

describe('useExamTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns correct initial minutes and seconds', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useExamTimer(3661, onTimeUp))

    // 3661 seconds = 61 minutes 1 second
    expect(result.current.minutes).toBe(61)
    expect(result.current.seconds).toBe(1)
    expect(result.current.timeRemaining).toBe(3661)
  })

  it('isWarning true when time < 300 seconds (5 minutes)', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useExamTimer(299, onTimeUp))

    // 299 seconds is less than 300
    expect(result.current.isWarning).toBe(true)
  })

  it('isWarning false when time >= 300 seconds', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useExamTimer(300, onTimeUp))

    expect(result.current.isWarning).toBe(false)
  })

  it('isCritical true when time < 60 seconds (1 minute)', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useExamTimer(59, onTimeUp))

    expect(result.current.isCritical).toBe(true)
  })

  it('isCritical false when time >= 60 seconds', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useExamTimer(60, onTimeUp))

    expect(result.current.isCritical).toBe(false)
  })

  it('isWarning and isCritical false when time is 0', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useExamTimer(0, onTimeUp))

    expect(result.current.isWarning).toBe(false)
    expect(result.current.isCritical).toBe(false)
  })

  it('updates when initialSeconds prop changes', () => {
    const onTimeUp = vi.fn()
    const { result, rerender } = renderHook(
      ({ seconds }) => useExamTimer(seconds, onTimeUp),
      { initialProps: { seconds: 1000, onTimeUp } }
    )

    expect(result.current.timeRemaining).toBe(1000)

    rerender({ seconds: 500, onTimeUp })

    expect(result.current.timeRemaining).toBe(500)
  })

  it('calculates correct minutes and seconds', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useExamTimer(125, onTimeUp))

    // 125 seconds = 2 minutes 5 seconds
    expect(result.current.minutes).toBe(2)
    expect(result.current.seconds).toBe(5)
  })

  it('minutes and seconds update with different times', () => {
    const onTimeUp = vi.fn()
    const { result, rerender } = renderHook(
      ({ seconds }) => useExamTimer(seconds, onTimeUp),
      { initialProps: { seconds: 3661, onTimeUp } }
    )

    expect(result.current.minutes).toBe(61)
    expect(result.current.seconds).toBe(1)

    rerender({ seconds: 3599, onTimeUp })

    expect(result.current.minutes).toBe(59)
    expect(result.current.seconds).toBe(59)
  })
})
