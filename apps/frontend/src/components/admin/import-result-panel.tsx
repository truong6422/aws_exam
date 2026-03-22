import type { ImportResult } from '@/services/admin-api'

interface Props {
  result: ImportResult | null
  certCode?: string
  domainName?: string
}

export function ImportResultPanel({ result, certCode, domainName }: Props) {
  if (!result) return null

  const hasErrors = result.errors && result.errors.length > 0

  if (hasErrors) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <h3 className="font-semibold text-red-800 mb-2">Import Failed</h3>
        <ul className="list-disc list-inside space-y-1">
          {result.errors.map((err, i) => (
            <li key={i} className="text-sm text-red-700">{err}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <h3 className="font-semibold text-green-800">✓ Import Successful</h3>
      <p className="mt-1 text-sm text-green-700">
        Imported <strong>{result.imported}</strong> question{result.imported !== 1 ? 's' : ''}
        {certCode && <> to <strong>{certCode}</strong></>}
        {domainName && <> / <strong>{domainName}</strong></>}
      </p>
    </div>
  )
}
