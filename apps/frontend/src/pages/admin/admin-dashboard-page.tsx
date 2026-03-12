import PageHeader from '@/components/ui/page-header'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System overview" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {['Total Users', 'Total Questions', 'Sessions Today', 'Pass Rate'].map((label) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Recent Sessions</h2>
        <p className="text-sm text-gray-400 italic">Data loads in Phase 2.</p>
      </div>
    </div>
  )
}
