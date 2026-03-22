import { useEffect, useState } from 'react'
import { adminApi } from '@/services/admin-api'
import type { Certification, Domain } from '@/services/exam-api'

export interface QuestionFilters {
  certificationId: number | null
  domainId: number | null
  search: string
}

interface Props {
  onFilterChange: (filters: QuestionFilters) => void
}

export function QuestionFilters({ onFilterChange }: Props) {
  const [certs, setCerts] = useState<Certification[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [filters, setFilters] = useState<QuestionFilters>({
    certificationId: null,
    domainId: null,
    search: '',
  })

  useEffect(() => {
    adminApi.getCertifications().then(setCerts).catch(() => {})
  }, [])

  useEffect(() => {
    if (filters.certificationId) {
      adminApi.getDomains(filters.certificationId).then(setDomains).catch(() => setDomains([]))
    } else {
      setDomains([])
    }
  }, [filters.certificationId])

  const update = (patch: Partial<QuestionFilters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    onFilterChange(next)
  }

  const handleCertChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    update({
      certificationId: e.target.value ? Number(e.target.value) : null,
      domainId: null,
    })
  }

  const handleClear = () => {
    update({ certificationId: null, domainId: null, search: '' })
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={filters.certificationId ?? ''}
        onChange={handleCertChange}
      >
        <option value="">All Certifications</option>
        {certs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>

      <select
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
        value={filters.domainId ?? ''}
        onChange={(e) => update({ domainId: e.target.value ? Number(e.target.value) : null })}
        disabled={!filters.certificationId}
      >
        <option value="">All Domains</option>
        {domains.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Search certifications…"
        className="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
      />

      {(filters.certificationId || filters.domainId || filters.search) && (
        <button
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400"
          onClick={handleClear}
        >
          Clear
        </button>
      )}
    </div>
  )
}
