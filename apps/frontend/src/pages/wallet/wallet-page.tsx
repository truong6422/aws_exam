import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { walletApi, WalletData, TopUpCreateResponse, TopUpRequest } from '@/services/wallet-api'
import PageHeader from '@/components/ui/page-header'
import { EmptyState } from '@/components/shared/empty-state'

const panelStyle: React.CSSProperties = {
    background: '#272729',
    borderRadius: '12px',
    padding: '24px',
}

const tableHeaderStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '-0.12px',
    color: 'rgba(255,255,255,0.5)',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
}

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
}

const modalContentStyle: React.CSSProperties = {
    background: '#1d1d1f',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    position: 'relative',
}


export default function WalletPage() {
    const { t, i18n } = useTranslation()
    const [wallet, setWallet] = useState<WalletData | null>(null)
    const [history, setHistory] = useState<TopUpRequest[]>([])
    const [loading, setLoading] = useState(true)

    // TopUp Modal State
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [customAmount, setCustomAmount] = useState('100')
    const [topUpResult, setTopUpResult] = useState<TopUpCreateResponse | null>(null)
    const [submittingTopUp, setSubmittingTopUp] = useState(false)
    const [copied, setCopied] = useState(false)

    const lang = i18n.language === 'en' ? 'en-US' : 'vi-VN'

    useEffect(() => {
        fetchWallet()
    }, [])

    const fetchWallet = async () => {
        try {
            const [walletData, historyData] = await Promise.all([
                walletApi.getWallet(),
                walletApi.getTopUpHistory()
            ])
            setWallet(walletData)
            setHistory(historyData)
        } catch (err: any) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTopUp = async () => {
        const finalAmount = parseInt(customAmount)
        if (isNaN(finalAmount) || finalAmount < 10) {
            alert(t('wallet.min_amount_error'))
            return
        }
        if (finalAmount % 10 !== 0) {
            alert(t('wallet.multiple_10_error'))
            return
        }

        setSubmittingTopUp(true)
        try {
            const res = await walletApi.createTopUpRequest(finalAmount)
            setTopUpResult(res)
            fetchWallet() // refresh history
        } catch (err: any) {
            alert(err.message || t('wallet.error_topup'))
        } finally {
            setSubmittingTopUp(false)
        }
    }

    const handleCopy = async () => {
        if (!topUpResult) return
        try {
            await navigator.clipboard.writeText(topUpResult.telegram_template)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // Fallback
            const textArea = document.createElement('textarea')
            textArea.value = topUpResult.telegram_template
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const resetModal = () => {
        setShowTopUpModal(false)
        setTopUpResult(null)
        setCustomAmount('100')
    }

    if (loading) return <div className="p-6 label-caption">{t('common.loading')}</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PageHeader title={t('wallet.title')} subtitle={t('wallet.subtitle')} />
                <button className="btn-primary" onClick={() => setShowTopUpModal(true)}>
                    {t('wallet.topup_button')}
                </button>
            </div>

            {/* Balance Card */}
            <div style={{ ...panelStyle, background: 'linear-gradient(135deg, #272729 0%, #1d1d1f 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="label-caption" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                    {t('wallet.balance_label')}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-1.5px' }}>
                        {wallet?.balance.toLocaleString(lang)}
                    </span>
                    <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                        {t('wallet.unit')}
                    </span>
                </div>
            </div>

            {/* Transaction History */}
            <div style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.3px' }}>
                        {t('wallet.transaction_history')}
                    </span>
                </div>

                {(!wallet || (wallet.transactions.length === 0 && history.length === 0)) ? (
                    <EmptyState
                        title={t('wallet.no_transactions')}
                        description=""
                    />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>{t('wallet.tx_time')}</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>{t('wallet.tx_type')}</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>{t('wallet.tx_amount')}</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'left', paddingLeft: '24px' }}>{t('wallet.tx_note')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Show Non-Approved Top-up Requests (Pending & Rejected) */}
                                {history.filter(r => r.status !== 'approved').map((req) => (
                                    <tr key={`req-${req.id}`} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        background: req.status === 'pending' ? 'rgba(255,149,0,0.03)' : 'rgba(224,69,60,0.03)'
                                    }}>
                                        <td style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', padding: '16px 0' }}>
                                            {new Date(req.created_at).toLocaleString(lang, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '16px 0' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: req.status === 'pending' ? 'rgba(255, 149, 0, 0.15)' : 'rgba(224, 69, 60, 0.15)',
                                                color: req.status === 'pending' ? '#ff9500' : '#e0453c'
                                            }}>
                                                {t(`wallet.status_${req.status}`)}
                                            </span>
                                        </td>
                                        <td style={{
                                            textAlign: 'right',
                                            padding: '16px 0',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            color: req.status === 'pending' ? '#ff9500' : 'rgba(255,255,255,0.3)'
                                        }}>
                                            {req.amount_credits.toLocaleString(lang)} {t('wallet.unit')}
                                        </td>
                                        <td style={{ padding: '16px 0 16px 24px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                                            {req.status === 'rejected' ? (
                                                <span style={{ color: '#e0453c' }}>{req.admin_note || t('wallet.rejected_msg')}</span>
                                            ) : (
                                                <>{req.transaction_code} ({t('wallet.awaiting_approval')})</>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {wallet?.transactions.map((tx) => (
                                    <tr key={`tx-${tx.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', padding: '16px 0' }}>
                                            {new Date(tx.created_at).toLocaleString(lang, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '16px 0' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: tx.type === 'topup' ? 'rgba(29, 155, 94, 0.1)' :
                                                    tx.type === 'purchase' ? 'rgba(255, 153, 0, 0.1)' :
                                                        tx.type === 'admin_adjust' ? 'rgba(0, 113, 227, 0.1)' :
                                                            'rgba(163, 113, 247, 0.1)',
                                                color: tx.type === 'topup' ? '#1d9b5e' :
                                                    tx.type === 'purchase' ? '#ff9900' :
                                                        tx.type === 'admin_adjust' ? '#2997ff' :
                                                            '#a371f7'
                                            }}>
                                                {t(`wallet.type_${tx.type}`)}
                                            </span>
                                        </td>
                                        <td style={{
                                            textAlign: 'right',
                                            padding: '16px 0',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            color: tx.delta > 0 ? '#1d9b5e' : '#e0453c'
                                        }}>
                                            {tx.delta > 0 ? '+' : ''}{tx.delta.toLocaleString(lang)} {t('wallet.unit')}
                                        </td>
                                        <td style={{ padding: '16px 0 16px 24px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                                            {tx.note}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && (
                <div style={modalOverlayStyle} onClick={resetModal}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <button
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px' }}
                            onClick={resetModal}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        {!topUpResult ? (
                            <>
                                <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>
                                    {t('wallet.topup_modal_title')}
                                </h2>
                                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
                                    1 {t('wallet.unit')} = 1,000 {t('common.currency')}
                                </p>

                                <div style={{ marginBottom: '40px' }}>
                                    <label className="label-caption" style={{ display: 'block', marginBottom: '8px' }}>
                                        {t('wallet.amount_label')}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            placeholder={t('wallet.amount_placeholder')}
                                            value={customAmount}
                                            onChange={e => setCustomAmount(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                padding: '12px 16px',
                                                color: '#fff',
                                                fontSize: '24px',
                                                fontWeight: 600,
                                                textAlign: 'center'
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            right: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'rgba(255,255,255,0.3)',
                                            fontSize: '15px',
                                            fontWeight: 500
                                        }}>
                                            {t('wallet.unit')}
                                        </div>
                                    </div>
                                    <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                                        {t('wallet.multiple_10_hint')}
                                    </p>
                                </div>

                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '14px' }}
                                    disabled={submittingTopUp}
                                    onClick={handleCreateTopUp}
                                >
                                    {submittingTopUp ? t('common.loading') : t('wallet.continue_button')}
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '8px' }}>
                                    {t('wallet.topup_step2_title')}
                                </h2>
                                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
                                    {t('wallet.topup_instruction')}
                                </p>

                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <img
                                        src="/telegram-qr.jpeg"
                                        alt="Telegram QR"
                                        style={{ width: '160px', height: '160px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>

                                <div style={{
                                    background: '#000',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '24px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    position: 'relative'
                                }}>
                                    <pre style={{
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '14px',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                        lineHeight: '1.6',
                                        color: '#fff'
                                    }}>
                                        {topUpResult.telegram_template}
                                    </pre>
                                    <button
                                        onClick={handleCopy}
                                        style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            right: '12px',
                                            color: copied ? '#1d9b5e' : 'var(--ap-blue)',
                                            background: 'rgba(0,0,0,0.6)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(4px)'
                                        }}
                                    >
                                        {copied ? t('wallet.copied') : t('wallet.copy_button')}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {topUpResult.admin_telegram_url && (
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%', padding: '14px', background: '#0088cc' }}
                                            onClick={() => window.open(topUpResult.admin_telegram_url, '_blank')}
                                        >
                                            {t('wallet.open_telegram')}
                                        </button>
                                    )}
                                    {topUpResult.admin_zalo_phone && (
                                        <button
                                            className="btn-primary"
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                background: '#0068ff',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(topUpResult.admin_zalo_phone)
                                                alert(`${t('wallet.zalo_copied')}${topUpResult.admin_zalo_phone}`)
                                            }}
                                        >
                                            <span style={{ fontSize: '12px', opacity: 0.8 }}>Zalo:</span>
                                            {topUpResult.admin_zalo_phone}
                                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>Copy</span>
                                        </button>
                                    )}
                                    <button
                                        className="btn-secondary"
                                        style={{ width: '100%', padding: '14px' }}
                                        onClick={resetModal}
                                    >
                                        {t('wallet.close')}
                                    </button>
                                </div>

                                <p style={{ marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                                    {t('wallet.topup_note')}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
