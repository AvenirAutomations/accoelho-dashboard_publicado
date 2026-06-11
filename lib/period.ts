import type { PeriodFilter, CampaignRow } from '@/types'

type AnyRow = { data: string; semana: string }

export function parseSemana(semana: string): { week: number; year: number } | null {
  const m = semana.match(/^S(\d+)\/(\d{4})$/)
  if (!m) return null
  return { week: parseInt(m[1]), year: parseInt(m[2]) }
}

// Monday → Sunday of the given ISO week
export function getISOWeekDates(week: number, year: number): { from: Date; to: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dow = jan4.getUTCDay() || 7 // 1=Mon…7=Sun
  const mondayW1 = new Date(jan4)
  mondayW1.setUTCDate(jan4.getUTCDate() - dow + 1)

  const from = new Date(mondayW1)
  from.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7)
  const to = new Date(from)
  to.setUTCDate(from.getUTCDate() + 6)
  return { from, to }
}

function fmt2(d: Date) {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function fmt3(d: Date) {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
}

// "YYYY-MM-DD" → "DD/MM/YYYY"
export function fmtDate(isoStr: string): string {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateRange(from: Date, to: Date): string {
  return `${fmt2(from)} – ${fmt2(to)}`
}

export function getSemanaDateRange(semana: string): string {
  const p = parseSemana(semana)
  if (!p) return ''
  const { from, to } = getISOWeekDates(p.week, p.year)
  return formatDateRange(from, to)
}

// Full format: "04/05/2026 a 10/05/2026"
export function getSemanaFullRange(semana: string): string {
  const p = parseSemana(semana)
  if (!p) return ''
  const { from, to } = getISOWeekDates(p.week, p.year)
  return `${fmt3(from)} a ${fmt3(to)}`
}

// Returns the active ISO date bounds for any period mode
export function getPeriodActiveDates(period: PeriodFilter): { from: string; to: string } | null {
  if (period.mode === 'closed_week' && period.semana) {
    const p = parseSemana(period.semana)
    if (!p) return null
    const { from, to } = getISOWeekDates(p.week, p.year)
    const toISO = (d: Date) => d.toISOString().split('T')[0]
    return { from: toISO(from), to: toISO(to) }
  }
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  if (period.mode === 'last7') {
    const from = new Date(today); from.setDate(today.getDate() - 6)
    return { from: from.toISOString().split('T')[0], to: todayStr }
  }
  if (period.mode === 'last30') {
    const from = new Date(today); from.setDate(today.getDate() - 29)
    return { from: from.toISOString().split('T')[0], to: todayStr }
  }
  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    return { from: period.dateFrom, to: period.dateTo }
  }
  return null
}

export function getPeriodLabel(period: PeriodFilter): string {
  if (period.mode === 'closed_week' && period.semana) {
    const range = getSemanaFullRange(period.semana)
    return range ? `${period.semana} · ${range}` : period.semana
  }
  if (period.mode === 'last7') return 'Últimos 7 dias'
  if (period.mode === 'last30') return 'Últimos 30 dias'
  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    return `${fmtDate(period.dateFrom)} a ${fmtDate(period.dateTo)}`
  }
  return 'Selecionar período'
}

// Generic period filter — works on any row type with data + semana
export function filterRowsByPeriod<T extends AnyRow>(rows: T[], period: PeriodFilter): T[] {
  if (period.mode === 'closed_week') {
    if (!period.semana) return rows
    return rows.filter(r => r.semana === period.semana)
  }
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  if (period.mode === 'last7') {
    const from = new Date(today); from.setDate(today.getDate() - 6)
    const fromStr = from.toISOString().split('T')[0]
    return rows.filter(r => r.data >= fromStr && r.data <= todayStr)
  }
  if (period.mode === 'last30') {
    const from = new Date(today); from.setDate(today.getDate() - 29)
    const fromStr = from.toISOString().split('T')[0]
    return rows.filter(r => r.data >= fromStr && r.data <= todayStr)
  }
  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    return rows.filter(r => r.data >= period.dateFrom! && r.data <= period.dateTo!)
  }
  return rows
}

// String comparison works because dates are YYYY-MM-DD
export function filterByPeriod(rows: CampaignRow[], period: PeriodFilter): CampaignRow[] {
  if (period.mode === 'closed_week') {
    if (!period.semana) return rows
    return rows.filter((r) => r.semana === period.semana)
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  if (period.mode === 'last7') {
    const from = new Date(today)
    from.setDate(today.getDate() - 6)
    const fromStr = from.toISOString().split('T')[0]
    return rows.filter((r) => r.data >= fromStr && r.data <= todayStr)
  }

  if (period.mode === 'last30') {
    const from = new Date(today)
    from.setDate(today.getDate() - 29)
    const fromStr = from.toISOString().split('T')[0]
    return rows.filter((r) => r.data >= fromStr && r.data <= todayStr)
  }

  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    return rows.filter((r) => r.data >= period.dateFrom! && r.data <= period.dateTo!)
  }

  return rows
}

// Returns the comparison period (equivalent previous period)
export function getPrevPeriod(
  period: PeriodFilter,
  allSemanas: string[],
): PeriodFilter | null {
  if (period.mode === 'closed_week' && period.semana) {
    const idx = allSemanas.indexOf(period.semana)
    if (idx <= 0) return null
    return { mode: 'closed_week', semana: allSemanas[idx - 1] }
  }

  const today = new Date()

  if (period.mode === 'last7') {
    const to = new Date(today)
    to.setDate(today.getDate() - 7)
    const from = new Date(to)
    from.setDate(to.getDate() - 6)
    return {
      mode: 'custom',
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0],
    }
  }

  if (period.mode === 'last30') {
    const to = new Date(today)
    to.setDate(today.getDate() - 30)
    const from = new Date(to)
    from.setDate(to.getDate() - 29)
    return {
      mode: 'custom',
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0],
    }
  }

  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    const from = new Date(period.dateFrom)
    const to = new Date(period.dateTo)
    const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1
    const prevTo = new Date(from)
    prevTo.setDate(from.getDate() - 1)
    const prevFrom = new Date(prevTo)
    prevFrom.setDate(prevTo.getDate() - days + 1)
    return {
      mode: 'custom',
      dateFrom: prevFrom.toISOString().split('T')[0],
      dateTo: prevTo.toISOString().split('T')[0],
    }
  }

  return null
}

export function getAllSemanas(rows: CampaignRow[]): string[] {
  return [...new Set(rows.map((r) => r.semana))].sort((a, b) => {
    const pa = parseSemana(a), pb = parseSemana(b)
    if (!pa || !pb) return a.localeCompare(b)
    return pa.year !== pb.year ? pa.year - pb.year : pa.week - pb.week
  })
}

