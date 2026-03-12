import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'

/** Active exam session — question display wired in Phase 2. */
export default function ExamSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Exam in Progress" subtitle={`Session: ${sessionId}`} />
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-mono font-semibold text-gray-700">
          ⏱ 90:00
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className="h-2 w-0 rounded-full bg-brand-600 transition-all" />
      </div>
      <p className="text-xs text-gray-500">Question 0 of 0</p>

      {/* Question card placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-400 italic">
          Question content will load here in Phase 2.
        </p>
      </div>

      {/* Answer options placeholder */}
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

      <div className="flex justify-between">
        <button className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← Previous
        </button>
        <button
          onClick={() => navigate(`/exam/${sessionId}/result`)}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Submit Exam
        </button>
        <button className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Next →
        </button>
      </div>
    </div>
  )
}
