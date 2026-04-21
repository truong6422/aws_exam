import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/ui/page-header'
import { ImportDropzone } from '@/components/admin/import-dropzone'
import { ImportResultPanel } from '@/components/admin/import-result-panel'
import { adminApi } from '@/services/admin-api'
import type { ImportPayload, ImportResult } from '@/services/admin-api'

export default function AdminImportPage() {
  const { t } = useTranslation()
  const [parsedData, setParsedData] = useState<ImportPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileLoaded = (data: ImportPayload) => {
    setParsedData(data)
    setResult(null)
  }

  const handleImport = async () => {
    if (!parsedData) return
    setIsLoading(true)
    setResult(null)
    try {
      const res = await adminApi.importQuestions(parsedData)
      setResult(res)
    } catch (err: unknown) {
      const anyErr = err as { message?: string }
      setResult({ imported: 0, errors: [anyErr?.message ?? 'Unknown error'] })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setParsedData(null)
    setResult(null)
  }

  return (
    <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={t('nav.import')}
        subtitle={t('admin.import.subtitle_desc')}
      />

      <div
        style={{
          background: '#272729',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <ImportDropzone onFileLoaded={handleFileLoaded} isLoading={isLoading} />

        {parsedData && (
          <div
            style={{
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              padding: '16px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '-0.12px',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px',
              }}
            >
              {t('common.view_all')}
            </p>
            <p>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('admin.import.cert_label')} </span>
              <strong style={{ color: '#fff' }}>{parsedData.certification_code}</strong>
            </p>
            <p>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('admin.import.domain_label')} </span>
              <strong style={{ color: '#fff' }}>{parsedData.domain_name}</strong>
            </p>
            <p>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('admin.import.questions_label')} </span>
              <strong style={{ color: '#fff' }}>{parsedData.questions?.length ?? 0}</strong>
            </p>
          </div>
        )}

        {parsedData && (
          <button
            className="btn-primary"
            style={{ width: '100%', opacity: isLoading ? 0.6 : 1 }}
            onClick={handleImport}
            disabled={isLoading}
          >
            {isLoading
              ? t('common.loading')
              : `${t('nav.import')} ${parsedData.questions?.length ?? 0} ${t('exam.questions_count').split('{{count}}')[0].trim()}`}
          </button>
        )}

        <ImportResultPanel
          result={result}
          certCode={parsedData?.certification_code}
          domainName={parsedData?.domain_name}
        />

        {result && !result.errors?.length && (
          <button
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '13px',
              color: '#2997ff',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
            onClick={handleReset}
          >
            {t('admin.import.import_another')}
          </button>
        )}
      </div>
    </div>
  )
}
