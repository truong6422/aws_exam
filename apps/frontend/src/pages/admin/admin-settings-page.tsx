import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { adminApi } from '@/services/admin-api'
import { useUiStore } from '@/stores/ui-store'

const sectionStyle: React.CSSProperties = {
    background: '#272729',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '24px'
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '8px',
    textTransform: 'uppercase'
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s'
}

export default function AdminSettingsPage() {
    const { t } = useTranslation()
    const addToast = useUiStore((s) => s.addToast)

    const [config, setConfig] = useState({
        telegram_username: '',
        zalo_phone: '',
        telegram_bot_token: '',
        admin_chat_id: '',
        vnd_per_credit: '1000',
        bank_account_info: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchConfig = async () => {
        try {
            const data = await adminApi.getSystemConfig()
            setConfig({
                telegram_username: data.telegram_username || '',
                zalo_phone: data.zalo_phone || '',
                telegram_bot_token: data.telegram_bot_token || '',
                admin_chat_id: data.admin_chat_id || '',
                vnd_per_credit: data.vnd_per_credit || '1000',
                bank_account_info: data.bank_account_info || ''
            })
        } catch (err) {
            addToast({ type: 'error', message: t('admin.settings.error_load') })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await adminApi.updateSystemConfig(config)
            addToast({ type: 'success', message: t('admin.settings.config_success') })
        } catch (err) {
            addToast({ type: 'error', message: t('admin.settings.error_save') })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('admin.settings.loading')}</div>

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <PageHeader
                title={t('admin.settings.title')}
                subtitle={t('admin.settings.subtitle')}
            />

            <div style={{ marginTop: '32px' }}>
                {/* Telegram Config */}
                <div style={sectionStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('admin.settings.telegram_section')}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        <div>
                            <label style={labelStyle}>{t('admin.settings.telegram_support')}</label>
                            <input
                                style={inputStyle}
                                value={config.telegram_username}
                                onChange={e => setConfig({ ...config, telegram_username: e.target.value })}
                                placeholder="@username"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>{t('admin.settings.zalo_support')}</label>
                            <input
                                style={inputStyle}
                                value={config.zalo_phone}
                                onChange={e => setConfig({ ...config, zalo_phone: e.target.value })}
                                placeholder="09xxxxxxx"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>{t('admin.settings.admin_chat_id')}</label>
                            <input
                                style={inputStyle}
                                value={config.admin_chat_id}
                                onChange={e => setConfig({ ...config, admin_chat_id: e.target.value })}
                                placeholder={t('admin.settings.admin_chat_id_placeholder')}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <label style={labelStyle}>{t('admin.settings.bot_token')}</label>
                        <input
                            type="password"
                            style={inputStyle}
                            value={config.telegram_bot_token}
                            onChange={e => setConfig({ ...config, telegram_bot_token: e.target.value })}
                            placeholder="8169380168:AAECf..."
                        />
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                            {t('admin.settings.bot_token_hint')}
                        </p>
                    </div>
                </div>

                {/* Finance Config */}
                <div style={sectionStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('admin.settings.finance_section')}
                    </h3>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>{t('admin.settings.exchange_rate')}</label>
                        <input
                            type="number"
                            style={{ ...inputStyle, width: '200px' }}
                            value={config.vnd_per_credit}
                            onChange={e => setConfig({ ...config, vnd_per_credit: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>{t('admin.settings.bank_info')}</label>
                        <textarea
                            style={{ ...inputStyle, height: '120px', resize: 'none' }}
                            value={config.bank_account_info}
                            onChange={e => setConfig({ ...config, bank_account_info: e.target.value })}
                            placeholder={t('admin.settings.bank_info_placeholder')}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary"
                        style={{ padding: '12px 40px', fontSize: '15px' }}
                    >
                        {saving ? t('admin.settings.saving') : t('admin.settings.save_all')}
                    </button>
                </div>
            </div>
        </div>
    )
}
