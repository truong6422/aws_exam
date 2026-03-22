/**
 * Practice Setup Page — certification picker with optional domain filter.
 * Starts a practice exam using the same backend start endpoint, mode tracked in store.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification, type Domain } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'

export default function PracticeSetupPage() {
  const navigate = useNavigate()
  const initSession = useExamStore((s) => s.initSession)
  const addToast = useUiStore((s) => s.addToast)

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedCertId, setSelectedCertId] = useState<number | ''>('')
  const [selectedDomainId, setSelectedDomainId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    examApi
      .getCertifications()
      .then((certs) => {
        setCertifications(certs)
        if (certs.length > 0) setSelectedCertId(certs[0].id)
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load certifications.' }))
      .finally(() => setLoading(false))
  }, [addToast])

  useEffect(() => {
    if (!selectedCertId) { setDomains([]); return }
    examApi
      .getDomains(selectedCertId as number)
      .then(setDomains)
      .catch(() => setDomains([]))
  }, [selectedCertId])

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCertId) return
    setStarting(true)
    try {
      const attempt = await examApi.startExam(selectedCertId as number)
      initSession(attempt.id, attempt.questions, attempt.time_remaining_seconds, 'practice')
      navigate(`/practice/${attempt.id}`)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || 'Failed to start practice.' })
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Practice Mode"
        subtitle="Learn at your own pace with instant feedback"
      />

      <form
        onSubmit={handleStart}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Certification picker */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Certification
          </label>
          <select
            value={selectedCertId}
            onChange={(e) => { setSelectedCertId(Number(e.target.value)); setSelectedDomainId('') }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            required
          >
            <option value="">Select a certification…</option>
            {certifications.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Domain filter */}
        {domains.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Domain (optional)
            </label>
            <select
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info banner */}
        <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
          ✓ Explanations shown after each answer · No time limit · No score tracking
        </div>

        <button
          type="submit"
          disabled={starting || !selectedCertId}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {starting ? 'Starting…' : 'Start Practice →'}
        </button>
      </form>
    </div>
  )
}
