import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { adminApi } from '@/services/admin-api'

interface Stats {
  certs: number
  domains: number
  questions: number
}

const statPanelStyle: React.CSSProperties = {
  background: '#272729',
  borderRadius: '12px',
  padding: '20px 24px',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title="Admin Dashboard" subtitle="System overview" />

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
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '-0.12px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '14px',
          }}
        >
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/import')}
          >
            Import Questions
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate('/admin/questions')}
          >
            View Questions
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </button>
        </div>
      </div>
    </div>
  )
}
