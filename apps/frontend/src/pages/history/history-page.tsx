import PageHeader from '@/components/ui/page-header'

/** Exam history list — data wired in Phase 2. */
export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="History" subtitle="All your past exam and practice sessions" />

      {/* Filters */}
      <div className="flex gap-3">
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Types</option>
          <option>Exam</option>
          <option>Practice</option>
        </select>
        <input
          type="date"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Table placeholder */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {['Date', 'Type', 'Score', 'Questions', 'Duration', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400 italic">
                No sessions yet — take your first exam!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
