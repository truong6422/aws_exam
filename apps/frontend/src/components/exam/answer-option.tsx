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
  let borderColor = 'rgba(255,255,255,0.15)'
  let background = 'rgba(255,255,255,0.04)'
  let color = 'rgba(255,255,255,0.85)'

  if (isRevealed && isCorrect) {
    borderColor = '#1d9b5e'
    background = 'rgba(29,155,94,0.12)'
    color = '#1d9b5e'
  } else if (isRevealed && isSelected && !isCorrect) {
    borderColor = '#e0453c'
    background = 'rgba(224,69,60,0.12)'
    color = '#e0453c'
  } else if (isSelected) {
    borderColor = '#0071e3'
    background = 'rgba(0,113,227,0.1)'
    color = '#fff'
  }

  const indicatorStyle: React.CSSProperties = {
    width: '14px',
    height: '14px',
    borderRadius: questionType === 'multiple' ? '3px' : '50%',
    border: `1.5px solid ${isSelected || (isRevealed && isCorrect) ? borderColor : 'rgba(255,255,255,0.25)'}`,
    background: isSelected || (isRevealed && isCorrect) ? borderColor : 'transparent',
    flexShrink: 0,
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <button
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        background,
        color,
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        transition: 'border-color 0.15s, background 0.15s',
        letterSpacing: '-0.224px',
      }}
      onClick={() => onSelect(answer.id)}
      aria-pressed={isSelected}
    >
      <span style={indicatorStyle} />
      <span>{answer.text}</span>
    </button>
  )
}
