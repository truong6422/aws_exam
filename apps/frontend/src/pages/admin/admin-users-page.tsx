import PageHeader from '@/components/ui/page-header'

export default function AdminUsersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <PageHeader title="Users" subtitle="Manage registered accounts" />
        <button className="btn-primary" style={{ flexShrink: 0, marginTop: '4px' }}>
          + Invite User
        </button>
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
              {['Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
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
            <tr>
              <td
                colSpan={5}
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  fontStyle: 'italic',
                }}
              >
                User list loads in Phase 2.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
