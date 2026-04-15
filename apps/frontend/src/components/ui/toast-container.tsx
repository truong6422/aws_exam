import { useUiStore } from '@/stores/ui-store'
import type { ToastMessage } from '@/types'

const BORDER_COLOR: Record<ToastMessage['type'], string> = {
  success: '#1d9b5e',
  error:   '#e0453c',
  warning: '#f5a623',
  info:    '#0071e3',
}

const TEXT_COLOR: Record<ToastMessage['type'], string> = {
  success: '#1d9b5e',
  error:   '#e0453c',
  warning: '#f5a623',
  info:    '#2997ff',
}

const LABEL: Record<ToastMessage['type'], string> = {
  success: 'OK',
  error:   'ERR',
  warning: 'WARN',
  info:    'INFO',
}

/** Fixed bottom-right toast stack driven by ui-store. */
export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#272729',
            border: `1px solid rgba(255,255,255,0.1)`,
            borderLeft: `3px solid ${BORDER_COLOR[t.type]}`,
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '14px',
            letterSpacing: '-0.224px',
            color: '#fff',
            minWidth: '260px',
            maxWidth: '380px',
            boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '-0.12px',
              color: TEXT_COLOR[t.type],
              flexShrink: 0,
            }}
          >
            {LABEL[t.type]}
          </span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              padding: '0 0 0 4px',
              flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            x
          </button>
        </div>
      ))}
    </div>
  )
}
