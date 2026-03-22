/**
 * Exam Setup Page — lists certifications from API and starts an exam on selection.
 * Fetches certifications on mount, shows cards with metadata, starts exam on click.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'

export default function ExamSetupPage() {
  const navigate = useNavigate()
  const initSession = useExamStore((s) => s.initSession)
  const addToast = useUiStore((s) => s.addToast)

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<number | null>(null)

  useEffect(() => {
    examApi
      .getCertifications()
      .then(setCertifications)
      .catch(() => addToast({ type: 'error', message: 'Failed to load certifications.' }))
      .finally(() => setLoading(false))
  }, [addToast])

  const handleStart = async (cert: Certification) => {
    setStartingId(cert.id)
    try {
      const attempt = await examApi.startExam(cert.id)
      initSession(attempt.id, attempt.questions, attempt.time_remaining_seconds, 'exam')
      navigate(`/exam/${attempt.id}`)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || 'Failed to start exam.' })
    } finally {
      setStartingId(null)
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Exam" subtitle="Select a certification to start your timed exam" />

      {certifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No certifications available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="space-y-1">
                <span className="inline-block rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {cert.code}
                </span>
                <h3 className="font-semibold text-gray-800">{cert.name}</h3>
                {cert.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{cert.description}</p>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    ⏱ {cert.time_limit_minutes} min
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    📝 {cert.total_questions} questions
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    ✅ {cert.passing_score}% to pass
                  </span>
                </div>

                <button
                  onClick={() => handleStart(cert)}
                  disabled={startingId !== null}
                  className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {startingId === cert.id ? 'Starting…' : 'Start Exam →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
