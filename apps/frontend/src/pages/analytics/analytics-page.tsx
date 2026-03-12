import PageHeader from '@/components/ui/page-header'

/** Performance analytics — charts wired in Phase 2. */
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Track your performance over time" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Score trend */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Score Trend</h2>
          <div className="flex h-40 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400 italic">
            Chart renders in Phase 2
          </div>
        </div>

        {/* Domain radar */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Domain Radar</h2>
          <div className="flex h-40 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400 italic">
            Radar chart — Phase 2
          </div>
        </div>

        {/* Weak areas */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Weak Areas</h2>
          <p className="text-sm text-gray-400 italic">Loads in Phase 2</p>
        </div>

        {/* Streak */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Study Streak</h2>
          <p className="text-4xl font-bold text-brand-600">—</p>
          <p className="text-xs text-gray-500">days</p>
        </div>
      </div>
    </div>
  )
}
