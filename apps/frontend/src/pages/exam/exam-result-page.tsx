import { useParams, Link } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'

/** Exam results view — real score data wired in Phase 2. */
export default function ExamResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Exam Results" subtitle={`Session: ${sessionId}`} />

      {/* Score card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-6xl font-bold text-brand-600">—%</p>
        <p className="mt-2 text-sm text-gray-500">Score (data loads in Phase 2)</p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">0 / 0 correct</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">— mins</span>
        </div>
      </div>

      {/* Domain breakdown placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Domain Breakdown</h2>
        <p className="text-sm text-gray-400 italic">Domain scores will appear here.</p>
      </div>

      <div className="flex gap-3">
        <Link
          to="/exam/setup"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Retake Exam
        </Link>
        <Link
          to="/history"
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          View History
        </Link>
      </div>
    </div>
  )
}
