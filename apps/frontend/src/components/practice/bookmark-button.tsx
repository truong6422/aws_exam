/**
 * BookmarkButton — toggles a question bookmark with optimistic UI.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { practiceApi } from '@/services/exam-api'

interface BookmarkButtonProps {
  questionId: number
  isBookmarked: boolean
  onToggle: (questionId: number, bookmarked: boolean) => void
}

export function BookmarkButton({ questionId, isBookmarked, onToggle }: BookmarkButtonProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    // Optimistic update
    const next = !isBookmarked
    onToggle(questionId, next)
    setLoading(true)
    try {
      const result = await practiceApi.toggleBookmark(questionId)
      // Reconcile with server response
      if (result.bookmarked !== next) {
        onToggle(questionId, result.bookmarked)
      }
    } catch {
      // Revert on failure
      onToggle(questionId, isBookmarked)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={isBookmarked ? t('practice_extended.bookmark.remove') : t('practice_extended.bookmark.add')}
      style={{
        background: 'none',
        border: '1px solid',
        borderColor: isBookmarked ? '#0071e3' : 'rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '6px 10px',
        cursor: loading ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        color: isBookmarked ? '#2997ff' : 'rgba(255,255,255,0.5)',
        transition: 'color 0.15s, border-color 0.15s',
        opacity: loading ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
        <path d="M2 2a1 1 0 011-1h7a1 1 0 011 1v9.5l-4.5-2.5L2 11.5V2z" />
      </svg>
      {isBookmarked ? t('practice_extended.bookmark.bookmarked') : t('practice_extended.bookmark.unbookmarked')}
    </button>
  )
}
