/**
 * ExamSetHistoryModal — hiển thị lịch sử thi của một bộ đề.
 * Bao gồm:
 *   - Biểu đồ tổng quan đúng/sai (donut chart thuần CSS)
 *   - Danh sách lần thi: paused (thời gian còn lại, số câu đã làm) / submitted (điểm, pass/fail)
 *   - Nút tiếp tục bài tạm dừng hoặc xem kết quả bài đã nộp
 *   - Nút bắt đầu thi mới
 */
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ExamListItem, ExamSet } from '@/services/exam-api'
import { examApi } from '@/services/exam-api'
import { useExamStore } from '@/stores/exam-store'
import { useUiStore } from '@/stores/ui-store'

interface Props {
    examSet: ExamSet
    history: ExamListItem[]
    onClose: () => void
    onStartNew: () => void
    loadingStart: boolean
}

function formatSeconds(secs: number): string {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}g ${m}p`
    if (m > 0) return `${m}p ${s}s`
    return `${s}s`
}

/** Minimal donut chart using SVG. correctPct = 0..100 */
function DonutChart({ correctPct, total, t }: { correctPct: number; total: number; t: any }) {
    const r = 44
    const circ = 2 * Math.PI * r
    const correct = circ * (correctPct / 100)
    const wrong = circ - correct

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
                {/* background track */}
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" stroke="rgba(255,255,255,0.08)" />
                {/* wrong (red) segment — starts at top */}
                {wrong > 0 && (
                    <circle
                        cx="50" cy="50" r={r} fill="none" strokeWidth="10"
                        stroke="#e0453c"
                        strokeDasharray={`${wrong} ${correct}`}
                        strokeDashoffset={circ * 0.25}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                )}
                {/* correct (green) segment */}
                {correct > 0 && (
                    <circle
                        cx="50" cy="50" r={r} fill="none" strokeWidth="10"
                        stroke="#1d9b5e"
                        strokeDasharray={`${correct} ${wrong}`}
                        strokeDashoffset={circ * 0.25 + wrong}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                )}
                <text x="50" y="54" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
                    {Math.round(correctPct)}%
                </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {t('exam.history_modal.total_sets')} <strong style={{ color: '#fff' }}>{total}</strong> {t('exam.history_modal.sets')}
                </span>
                <span style={{ fontSize: '12px', color: '#1d9b5e' }}>
                    ● {t('exam.history_modal.avg_correct')} {Math.round(correctPct)}%
                </span>
                <span style={{ fontSize: '12px', color: '#e0453c' }}>
                    ● {t('exam.history_modal.avg_wrong')} {Math.round(100 - correctPct)}%
                </span>
            </div>
        </div>
    )
}

export function ExamSetHistoryModal({ examSet, history, onClose, onStartNew, loadingStart }: Props) {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const initSession = useExamStore((s) => s.initSession)
    const addToast = useUiStore((s) => s.addToast)

    const submitted = history.filter((h) => ['submitted', 'expired'].includes(h.status))
    const paused = history.filter((h) => ['paused', 'in_progress'].includes(h.status))

    // Avg correct % across submitted
    const avgCorrectPct =
        submitted.length > 0
            ? submitted.reduce((sum, h) => sum + Number(h.score_percentage ?? 0), 0) / submitted.length
            : 0

    const handleResume = async (attempt: ExamListItem) => {
        try {
            const data = await examApi.resumeExam(attempt.id)
            initSession(data.id, data.questions, data.time_remaining_seconds, 'exam', data.user_answers, data.flagged_ids)
            navigate(`/exam/${data.id}`)
        } catch {
            addToast({ type: 'error', message: t('exam.error_resume') })
        }
    }

    const handleViewResult = (attempt: ExamListItem) => {
        navigate(`/exam/${attempt.id}/result`)
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#1c1c1e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '28px',
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.4px', marginBottom: '4px' }}>
                            {examSet.name}
                        </h2>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                            {t('exam.history_modal.title_history', { count: history.length })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
                    >
                        {t('exam.history_modal.close')}
                    </button>
                </div>

                {/* Overview chart — only if has submitted */}
                {submitted.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>
                            {t('exam.history_modal.overview')}
                        </p>
                        <DonutChart correctPct={avgCorrectPct} total={submitted.length} t={t} />
                    </div>
                )}

                {/* Paused attempts */}
                {paused.length > 0 && (
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,159,10,0.8)', marginBottom: '10px' }}>
                            {t('exam.history_modal.paused_title', { count: paused.length })}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {paused.map((attempt) => (
                                <div
                                    key={attempt.id}
                                    style={{
                                        background: 'rgba(255,159,10,0.05)',
                                        border: '1px solid rgba(255,159,10,0.2)',
                                        borderRadius: '10px',
                                        padding: '14px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                            {new Date(attempt.started_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                                                {t('exam.history_modal.time_left')} <strong style={{ color: '#ff9f0a' }}>{formatSeconds(attempt.time_remaining_seconds)}</strong>
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                                                {t('exam.history_modal.done')} <strong style={{ color: '#fff' }}>{attempt.answered_count}/{attempt.total_questions}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleResume(attempt)}
                                        style={{
                                            background: 'rgba(255,159,10,0.15)',
                                            border: '1px solid rgba(255,159,10,0.4)',
                                            borderRadius: '8px',
                                            color: '#ff9f0a',
                                            padding: '7px 14px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {t('exam.history_modal.continue_btn')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submitted attempts */}
                {submitted.length > 0 && (
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '10px' }}>
                            {t('exam.history_modal.submitted_title', { count: submitted.length })}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {submitted.map((attempt) => {
                                const score = Number(attempt.score_percentage ?? 0)
                                const passed = score >= 72
                                return (
                                    <div
                                        key={attempt.id}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '10px',
                                            padding: '14px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                                    {new Date(attempt.started_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700,
                                                    padding: '2px 8px', borderRadius: '6px',
                                                    background: passed ? 'rgba(29,155,94,0.15)' : 'rgba(224,69,60,0.12)',
                                                    color: passed ? '#1d9b5e' : '#e0453c',
                                                    border: `1px solid ${passed ? 'rgba(29,155,94,0.3)' : 'rgba(224,69,60,0.3)'}`,
                                                }}>
                                                    {passed ? t('exam.history_modal.status_passed') : t('exam.history_modal.status_failed')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                                                    {t('exam.history_modal.score_label')} <strong style={{ color: passed ? '#1d9b5e' : '#e0453c' }}>{score.toFixed(1)}%</strong>
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                                                    {attempt.correct_count}/{attempt.total_questions} {t('exam.history_modal.correct_questions')}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                                                    ⏱ {formatSeconds(attempt.time_spent_seconds)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleViewResult(attempt)}
                                            style={{
                                                background: 'rgba(255,255,255,0.08)',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                borderRadius: '8px',
                                                color: 'rgba(255,255,255,0.7)',
                                                padding: '7px 14px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {t('exam.history_modal.details_btn')}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Action: Thi mới */}
                <button
                    onClick={onStartNew}
                    disabled={loadingStart}
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600 }}
                >
                    {loadingStart ? t('exam.history_modal.starting') : t('exam.history_modal.start_new')}
                </button>
            </div>
        </div>
    )
}
