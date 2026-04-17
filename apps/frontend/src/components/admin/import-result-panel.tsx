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
      <div
        style={{
          marginTop: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(224,69,60,0.4)',
          background: 'rgba(224,69,60,0.1)',
          padding: '16px',
        }}
      >
        <h3
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '-0.12px',
            color: '#e0453c',
            marginBottom: '8px',
          }}
        >
          Nhập thất bại
        </h3>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          {result.errors.map((err, i) => (
            <li key={i} style={{ fontSize: '13px', color: '#e0453c', marginBottom: '4px' }}>{err}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: '16px',
        borderRadius: '8px',
        border: '1px solid rgba(29,155,94,0.4)',
        background: 'rgba(29,155,94,0.1)',
        padding: '16px',
      }}
    >
      <h3
        style={{
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '-0.12px',
          color: '#1d9b5e',
          marginBottom: '6px',
        }}
      >
        Nhập thành công
      </h3>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.224px' }}>
        Đã nhập <strong>{result.imported}</strong> câu hỏi
        {certCode && <> vào <strong>{certCode}</strong></>}
        {domainName && <> / <strong>{domainName}</strong></>}
      </p>
    </div>
  )
}
