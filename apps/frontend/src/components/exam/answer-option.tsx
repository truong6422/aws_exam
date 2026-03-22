/**
 * Single answer option button supporting both radio (single) and checkbox (multiple) styles.
 * In practice mode, supports revealed state showing correct/incorrect feedback.
 */
interface Answer {
  id: number
  text: string
}

interface Props {
  answer: Answer
  isSelected: boolean
  questionType: 'single' | 'multiple'
  onSelect: (answerId: number) => void
  /** Practice mode: whether answer feedback should be shown */
  isRevealed?: boolean
  /** Practice mode: whether this answer is correct */
  isCorrect?: boolean
}

export function AnswerOption({
  answer,
  isSelected,
  questionType,
  onSelect,
  isRevealed = false,
  isCorrect = false,
}: Props) {
  let cls =
    'w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer text-sm flex items-start gap-2 '

  if (isRevealed && isCorrect) {
    cls += 'bg-green-50 border-green-500 text-green-900'
  } else if (isRevealed && isSelected && !isCorrect) {
    cls += 'bg-red-50 border-red-500 text-red-900'
  } else if (isSelected) {
    cls += 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-900'
  } else {
    cls += 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-800'
  }

  const icon =
    questionType === 'multiple'
      ? isSelected
        ? '☑'
        : '☐'
      : isSelected
        ? '●'
        : '○'

  return (
    <button
      className={cls}
      onClick={() => onSelect(answer.id)}
      aria-pressed={isSelected}
    >
      <span className="mt-0.5 shrink-0 text-base leading-none">{icon}</span>
      <span>{answer.text}</span>
    </button>
  )
}
