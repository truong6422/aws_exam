/**
 * Color-coded question navigation grid for the exam sidebar.
 * Gray=unanswered, Green=answered, Orange=flagged, Yellow=answered+flagged.
 * Current question gets a blue ring.
 */
interface Props {
  totalQuestions: number
  currentIndex: number
  answers: Record<number, number[]>
  flagged: number[]
  questionIds: number[]
  onSelectQuestion: (index: number) => void
}

export function QuestionNavigationGrid({
  totalQuestions,
  currentIndex,
  answers,
  flagged,
  questionIds,
  onSelectQuestion,
}: Props) {
  const getButtonClass = (index: number): string => {
    const qId = questionIds[index]
    const hasAnswer = (answers[qId]?.length ?? 0) > 0
    const isFlagged = flagged.includes(qId)
    const isCurrent = index === currentIndex

    let bg: string
    if (hasAnswer && isFlagged) bg = 'bg-yellow-400 hover:bg-yellow-500'
    else if (hasAnswer) bg = 'bg-green-400 hover:bg-green-500'
    else if (isFlagged) bg = 'bg-orange-400 hover:bg-orange-500'
    else bg = 'bg-gray-200 hover:bg-gray-300'

    const ring = isCurrent ? ' ring-2 ring-blue-600 ring-offset-1' : ''
    return `w-9 h-9 text-xs font-medium rounded transition-colors${ring} ${bg}`
  }

  return (
    <div className="p-2">
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={i}
            className={getButtonClass(i)}
            onClick={() => onSelectQuestion(i)}
            aria-label={`Go to question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-col gap-1 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-gray-200" />
          Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-green-400" />
          Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-orange-400" />
          Flagged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-yellow-400" />
          Answered + Flagged
        </span>
      </div>
    </div>
  )
}
