import { useState, useRef } from 'react'
import type { ImportPayload } from '@/services/admin-api'

interface Props {
  onFileLoaded: (data: ImportPayload, fileName: string) => void
  isLoading: boolean
}

export function ImportDropzone({ onFileLoaded, isLoading }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setParseError('Only .json files are accepted')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Record<string, unknown>
        if (
          typeof data.certification_code !== 'string' ||
          typeof data.domain_name !== 'string' ||
          !Array.isArray(data.questions)
        ) {
          setParseError('JSON must have certification_code, domain_name, and questions array')
          return
        }
        setParseError('')
        setFileName(file.name)
        onFileLoaded(data as unknown as ImportPayload, file.name)
      } catch {
        setParseError('Invalid JSON format')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-brand-500 bg-brand-50'
          : 'border-gray-300 hover:border-gray-400 bg-white'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl">📥</span>
        {fileName ? (
          <p className="text-green-700 font-medium">✓ {fileName}</p>
        ) : (
          <>
            <p className="text-gray-500 text-sm">Drop a .json file here, or click to browse</p>
            <p className="text-xs text-gray-400">Accepts question import JSON format</p>
          </>
        )}
      </div>

      {parseError && (
        <p className="mt-3 text-red-600 text-sm font-medium">{parseError}</p>
      )}
    </div>
  )
}
