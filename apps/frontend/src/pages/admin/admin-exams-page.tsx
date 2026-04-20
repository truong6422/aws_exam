import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { adminApi } from '@/services/admin-api'
import type { Certification } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'

interface ExamSet {
    id: number
    name: string
    is_locked: boolean
    question_count: number
    price_credits: number
}

const tableHeaderStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
}

const cellStyle: React.CSSProperties = {
    padding: '16px',
    fontSize: '13px',
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
}

export default function AdminExamsPage() {
    const { t } = useTranslation()
    const addToast = useUiStore((s) => s.addToast)
    const [certs, setCerts] = useState<Certification[]>([])
    const [examSets, setExamSets] = useState<Record<number, ExamSet[]>>({})
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState<number | null>(null)

    // Price editing state
    const [editingPrice, setEditingPrice] = useState<number | null>(null)
    const [priceInput, setPriceInput] = useState<string>('')
    const [savingPrice, setSavingPrice] = useState<number | null>(null)

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)
    const [bulkPrice, setBulkPrice] = useState<string>('')
    const [bulkLocked, setBulkLocked] = useState<'locked' | 'unlocked' | 'keep'>('keep')

    useEffect(() => {
        loadAll()
    }, [])

    const loadAll = async () => {
        try {
            const allCerts = await adminApi.getCertifications()
            setCerts(allCerts)

            const setsMap: Record<number, ExamSet[]> = {}
            for (const cert of allCerts) {
                setsMap[cert.id] = await adminApi.getExamSets(cert.id)
            }
            setExamSets(setsMap)
        } catch (err) {
            addToast({ type: 'error', message: t('admin.exams.error_load_sets') })
        } finally {
            setLoading(false)
        }
    }

    const handleSavePrice = async (setId: number, certId: number) => {
        const parsed = parseInt(priceInput, 10)
        if (isNaN(parsed) || parsed < 0) {
            addToast({ type: 'error', message: t('admin.wallet.price_invalid') })
            return
        }
        setSavingPrice(setId)
        try {
            await adminApi.updateExamSet(setId, { price_credits: parsed })
            setExamSets(prev => ({
                ...prev,
                [certId]: prev[certId].map(s => s.id === setId ? { ...s, price_credits: parsed } : s)
            }))
            setEditingPrice(null)
            addToast({ type: 'success', message: t('admin.wallet.price_saved') })
        } catch {
            addToast({ type: 'error', message: t('admin.wallet.price_save_error') })
        } finally {
            setSavingPrice(null)
        }
    }

    const handleBulkUpdate = async () => {
        if (selectedIds.length === 0) return

        const data: { is_locked?: boolean; price_credits?: number } = {}
        if (bulkPrice !== '') {
            const parsed = parseInt(bulkPrice, 10)
            if (!isNaN(parsed)) data.price_credits = parsed
        }
        if (bulkLocked !== 'keep') {
            data.is_locked = bulkLocked === 'locked'
        }

        if (Object.keys(data).length === 0) {
            setShowBulkModal(false)
            return
        }

        setIsBulkUpdating(true)
        try {
            await adminApi.bulkUpdateExamSets(selectedIds, data)
            addToast({ type: 'success', message: t('admin.exams.bulk_success', { count: selectedIds.length }) })
            loadAll()
            setSelectedIds([])
            setShowBulkModal(false)
        } catch {
            addToast({ type: 'error', message: t('admin.exams.bulk_error') })
        } finally {
            setIsBulkUpdating(false)
        }
    }

    const [isFreeingIncomplete, setIsFreeingIncomplete] = useState(false)
    const handleFreeIncomplete = async () => {
        setIsFreeingIncomplete(true)
        try {
            const res = await adminApi.freeIncompleteExamSets()
            addToast({ type: 'success', message: res.detail })
            loadAll()
        } catch (err) {
            addToast({ type: 'error', message: 'Failed to process incomplete sets' })
        } finally {
            setIsFreeingIncomplete(false)
        }
    }

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = (certSets: ExamSet[]) => {
        const setIds = certSets.map(s => s.id)
        const allSelected = setIds.every(id => selectedIds.includes(id))
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !setIds.includes(id)))
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...setIds])])
        }
    }

    if (loading) return <div style={{ padding: '40px', color: 'rgba(255,255,255,0.5)' }}>{t('admin.loading_console')}</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title={t('admin.manage_certs_sets')} subtitle={t('admin.lock_unlock_api')} />
                <button
                    onClick={handleFreeIncomplete}
                    disabled={isFreeingIncomplete}
                    className="btn-ghost"
                    style={{
                        fontSize: '12px',
                        padding: '8px 16px',
                        borderColor: 'rgba(52,199,89,0.3)',
                        color: '#34c759'
                    }}
                >
                    {isFreeingIncomplete ? t('common.loading') : '🎁 Free Incomplete Sets (< 65)'}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {certs.map(cert => (
                    <div key={cert.id} style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            background: 'rgba(255,255,255,0.02)',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>{cert.name}</h3>
                                <span style={{ fontSize: '11px', color: '#0071e3', fontWeight: 700 }}>{cert.code}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                {examSets[cert.id]?.length || 0} {t('admin.exams.sets_available')}
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...tableHeaderStyle, width: '40px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={(examSets[cert.id] || []).length > 0 && (examSets[cert.id] || []).every(s => selectedIds.includes(s.id))}
                                            onChange={() => toggleSelectAll(examSets[cert.id] || [])}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>{t('admin.exams.exam_set_name')}</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>{t('admin.exams.questions')}</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>{t('admin.wallet.price_column_header')}</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>{t('admin.exams.status')}</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>{t('admin.exams.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examSets[cert.id]?.map(set => (
                                    <tr key={set.id} style={{
                                        transition: 'background 0.2s',
                                        background: selectedIds.includes(set.id) ? 'rgba(0, 113, 227, 0.1)' : 'transparent'
                                    }} className="admin-row-hover">
                                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(set.id)}
                                                onChange={() => toggleSelect(set.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={cellStyle}>{set.name}</td>
                                        <td style={{ ...cellStyle, textAlign: 'center', opacity: 0.6 }}>{set.question_count}</td>
                                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                                            {editingPrice === set.id ? (
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={priceInput}
                                                        onChange={(e) => setPriceInput(e.target.value)}
                                                        style={{
                                                            width: '60px', padding: '4px 8px',
                                                            background: 'rgba(255,255,255,0.06)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            borderRadius: '6px', color: '#fff', fontSize: '12px'
                                                        }}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSavePrice(set.id, cert.id)
                                                            if (e.key === 'Escape') setEditingPrice(null)
                                                        }}
                                                    />
                                                    <button onClick={() => handleSavePrice(set.id, cert.id)}
                                                        disabled={savingPrice === set.id}
                                                        style={{ background: '#34c759', border: 'none', color: '#fff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>
                                                        {savingPrice === set.id ? '...' : '✓'}
                                                    </button>
                                                    <button onClick={() => setEditingPrice(null)}
                                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { setEditingPrice(set.id); setPriceInput(String(set.price_credits)) }}
                                                    style={{
                                                        background: 'transparent', cursor: 'pointer',
                                                        color: set.price_credits === 0 ? '#34c759' : '#ff9f0a',
                                                        fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                                                        borderRadius: '100px',
                                                        border: '1px solid ' + (set.price_credits === 0 ? 'rgba(52,199,89,0.2)' : 'rgba(255,159,10,0.2)')
                                                    }}
                                                >
                                                    {set.price_credits === 0 ? t('admin.wallet.price_free') : `${set.price_credits} xu`}
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '100px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                background: set.is_locked ? 'rgba(224, 69, 60, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                                                color: set.is_locked ? '#ff3b30' : '#34c759',
                                                border: set.is_locked ? '1px solid rgba(224, 69, 60, 0.2)' : '1px solid rgba(52, 199, 89, 0.2)'
                                            }}>
                                                {set.is_locked ? t('admin.exams.locked_status') : t('admin.exams.unlocked_status')}
                                            </span>
                                        </td>
                                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={async () => {
                                                        const currentLocked = set.is_locked
                                                        setToggling(set.id)
                                                        try {
                                                            await adminApi.updateExamSet(set.id, { is_locked: !currentLocked })
                                                            setExamSets(prev => ({
                                                                ...prev,
                                                                [cert.id]: prev[cert.id].map(s => s.id === set.id ? { ...s, is_locked: !currentLocked } : s)
                                                            }))
                                                            addToast({ type: 'success', message: `${!currentLocked ? t('admin.exams.locked_success') : t('admin.exams.unlocked_success')}` })
                                                        } catch {
                                                            addToast({ type: 'error', message: t('admin.exams.error_update_status') })
                                                        } finally {
                                                            setToggling(null)
                                                        }
                                                    }}
                                                    disabled={toggling === set.id}
                                                    style={{
                                                        background: set.is_locked ? '#34c759' : '#ff3b30',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '6px 14px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: toggling === set.id ? 'not-allowed' : 'pointer',
                                                        opacity: toggling === set.id ? 0.5 : 1,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {toggling === set.id ? t('common.loading') : (set.is_locked ? t('admin.exams.unlock_button') : t('admin.exams.lock_button'))}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1d1d1f',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    zIndex: 100,
                    animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        {t('admin.exams.selected_count', { count: selectedIds.length })}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                setBulkPrice('')
                                setBulkLocked('keep')
                                setShowBulkModal(true)
                            }}
                            className="btn-primary"
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                        >
                            {t('admin.exams.bulk_edit_button', 'Chỉnh sửa hàng loạt')}
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="btn-ghost"
                            style={{ fontSize: '13px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Update Modal */}
            {showBulkModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 110
                }} onClick={() => setShowBulkModal(false)}>
                    <div style={{
                        background: '#1d1d1f',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '20px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0 }}>
                            {t('admin.exams.bulk_title', 'Chỉnh sửa hàng loạt')}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                                {t('admin.wallet.price_column_header')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder={t('admin.exams.bulk_price_placeholder', 'Bỏ trống để giữ nguyên')}
                                value={bulkPrice}
                                onChange={e => setBulkPrice(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: '#fff',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                                {t('admin.exams.status')}
                            </label>
                            <select
                                value={bulkLocked}
                                onChange={e => setBulkLocked(e.target.value as any)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: '#fff',
                                    outline: 'none',
                                }}
                            >
                                <option value="keep" style={{ background: '#1d1d1f', color: '#fff' }}>{t('admin.exams.keep_status', 'Giữ nguyên trạng thái')}</option>
                                <option value="unlocked" style={{ background: '#1d1d1f', color: '#fff' }}>{t('admin.exams.unlocked_status')}</option>
                                <option value="locked" style={{ background: '#1d1d1f', color: '#fff' }}>{t('admin.exams.locked_status')}</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                onClick={handleBulkUpdate}
                                disabled={isBulkUpdating}
                                className="btn-primary"
                                style={{ flex: 1, padding: '12px' }}
                            >
                                {isBulkUpdating ? t('common.loading') : t('common.save')}
                            </button>
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="btn-ghost"
                                style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
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
