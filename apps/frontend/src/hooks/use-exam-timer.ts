/**
 * Countdown timer hook with Page Visibility API support.
 * Uses useState so the component re-renders every second.
 * Pauses when the browser tab is hidden, resumes on visibility.
 */
import { useEffect, useRef, useState } from 'react'

interface TimerResult {
  minutes: number
  seconds: number
  isWarning: boolean   // < 5 minutes
  isCritical: boolean  // < 1 minute
  timeRemaining: number
}

export function useExamTimer(
  initialSeconds: number,
  onTimeUp: () => void,
): TimerResult {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds)
  const isVisible = useRef(!document.hidden)
  const onTimeUpRef = useRef(onTimeUp)

  // Keep callback ref stable so effects don't re-run on every render
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  // Sync when parent provides a new initial value (e.g. after autosave response)
  useEffect(() => {
    setTimeRemaining(initialSeconds)
  }, [initialSeconds])

  // Page Visibility listener
  useEffect(() => {
    const handleVisibility = () => {
      isVisible.current = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Tick every second
  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUpRef.current()
      return
    }

    const timer = setInterval(() => {
      if (!isVisible.current) return
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onTimeUpRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  return {
    minutes: Math.floor(timeRemaining / 60),
    seconds: timeRemaining % 60,
    isWarning: timeRemaining > 0 && timeRemaining < 300,
    isCritical: timeRemaining > 0 && timeRemaining < 60,
    timeRemaining,
  }
}
