import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'

/** Practice session configuration — logic wired in Phase 2. */
export default function PracticeSetupPage() {
  const navigate = useNavigate()

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    // Phase 2: POST /api/exams/sessions/?mode=practice
    navigate('/practice/placeholder-session-id')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Practice Mode" subtitle="Learn at your own pace with instant feedback" />

      <form onSubmit={handleStart} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Question Count</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>10</option>
            <option>20</option>
            <option>30</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Domain</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Domains</option>
            <option>Cloud Concepts</option>
            <option>Security</option>
            <option>Technology</option>
            <option>Billing & Pricing</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="show-explanation" className="rounded" defaultChecked />
          <label htmlFor="show-explanation" className="text-sm text-gray-700">
            Show explanation after each answer
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Start Practice →
        </button>
      </form>
    </div>
  )
}
