import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, HistoryItem, PaginatedHistory } from '@/services/analytics-api'
import { EmptyState } from '@/components/shared/empty-state'
import PageHeader from '@/components/ui/page-header'

const PASSING_SCORE = 72

/** Exam history list with pagination and review links. */
export default function HistoryPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<PaginatedHistory | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = (p: number) => {
    setLoading(true)
    analyticsApi.getHistory(p)
      .then((d) => { setData(d); setPage(p) })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  const statusClass = (status: string) => {
    if (status === 'submitted') return 'text-green-600'
    if (status === 'expired') return 'text-orange-500'
    return 'text-gray-400'
  }

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading...</div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="History" subtitle="All your past exam sessions" />
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <button className="text-blue-600 text-sm hover:underline" onClick={() => load(1)}>Retry</button>
      </div>
    )
  }

  if (!data || data.count === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="History" subtitle="All your past exam sessions" />
        <EmptyState
          icon="📋"
          title="No exam history"
          description="Your completed exams will appear here."
          actionLabel="Start Exam"
          onAction={() => navigate('/exam/setup')}
        />
      </div>
    )
  }

  const totalPages = Math.ceil(data.count / 10)

  return (
    <div className="space-y-6">
      <PageHeader title="History" subtitle="All your past exam sessions" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {['Certification', 'Date', 'Score', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.results.map((item: HistoryItem) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{item.certification_code}</span>
                  <span className="block text-xs text-gray-400">{item.certification_name}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(item.started_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {item.score_percentage !== null ? (
                    <span className={`font-bold text-xs px-2 py-1 rounded-full ${
                      item.score_percentage >= PASSING_SCORE
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {Number(item.score_percentage).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-xs capitalize font-medium ${statusClass(item.status)}`}>
                  {item.status.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 text-right">
                  {item.status === 'submitted' && (
                    <button
                      className="text-blue-600 text-xs hover:underline"
                      onClick={() => navigate(`/exam/${item.id}/result`)}
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
            disabled={page === 1}
            onClick={() => load(page - 1)}
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
            disabled={!data.next}
            onClick={() => load(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
