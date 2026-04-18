import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { adminApi, AdminUser } from '@/services/admin-api'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .getUsers()
      .then((data) => setUsers(data || []))
      .catch(() => setError('Không thể tải danh sách người dùng.'))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <PageHeader title={t('nav.users')} subtitle={t('admin.manage_accounts')} />
      </div>

      <div
        style={{
          background: '#272729',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
              {['Tên', 'Email', 'Vai trò', 'Thống kê', 'Tham gia'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '-0.12px',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: '#e0453c' }}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  {t('common.none')}
                </td>
              </tr>
            )}
            {!loading && !error && users.map((user) => {
              const hours = Math.floor((user.total_exam_seconds || 0) / 3600)
              const mins = Math.floor(((user.total_exam_seconds || 0) % 3600) / 60)
              const timeStr = hours > 0 ? `${hours}h${mins}m` : `${mins}m`
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', color: '#fff' }}>{user.name || user.username}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>
                    {user.is_staff ? 'Admin' : 'Học viên'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                      <span><strong>{timeStr}</strong> thi</span>
                      <span><strong>{user.total_questions_done || 0}</strong> câu đã làm</span>
                      <span><strong>{user.total_comments || 0}</strong> bình luận</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>
                    {formatDate(user.date_joined)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
