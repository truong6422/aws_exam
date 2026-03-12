import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'

/** Active practice session — question + instant feedback wired in Phase 2. */
export default function PracticeSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Practice Session" subtitle={`Session: ${sessionId}`} />

      <p className="text-xs text-gray-500">Question 0 of 0</p>

      {/* Question card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-400 italic">
          Question content loads in Phase 2.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {['A', 'B', 'C', 'D'].map((opt) => (
          <button
            key={opt}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-400 hover:border-brand-500 hover:text-gray-700"
          >
            {opt}. —
          </button>
        ))}
      </div>

      {/* Explanation placeholder — visible after answering */}
      <div className="hidden rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Explanation will appear here after submitting an answer.
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => navigate('/practice/setup')}
          className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          End Session
        </button>
        <button className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Next →
        </button>
      </div>
    </div>
  )
}
