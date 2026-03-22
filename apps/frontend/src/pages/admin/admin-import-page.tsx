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
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Import Questions"
        subtitle="Upload a JSON file to bulk-import questions into a certification domain"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <ImportDropzone onFileLoaded={handleFileLoaded} isLoading={isLoading} />

        {parsedData && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-1">
            <p className="font-medium text-gray-700 mb-2">Preview</p>
            <p>
              <span className="text-gray-500">Certification: </span>
              <strong>{parsedData.certification_code}</strong>
            </p>
            <p>
              <span className="text-gray-500">Domain: </span>
              <strong>{parsedData.domain_name}</strong>
            </p>
            <p>
              <span className="text-gray-500">Questions: </span>
              <strong>{parsedData.questions?.length ?? 0}</strong>
            </p>
          </div>
        )}

        {parsedData && (
          <button
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            onClick={handleImport}
            disabled={isLoading}
          >
            {isLoading
              ? 'Importing…'
              : `Import ${parsedData.questions?.length ?? 0} Question${parsedData.questions?.length !== 1 ? 's' : ''}`}
          </button>
        )}

        <ImportResultPanel
          result={result}
          certCode={parsedData?.certification_code}
          domainName={parsedData?.domain_name}
        />

        {result && !result.errors?.length && (
          <button
            className="text-sm text-brand-600 hover:underline"
            onClick={handleReset}
          >
            Import another file
          </button>
        )}
      </div>
    </div>
  )
}
