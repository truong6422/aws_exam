interface Props {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

/** Reusable empty state with optional CTA — used across dashboard, analytics, history. */
export function EmptyState({ icon = '📋', title, description, actionLabel, actionHref, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-6 max-w-sm">{description}</p>}
      {actionLabel && (actionHref || onAction) && (
        <a
          href={actionHref ?? '#'}
          onClick={onAction ? (e) => { e.preventDefault(); onAction() } : undefined}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {actionLabel}
        </a>
      )}
    </div>
  )
}
