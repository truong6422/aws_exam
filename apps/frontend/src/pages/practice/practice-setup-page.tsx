import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#242426',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: '#fff',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 400,
  letterSpacing: '-0.12px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '6px',
}

export default function PracticeSetupPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const initSession = useExamStore((s) => s.initSession)
  const addToast = useUiStore((s) => s.addToast)

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [selectedCertId, setSelectedCertId] = useState<number | ''>('')
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const { bookmarked, loadBookmarks } = useExamStore()

  useEffect(() => {
    examApi
      .getCertifications()
      .then((certs) => {
        setCertifications(certs)
        if (certs.length > 0) setSelectedCertId(certs[0].id)
      })
      .catch(() => addToast({ type: 'error', message: t('practice.error_load') }))
      .finally(() => setLoading(false))

    loadBookmarks()
  }, [addToast, loadBookmarks, t])


  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCertId) return
    setStarting(true)
    try {
      const attempt = await examApi.startExam(selectedCertId as number)

      let questions = attempt.questions
      if (bookmarkedOnly && bookmarked.length > 0) {
        questions = questions.filter((q) => bookmarked.includes(q.id))
      }

      if (bookmarkedOnly && questions.length === 0) {
        addToast({ type: 'warning', message: t('practice.no_bookmarked_questions') })
        setStarting(false)
        return
      }

      initSession(attempt.id, questions, attempt.time_remaining_seconds, 'practice')
      navigate(`/practice/${attempt.id}`)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || t('practice.error_start') })
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: '32px', height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#0071e3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={t('practice.setup_title')}
        subtitle={t('practice.setup_subtitle')}
      />

      <form
        onSubmit={handleStart}
        style={{
          background: '#272729',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Certification picker */}
        <div>
          <label style={labelStyle}>{t('practice.certification_label')}</label>
          <select
            value={selectedCertId}
            onChange={(e) => { setSelectedCertId(Number(e.target.value)) }}
            style={selectStyle}
            required
          >
            <option value="">{t('practice.select_certification')}</option>
            {certifications.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>


        {/* Bookmarked only filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={bookmarkedOnly}
            onChange={(e) => setBookmarkedOnly(e.target.checked)}
            style={{ width: '14px', height: '14px', accentColor: '#f5a623' }}
          />
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{t('practice.bookmarked_only')}</span>
        </label>

        {/* Info banner */}
        <div
          style={{
            background: 'rgba(0,113,227,0.1)',
            border: '1px solid rgba(0,113,227,0.4)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#2997ff',
            letterSpacing: '-0.12px',
          }}
        >
          {t('practice.info_banner')}
        </div>

        <button
          type="submit"
          disabled={starting || !selectedCertId}
          className="btn-primary"
          style={{ width: '100%', opacity: starting || !selectedCertId ? 0.6 : 1 }}
        >
          {starting ? t('practice.starting') : t('practice.start_button')}
        </button>
      </form>
    </div>
  )
}
