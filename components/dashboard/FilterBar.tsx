'use client'

import { Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CampaignRow, Filters } from '@/types'

interface FilterBarProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  data: CampaignRow[]
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort()
}

export default function FilterBar({ filters, onFilterChange, data }: FilterBarProps) {
  const canais    = ['Todos', ...unique(data.map(r => r.canal))]
  const campanhas = ['Todas', ...unique(data.map(r => r.campanha))]

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onFilterChange({ ...filters, [key]: value })
  }

  const hasFilters = canais.length > 2 || campanhas.length > 2
  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Filtros</span>
      </div>

      {canais.length > 2 && (
        <FilterSelect
          label="Canal"
          value={filters.canal}
          options={canais}
          onChange={v => update('canal', v)}
        />
      )}

      {campanhas.length > 2 && (
        <FilterSelect
          label="Campanha"
          value={filters.campanha}
          options={campanhas}
          onChange={v => update('campanha', v)}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{label}:</span>
      <Select value={value} onValueChange={v => v && onChange(v)}>
        <SelectTrigger className="h-8 text-xs min-w-[120px] border-slate-200 bg-slate-50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
