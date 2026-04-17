/**
 * Color-coded question navigation grid for the exam sidebar.
 * Unanswered: subtle dark | Answered: green tint | Flagged: red tint | Answered+Flagged: orange tint.
 * Current question gets a white ring.
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
  const getButtonStyle = (index: number): React.CSSProperties => {
    const qId = questionIds[index]
    const hasAnswer = (answers[qId]?.length ?? 0) > 0
    const isFlagged = flagged.includes(qId)
    const isCurrent = index === currentIndex

    let background = 'rgba(255,255,255,0.08)'
    let color = 'rgba(255,255,255,0.4)'
    if (hasAnswer && isFlagged) { background = 'rgba(245,166,35,0.15)'; color = '#f5a623' }
    else if (hasAnswer) { background = 'rgba(29,155,94,0.15)'; color = '#1d9b5e' }
    else if (isFlagged) { background = 'rgba(224,69,60,0.15)'; color = '#e0453c' }

    return {
      width: '36px',
      height: '36px',
      fontSize: '11px',
      fontWeight: 600,
      borderRadius: '6px',
      border: isCurrent ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
      background,
      color,
      cursor: 'pointer',
      transition: 'border-color 0.15s',
    }
  }

  const legendItems = [
    { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', label: 'Chưa trả lời' },
    { bg: 'rgba(29,155,94,0.15)', color: '#1d9b5e', label: 'Đã trả lời' },
    { bg: 'rgba(224,69,60,0.15)', color: '#e0453c', label: 'Đã đánh dấu' },
    { bg: 'rgba(245,166,35,0.15)', color: '#f5a623', label: 'Đã trả lời + Đã đánh dấu' },
  ]

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 36px)', gap: '6px' }}>
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={i}
            style={getButtonStyle(i)}
            onClick={() => onSelectQuestion(i)}
            aria-label={`Đi tới câu ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {legendItems.map((item) => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.12px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: item.bg, border: `1px solid ${item.color}` }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
