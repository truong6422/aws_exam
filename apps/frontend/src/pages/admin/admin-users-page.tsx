import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { adminApi, AdminUser } from '@/services/admin-api'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = (p: number, q: string) => {
    setLoading(true)
    setError('')
    adminApi
      .getUsers({ page: p, page_size: PAGE_SIZE, search: q || undefined })
      .then((res) => {
        setUsers(res.data || [])
        setTotalPages(res.links?.total_pages ?? 1)
        setTotalCount(res.links?.count ?? 0)
      })
      .catch(() => setError(t('admin.error_load_users')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers(page, search)
  }, [page, search])

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      setSearch(val)
    }, 400)
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <PageHeader title={t('nav.users')} subtitle={t('admin.manage_accounts')} />
        <input
          type="search"
          placeholder={t('common.search')}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full md:w-[220px]"
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ background: '#272729', borderRadius: '12px', overflow: 'hidden' }}>
        <div className="overflow-x-auto">
        <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
              {[t('admin.table_name'), t('admin.table_email'), t('admin.table_role'), t('admin.table_stats'), t('admin.table_joined')].map((h) => (
                <th
                  key={h}
                  style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.12px', color: 'rgba(255,255,255,0.5)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#e0453c' }}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
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
                    {user.is_staff ? t('admin.role_admin') : t('admin.role_learner')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                      <span><strong>{timeStr}</strong> {t('admin.time_exam')}</span>
                      <span><strong>{user.total_questions_done || 0}</strong> {t('admin.questions_done')}</span>
                      <span><strong>{user.total_comments || 0}</strong> {t('admin.comments_amount')}</span>
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

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
          >
            <span>{totalCount} người dùng · trang {page}/{totalPages}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: page === 1 ? 'transparent' : 'rgba(255,255,255,0.06)', color: page === 1 ? 'rgba(255,255,255,0.25)' : '#fff', cursor: page === 1 ? 'default' : 'pointer', fontSize: '12px' }}
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: page === totalPages ? 'transparent' : 'rgba(255,255,255,0.06)', color: page === totalPages ? 'rgba(255,255,255,0.25)' : '#fff', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '12px' }}
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
