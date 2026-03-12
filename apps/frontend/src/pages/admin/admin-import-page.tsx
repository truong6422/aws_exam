import PageHeader from '@/components/ui/page-header'

export default function AdminImportPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Import Questions" subtitle="Upload a JSON or CSV file to bulk-import questions" />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Drop zone */}
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-400 hover:border-brand-400">
          <span className="text-3xl">📥</span>
          <p className="mt-2">Drag & drop a file, or click to browse</p>
          <p className="mt-1 text-xs text-gray-300">.json or .csv — max 10 MB</p>
        </div>

        <button
          disabled
          className="mt-4 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white opacity-50"
        >
          Upload & Import (Phase 2)
        </button>
      </div>
    </div>
  )
}
