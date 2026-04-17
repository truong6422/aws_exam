import { useState } from 'react'
import PageHeader from '@/components/ui/page-header'
import { ImportDropzone } from '@/components/admin/import-dropzone'
import { ImportResultPanel } from '@/components/admin/import-result-panel'
import { adminApi } from '@/services/admin-api'
import type { ImportPayload, ImportResult } from '@/services/admin-api'

export default function AdminImportPage() {
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
    <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Nhập câu hỏi"
        subtitle="Tải lên tệp JSON để nhập hàng loạt câu hỏi vào lĩnh vực chứng chỉ"
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
              Xem trước
            </p>
            <p>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Chứng chỉ: </span>
              <strong style={{ color: '#fff' }}>{parsedData.certification_code}</strong>
            </p>
            <p>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Lĩnh vực: </span>
              <strong style={{ color: '#fff' }}>{parsedData.domain_name}</strong>
            </p>
            <p>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Câu hỏi: </span>
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
              ? 'Đang nhập...'
              : `Nhập ${parsedData.questions?.length ?? 0} câu hỏi`}
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
            Nhập tệp khác
          </button>
        )}
      </div>
    </div>
  )
}
