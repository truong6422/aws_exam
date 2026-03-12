import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'

const STAT_CARDS = [
  { label: 'Exams Taken', value: '—', icon: '📝' },
  { label: 'Avg. Score', value: '—%', icon: '🎯' },
  { label: 'Pass Rate', value: '—%', icon: '✅' },
  { label: 'Practice Sets', value: '—', icon: '📚' },
]

/** Dashboard overview — data wired in Phase 2. */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Welcome back! Ready to practice?" />

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          to="/exam/setup"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          📝 Start Exam
        </Link>
        <Link
          to="/practice/setup"
          className="rounded-lg border border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
        >
          🎯 Practice Mode
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-2xl">{s.icon}</div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Recent Activity</h2>
        <p className="text-sm text-gray-400 italic">No activity yet — take your first exam!</p>
      </div>
    </div>
  )
}
