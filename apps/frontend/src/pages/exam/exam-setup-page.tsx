import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'

/** Exam configuration form — logic wired in Phase 2. */
export default function ExamSetupPage() {
  const navigate = useNavigate()

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    // Phase 2: POST /api/exams/sessions/ and navigate to session
    navigate('/exam/placeholder-session-id')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="New Exam" subtitle="Configure your exam session" />

      <form onSubmit={handleStart} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Question Count</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>65 (full exam)</option>
            <option>30 (half exam)</option>
            <option>20 (quick)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Domain Filter</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Domains</option>
            <option>Cloud Concepts</option>
            <option>Security</option>
            <option>Technology</option>
            <option>Billing & Pricing</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Time Limit</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>90 minutes</option>
            <option>60 minutes</option>
            <option>No limit</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Start Exam →
        </button>
      </form>
    </div>
  )
}
