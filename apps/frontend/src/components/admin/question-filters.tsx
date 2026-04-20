import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from '@/services/admin-api'
import type { Certification } from '@/services/exam-api'

export interface QuestionFilters {
  certificationId: number | null
  search: string
}

interface Props {
  onFilterChange: (filters: QuestionFilters) => void
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#fff',
  outline: 'none',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#fff',
  outline: 'none',
  flex: 1,
  minWidth: '192px',
}

export function QuestionFilters({ onFilterChange }: Props) {
  const { t } = useTranslation()
  const [certs, setCerts] = useState<Certification[]>([])
  const [filters, setFilters] = useState<QuestionFilters>({
    certificationId: null,
    search: '',
  })

  useEffect(() => {
    adminApi.getCertifications().then(setCerts).catch(() => { })
  }, [])

  const update = (patch: Partial<QuestionFilters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    onFilterChange(next)
  }

  const handleCertChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    update({
      certificationId: e.target.value ? Number(e.target.value) : null,
    })
  }

  const handleClear = () => {
    update({ certificationId: null, search: '' })
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
      <select
        style={selectStyle}
        value={filters.certificationId ?? ''}
        onChange={handleCertChange}
      >
        <option value="">{t('admin.filters.all_certifications')}</option>
        {certs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder={t('admin.filters.search_cert')}
        style={inputStyle}
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
      />

      {(filters.certificationId || filters.search) && (
        <button
          className="btn-ghost"
          onClick={handleClear}
        >
          {t('admin.filters.clear')}
        </button>
      )}
    </div>
  )
}
