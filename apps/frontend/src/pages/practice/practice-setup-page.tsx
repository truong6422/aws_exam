import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { examApi, type Certification } from '@/services/exam-api'

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: 'rgba(39, 39, 41, 0.7)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  cursor: 'pointer',
}

export default function PracticeSetupPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    examApi
      .getCertifications()
      .then((certs) => {
        // Ưu tiên SAA lên đầu, sau đó sắp xếp theo code
        const sorted = [...certs].sort((a, b) => {
          const aSAA = a.code.toUpperCase().includes('SAA')
          const bSAA = b.code.toUpperCase().includes('SAA')
          if (aSAA && !bSAA) return -1
          if (!aSAA && bSAA) return 1
          return a.code.localeCompare(b.code)
        })
        setCertifications(sorted)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const handleStart = (certId: number) => {
    navigate(`/practice?certification_id=${certId}`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
      <PageHeader
        title={t('practice.setup_title')}
        subtitle={t('practice.setup_subtitle')}
      />

      <div style={{
        background: 'rgba(0, 113, 227, 0.1)',
        border: '1px solid rgba(0, 113, 227, 0.2)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }} onClick={() => navigate('/dashboard')}>
        <p style={{ fontSize: '14px', color: '#fff', margin: 0, fontWeight: 500 }}>
          {t('practice.unlock_more_hint', 'Mở khóa thêm các đề thi để tăng số lượng câu hỏi luyện tập')}
        </p>
        <span style={{ color: '#0071e3', fontSize: '13px', fontWeight: 600 }}>
          {t('common.view_all_exams', 'Xem các đề thi')} →
        </span>
      </div>

      {certifications.length === 0 ? (
        <div style={{
          ...cardStyle,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'default'
        }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {t('practice.no_sets_title')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {certifications.map((cert) => (
            <div
              key={cert.id}
              style={cardStyle}
              onClick={() => handleStart(cert.id)}
              className="hover-card group"
            >
              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#0071e3',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    marginBottom: '12px',
                    boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
                  }}
                >
                  {cert.code}
                </span>
                <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                  {cert.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {t('practice.unlimited_time')}
                </p>
              </div>

              <div style={{
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#0071e3',
                fontSize: '13px',
                fontWeight: 500
              }}>
                <span>{t('practice.start_now')}</span>
                <span style={{ transition: 'transform 0.2s ease' }} className="group-hover:translate-x-1">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
