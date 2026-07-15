import type { PeriodFilter } from '@/types'

type AnyRow = { data: string; semana: string }

// ─── ISO week helpers (still used by sheet parsers) ───────────────────────────

export function parseSemana(semana: string): { week: number; year: number } | null {
  const m = semana.match(/^S(\d+)\/(\d{4})$/)
  if (!m) return null
  return { week: parseInt(m[1]), year: parseInt(m[2]) }
}

export function dateToSemana(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return `S?/${new Date().getFullYear()}`
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = date.getUTCDay() || 7
  const thursday = new Date(date)
  thursday.setUTCDate(date.getUTCDate() + 4 - dow)
  const isoYear = thursday.getUTCFullYear()
  const jan4 = new Date(Date.UTC(isoYear, 0, 4))
  const dow4 = jan4.getUTCDay() || 7
  const mondayW1 = new Date(jan4)
  mondayW1.setUTCDate(jan4.getUTCDate() - dow4 + 1)
  const weekNum = Math.floor((thursday.getTime() - mondayW1.getTime()) / (7 * 86400000)) + 1
  return `S${weekNum}/${isoYear}`
}

export function getCurrentSemana(): string {
  return dateToSemana(new Date().toISOString().split('T')[0])
}

// ─── Date utils ───────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function shiftDays(base: Date, delta: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

export function fmtDate(isoStr: string): string {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-')
  return `${d}/${m}/${y}`
}

// ─── Period label ─────────────────────────────────────────────────────────────

export function getPeriodLabel(period: PeriodFilter): string {
  if (period.mode === 'today') return 'Hoje'
  if (period.mode === 'yesterday') return 'Ontem'
  if (period.mode === 'last7') return 'Últimos 7 dias'
  if (period.mode === 'this_month') {
    const now = new Date()
    const month = now.toLocaleString('pt-BR', { month: 'long' })
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${now.getFullYear()}`
  }
  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    return `${fmtDate(period.dateFrom)} a ${fmtDate(period.dateTo)}`
  }
  return 'Selecionar período'
}

// ─── Period filter ────────────────────────────────────────────────────────────

export function filterRowsByPeriod<T extends AnyRow>(rows: T[], period: PeriodFilter): T[] {
  const today = new Date()
  const todayStr = todayISO()

  if (period.mode === 'today') {
    return rows.filter(r => r.data === todayStr)
  }
  if (period.mode === 'yesterday') {
    const yest = shiftDays(today, -1)
    return rows.filter(r => r.data === yest)
  }
  if (period.mode === 'last7') {
    const from = shiftDays(today, -6)
    return rows.filter(r => r.data >= from && r.data <= todayStr)
  }
  if (period.mode === 'this_month') {
    const now = new Date()
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    return rows.filter(r => r.data >= from && r.data <= todayStr)
  }
  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    return rows.filter(r => r.data >= period.dateFrom! && r.data <= period.dateTo!)
  }
  return rows
}

// ─── Previous period (for WoW / MoM comparison) ──────────────────────────────

export function getPrevPeriod(period: PeriodFilter): PeriodFilter | null {
  const today = new Date()

  if (period.mode === 'today') {
    const yest = shiftDays(today, -1)
    return { mode: 'custom', dateFrom: yest, dateTo: yest }
  }
  if (period.mode === 'yesterday') {
    const d = shiftDays(today, -2)
    return { mode: 'custom', dateFrom: d, dateTo: d }
  }
  if (period.mode === 'last7') {
    const to = shiftDays(today, -7)
    const from = shiftDays(new Date(to), -6)
    return { mode: 'custom', dateFrom: from, dateTo: to }
  }
  if (period.mode === 'this_month') {
    const now = new Date()
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return {
      mode: 'custom',
      dateFrom: prevStart.toISOString().split('T')[0],
      dateTo: prevEnd.toISOString().split('T')[0],
    }
  }
  if (period.mode === 'custom' && period.dateFrom && period.dateTo) {
    const from = new Date(period.dateFrom)
    const to = new Date(period.dateTo)
    const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1
    const prevTo = new Date(from); prevTo.setDate(from.getDate() - 1)
    const prevFrom = new Date(prevTo); prevFrom.setDate(prevTo.getDate() - days + 1)
    return {
      mode: 'custom',
      dateFrom: prevFrom.toISOString().split('T')[0],
      dateTo: prevTo.toISOString().split('T')[0],
    }
  }
  return null
}

// ─── Week display helpers (used by metrics.ts / WeeklyComparison) ────────────

function getISOWeekDates(week: number, year: number): { from: Date; to: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dow = jan4.getUTCDay() || 7
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

export function getSemanaDateRange(semana: string): string {
  const p = parseSemana(semana)
  if (!p) return ''
  const { from, to } = getISOWeekDates(p.week, p.year)
  return `${fmt2(from)} – ${fmt2(to)}`
}

// ─── Semana list (still used by WeeklyComparison) ────────────────────────────

export function getAllSemanas(rows: { semana: string }[]): string[] {
  return [...new Set(rows.map((r) => r.semana))].sort((a, b) => {
    const pa = parseSemana(a), pb = parseSemana(b)
    if (!pa || !pb) return a.localeCompare(b)
    return pa.year !== pb.year ? pa.year - pb.year : pa.week - pb.week
  })
}
