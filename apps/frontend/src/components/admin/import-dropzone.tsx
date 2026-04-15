import { useState, useRef } from 'react'
import type { ImportPayload } from '@/services/admin-api'

interface Props {
  onFileLoaded: (data: ImportPayload, fileName: string) => void
  isLoading: boolean
}

function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
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
      style={{
        border: isDragging ? '2px dashed #0071e3' : '2px dashed rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragging ? 'rgba(0,113,227,0.08)' : 'rgba(255,255,255,0.04)',
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? 'none' : 'auto',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <UploadIcon />
        {fileName ? (
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1d9b5e' }}>{fileName}</p>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.224px' }}>Drop a .json file here, or click to browse</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.12px' }}>Accepts question import JSON format</p>
          </>
        )}
      </div>

      {parseError && (
        <p style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, color: '#e0453c' }}>{parseError}</p>
      )}
    </div>
  )
}
