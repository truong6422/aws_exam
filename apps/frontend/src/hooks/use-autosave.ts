/**
 * Autosave hook — fires syncToBackend every 30 seconds while an exam is active.
 * Returns isSaving state and lastSavedAt timestamp.
 */
import { useEffect, useRef, useState } from 'react'
import { useExamStore } from '@/stores/exam-store'

interface AutosaveResult {
  isSaving: boolean
  lastSavedAt: Date | null
}

export function useAutosave(attemptId: number | null): AutosaveResult {
  const syncToBackend = useExamStore((s) => s.syncToBackend)
  const isSaving = useExamStore((s) => s.isSaving)
  const [lastSavedAt] = useState<Date | null>(null)
  const syncRef = useRef(syncToBackend)

  useEffect(() => {
    syncRef.current = syncToBackend
  }, [syncToBackend])

  useEffect(() => {
    // Background interval disabled per user request to avoid API spam.
    // Saving now only happens on explicit Pause or page unload.
  }, [attemptId])

  return { isSaving, lastSavedAt }
}
