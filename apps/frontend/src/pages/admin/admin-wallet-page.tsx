import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { adminApi, type TopUpRequestAdmin } from '@/services/admin-api'
import { useUiStore } from '@/stores/ui-store'

const tableHeaderStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '-0.1px',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
}

const cellStyle: React.CSSProperties = {
    padding: '16px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
    borderBottom: '1px solid rgba(255,255,255,0.04)'
}


export default function AdminWalletPage() {
    const { t, i18n } = useTranslation()
    const addToast = useUiStore((s) => s.addToast)
    const [requests, setRequests] = useState<TopUpRequestAdmin[]>([])
    const [summary, setSummary] = useState<{ pending: number, approved: number, rejected: number, total: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('pending')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [processing, setProcessing] = useState<number | null>(null)
    const [rejectModal, setRejectModal] = useState<{ id: number; adminNote: string } | null>(null)

    const lang = i18n.language === 'en' ? 'en-US' : 'vi-VN'

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        fetchRequests()
        fetchSummary()
    }, [statusFilter, debouncedSearch])

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const data = await adminApi.getTopUpRequests({
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: debouncedSearch || undefined
            })
            setRequests(data)
        } catch (err) {
            addToast({ type: 'error', message: t('admin.wallet.error_load') })
        } finally {
            setLoading(false)
        }
    }


    const fetchSummary = async () => {
        try {
            const data = await adminApi.getTopUpSummary()
            setSummary(data)
        } catch (err) {
            console.error(err)
        }
    }

    const handleApprove = async (id: number) => {
        if (processing) return
        setProcessing(id)
        try {
            await adminApi.approveTopUp(id)
            fetchRequests()
            fetchSummary()
            addToast({ type: 'success', message: t('admin.wallet.approve_success') })
        } catch (err) {
            addToast({ type: 'error', message: t('admin.wallet.approve_error') })
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async () => {
        if (!rejectModal || processing) return
        const { id, adminNote } = rejectModal
        setProcessing(id)
        setRejectModal(null)
        try {
            await adminApi.rejectTopUp(id, { admin_note: adminNote })
            fetchRequests()
            fetchSummary()
            addToast({ type: 'success', message: t('admin.wallet.reject_success') })
        } catch (err) {
            addToast({ type: 'error', message: t('admin.wallet.reject_error') })
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <PageHeader
                title={t('admin.wallet.page_title')}
                subtitle={t('admin.wallet.page_subtitle')}
            />

            {/* Filter Tabs & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'pending', 'approved', 'rejected'].map(s => {
                        const count = s === 'all' ? summary?.total : summary?.[s as keyof typeof summary];
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    background: statusFilter === s ? 'var(--ap-blue)' : 'rgba(255,255,255,0.05)',
                                    color: statusFilter === s ? '#fff' : 'rgba(255,255,255,0.5)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {t(`wallet.status_${s === 'all' ? 'all' : s}`)}
                                {count !== undefined && (
                                    <span style={{
                                        background: statusFilter === s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                        color: statusFilter === s ? '#fff' : 'rgba(255,255,255,0.4)',
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        borderRadius: '10px'
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <input
                        type="text"
                        placeholder={t('admin.wallet.search_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '8px 16px 8px 40px',
                            color: '#fff',
                            fontSize: '14px'
                        }}
                    />
                    <svg
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </div>

            <div style={{ background: '#272729', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={tableHeaderStyle}>{t('admin.wallet.table_user')}</th>
                            <th style={tableHeaderStyle}>{t('admin.wallet.table_txn_code')}</th>
                            <th style={tableHeaderStyle}>{t('admin.wallet.table_credits')}</th>
                            <th style={tableHeaderStyle}>{t('admin.wallet.table_vnd')}</th>
                            <th style={tableHeaderStyle}>{t('admin.wallet.table_status')}</th>
                            <th style={tableHeaderStyle}>{t('admin.wallet.table_date')}</th>
                            <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>{t('admin.wallet.table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '60px', textAlign: 'center' }}>
                                    <div className="spinner-small" style={{ margin: '0 auto' }} />
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                                    {t('admin.wallet.no_requests')}
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td style={cellStyle}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: '#fff' }}>{req.user_name}</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{req.user_email}</span>
                                        </div>
                                    </td>
                                    <td style={cellStyle}>
                                        <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                            {req.transaction_code}
                                        </code>
                                    </td>
                                    <td style={cellStyle}>
                                        <span style={{ fontWeight: 600, color: '#ff9500' }}>{req.amount_credits} {t('wallet.unit')}</span>
                                    </td>
                                    <td style={cellStyle}>
                                        {req.amount_vnd.toLocaleString(lang)} {t('common.currency')}
                                    </td>
                                    <td style={cellStyle}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase',
                                            background: req.status === 'pending' ? 'rgba(255,149,0,0.1)' :
                                                req.status === 'approved' ? 'rgba(52,199,89,0.1)' : 'rgba(224,69,60,0.1)',
                                            color: req.status === 'pending' ? '#ff9500' :
                                                req.status === 'approved' ? '#34c759' : '#e0453c'
                                        }}>
                                            {t(`wallet.status_${req.status}`)}
                                        </span>
                                    </td>
                                    <td style={cellStyle}>
                                        {new Date(req.created_at).toLocaleDateString(lang)}
                                    </td>
                                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                                        {req.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={processing === req.id}
                                                    style={{
                                                        background: '#34c759',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {processing === req.id ? '...' : t('admin.wallet.approve_btn')}
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ id: req.id, adminNote: '' })}
                                                    disabled={processing === req.id}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.06)',
                                                        color: 'rgba(255,255,255,0.8)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t('admin.wallet.reject_btn')}
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                                                {req.admin_note || '-'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {rejectModal && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(10px)'
                    }}
                    onClick={() => setRejectModal(null)}
                >
                    <div
                        style={{
                            background: '#1d1d1f', borderRadius: '20px', width: '100%', maxWidth: '400px',
                            padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
                            {t('admin.wallet.reject_modal_title')}
                        </h3>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                                {t('admin.wallet.reject_modal_note_label')}
                            </label>
                            <textarea
                                value={rejectModal.adminNote}
                                onChange={e => setRejectModal({ ...rejectModal, adminNote: e.target.value })}
                                placeholder={t('admin.wallet.reject_modal_note_placeholder')}
                                style={{
                                    width: '100%', height: '100px', background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                    color: '#fff', padding: '12px', fontSize: '14px', resize: 'none'
                                }}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, padding: '12px', background: '#e0453c' }}
                                onClick={handleReject}
                            >
                                {t('admin.wallet.reject_modal_confirm')}
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1, padding: '12px' }}
                                onClick={() => setRejectModal(null)}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
