import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { adminApi } from '@/services/admin-api'

interface Stats {
  certs: number
  questions: number
}

const statPanelStyle: React.CSSProperties = {
  background: '#272729',
  borderRadius: '12px',
  padding: '20px 24px',
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ certs: 0, questions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .getCertifications()
      .then(async (certs) => {
        let totalQuestions = 0
        for (const cert of certs) {
          totalQuestions += cert.total_questions ?? 0
        }
        setStats({ certs: certs.length, questions: totalQuestions })
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Chứng chỉ', value: stats.certs },
    { label: 'Câu hỏi', value: stats.questions },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title="Bảng điều khiển Quản trị" subtitle="Tổng quan hệ thống" />

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
          Các hành động nhanh
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/import')}
          >
            Nhập câu hỏi
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate('/admin/exams')}
          >
            Quản lý bài thi
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate('/admin/users')}
          >
            Quản lý người dùng
          </button>
        </div>
      </div>
    </div>
  )
}
