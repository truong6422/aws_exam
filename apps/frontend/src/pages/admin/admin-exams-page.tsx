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
            addToast({ type: 'error', message: 'Failed to load exam sets' })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleLock = async (setId: number, currentLocked: boolean, certId: number) => {
        setToggling(setId)
        try {
            await adminApi.updateExamSet(setId, { is_locked: !currentLocked })

            // Update local state
            setExamSets(prev => ({
                ...prev,
                [certId]: prev[certId].map(s => s.id === setId ? { ...s, is_locked: !currentLocked } : s)
            }))

            addToast({
                type: 'success',
                message: `${!currentLocked ? 'Locked' : 'Unlocked'} successfully`
            })
        } catch (err) {
            addToast({ type: 'error', message: 'Failed to update status' })
        } finally {
            setToggling(null)
        }
    }

    if (loading) return <div style={{ padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading management console...</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '100px' }}>
            <PageHeader title={t('admin.manage_certs_sets')} subtitle={t('admin.lock_unlock_api')} />

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
                                {examSets[cert.id]?.length || 0} Sets Available
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Exam Set Name</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Questions</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Status</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examSets[cert.id]?.map(set => (
                                    <tr key={set.id} style={{ transition: 'background 0.2s' }} className="admin-row-hover">
                                        <td style={cellStyle}>{set.name}</td>
                                        <td style={{ ...cellStyle, textAlign: 'center', opacity: 0.6 }}>{set.question_count}</td>
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
                                                {set.is_locked ? 'LOCKED' : 'OPEN'}
                                            </span>
                                        </td>
                                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleToggleLock(set.id, set.is_locked, cert.id)}
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
                                                {toggling === set.id ? t('common.loading') : (set.is_locked ? 'Unlock API' : 'Lock API')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    )
}
