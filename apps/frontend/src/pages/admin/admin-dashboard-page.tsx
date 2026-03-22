import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { adminApi } from '@/services/admin-api'

interface Stats {
  certs: number
  domains: number
  questions: number
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ certs: 0, domains: 0, questions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .getCertifications()
      .then(async (certs) => {
        let totalDomains = 0
        let totalQuestions = 0
        for (const cert of certs) {
          const domains = await adminApi.getDomains(cert.id)
          totalDomains += domains.length
          totalQuestions += cert.total_questions ?? 0
        }
        setStats({ certs: certs.length, domains: totalDomains, questions: totalQuestions })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Certifications', value: stats.certs },
    { label: 'Domains', value: stats.domains },
    { label: 'Questions', value: stats.questions },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System overview" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {loading ? '…' : value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            onClick={() => navigate('/admin/import')}
          >
            Import Questions
          </button>
          <button
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/admin/questions')}
          >
            View Questions
          </button>
          <button
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </button>
        </div>
      </div>
    </div>
  )
}
