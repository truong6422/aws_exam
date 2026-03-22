import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { QuestionFilters } from '@/components/admin/question-filters'
import { adminApi } from '@/services/admin-api'
import type { Certification } from '@/services/exam-api'
import type { QuestionFilters as Filters } from '@/components/admin/question-filters'

export default function AdminQuestionsPage() {
  const navigate = useNavigate()
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [filtered, setFiltered] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .getCertifications()
      .then((data) => {
        setCertifications(data)
        setFiltered(data)
      })
      .catch(() => setError('Failed to load certifications'))
      .finally(() => setLoading(false))
  }, [])

  const handleFilterChange = (filters: Filters) => {
    let result = certifications
    if (filters.certificationId) {
      result = result.filter((c) => c.id === filters.certificationId)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      )
    }
    setFiltered(result)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Questions" subtitle="Browse the question bank by certification" />
        <button
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          onClick={() => navigate('/admin/import')}
        >
          + Import Questions
        </button>
      </div>

      <QuestionFilters onFilterChange={handleFilterChange} />

      {loading && <p className="text-sm text-gray-400 italic">Loading…</p>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-gray-400 italic">No certifications found.</p>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filtered.map((cert) => (
            <div
              key={cert.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-gray-800">
                {cert.code} — {cert.name}
              </h3>
              {cert.description && (
                <p className="mt-1 text-sm text-gray-500">{cert.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                <span>{cert.total_questions} questions</span>
                <span>{cert.time_limit_minutes} min</span>
                <span>{cert.passing_score}% to pass</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
