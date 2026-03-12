import PageHeader from '@/components/ui/page-header'

export default function AdminQuestionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Questions" subtitle="Browse and edit question bank" />
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          + Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Domains</option>
          <option>Cloud Concepts</option>
          <option>Security</option>
          <option>Technology</option>
          <option>Billing & Pricing</option>
        </select>
        <input
          type="search"
          placeholder="Search questions…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-400 italic">Question list loads in Phase 2.</p>
      </div>
    </div>
  )
}
