import clsx from 'clsx'
import { useUiStore } from '@/stores/ui-store'
import type { ToastMessage } from '@/types'

const COLOUR: Record<ToastMessage['type'], string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
  info: 'bg-brand-600',
}

const ICON: Record<ToastMessage['type'], string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

/** Fixed bottom-right toast stack driven by ui-store. */
export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg',
            COLOUR[t.type],
          )}
        >
          <span>{ICON[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-2 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
