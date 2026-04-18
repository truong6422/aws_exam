import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { QuestionFilters } from '@/components/admin/question-filters'
import { adminApi } from '@/services/admin-api'
import type { Certification } from '@/services/exam-api'
import type { QuestionFilters as Filters } from '@/components/admin/question-filters'

export default function AdminQuestionsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <PageHeader title={t('admin.questions')} subtitle={t('admin.browse_question_bank')} />
        <button
          className="btn-primary"
          style={{ flexShrink: 0, marginTop: '4px' }}
          onClick={() => navigate('/admin/import')}
        >
          + {t('common.edit')}
        </button>
      </div>

      <QuestionFilters onFilterChange={handleFilterChange} />

      {loading && (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', letterSpacing: '-0.224px' }}>{t('common.loading')}</p>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(224,69,60,0.1)',
            border: '1px solid rgba(224,69,60,0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#e0453c',
            letterSpacing: '-0.224px',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', letterSpacing: '-0.224px' }}>{t('common.none')}</p>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((cert) => (
            <div
              key={cert.id}
              style={{
                background: '#272729',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', letterSpacing: '-0.224px' }}>
                {cert.code} — {cert.name}
              </h3>
              {cert.description && (
                <p style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.12px' }}>{cert.description}</p>
              )}
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  `${cert.total_questions} ${t('exam.questions_count').split('{{count}}')[0].trim()}`,
                  `${cert.time_limit_minutes} ${t('exam.minutes').split('{{count}}')[0].trim()}`,
                  `${cert.passing_score}% ${t('exam.passing_score').split('{{score}}')[0].trim()}`,
                ].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      letterSpacing: '-0.12px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
