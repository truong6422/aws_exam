import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { adminApi, DashboardStats } from '@/services/admin-api'

const statPanelStyle: React.CSSProperties = {
  background: '#272729',
  borderRadius: '12px',
  padding: '20px 24px',
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .getDashboardStats()
      .then((data) => setStats(data))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h${mins}m` : `${mins}m`
  }

  const statCards = [
    { label: t('admin.certifications'), value: stats?.certifications ?? 0 },
    { label: t('admin.questions'), value: stats?.questions ?? 0 },
    { label: t('admin.users_count'), value: stats?.users ?? 0 },
    { label: t('admin.total_exam_time'), value: stats ? formatTime(stats.total_time_seconds) : '—' },
  ]

  const totalSets = stats?.exam_sets.total || 0
  const unlockedSets = stats?.exam_sets.unlocked || 0
  const lockedSets = stats?.exam_sets.locked || 0
  const percentUnlocked = totalSets > 0 ? (unlockedSets / totalSets) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title={t('admin.dashboard_title')} subtitle={t('admin.dashboard_subtitle')} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {statCards.map(({ label, value }) => (
          <div key={label} style={statPanelStyle}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '-0.12px',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px',
              }}
            >
              {label}
            </p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {loading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: '#272729', borderRadius: '12px', padding: '20px 24px' }}>
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
            {t('admin.unlock_rate_title')} ({totalSets})
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(#1d9b5e ${percentUnlocked}%, rgba(255,255,255,0.1) 0)`
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff' }}>
                <span style={{ display: 'block', width: '12px', height: '12px', borderRadius: '2px', background: '#1d9b5e' }} />
                <span>{t('admin.unlocked_label')}: <strong>{unlockedSets}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff' }}>
                <span style={{ display: 'block', width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} />
                <span>{t('admin.locked_label')}: <strong>{lockedSets}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#272729', borderRadius: '12px', padding: '20px 24px' }}>
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '-0.12px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '14px',
          }}
        >
          {t('admin.quick_actions')}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/import')}
          >
            {t('admin.import_questions')}
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate('/admin/exams')}
          >
            {t('admin.manage_exams')}
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate('/admin/users')}
          >
            {t('admin.manage_users')}
          </button>
        </div>
      </div>
    </div>
  )
}
