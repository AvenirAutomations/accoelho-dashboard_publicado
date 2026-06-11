'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isWithinInterval, isSameDay, isToday, parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PeriodFilter, PeriodMode } from '@/types'
import { getSemanaDateRange } from '@/lib/period'

interface PeriodSelectorProps {
  period: PeriodFilter
  semanas: string[]
  onChange: (period: PeriodFilter) => void
}

const MODE_LABELS: Record<PeriodMode, string> = {
  closed_week: 'Semana fechada',
  last7: 'Últimos 7 dias',
  last30: 'Últimos 30 dias',
  custom: 'Período personalizado',
}

// ─── Click-outside hook ───────────────────────────────────────────────────────
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return { open, setOpen, ref }
}

// ─── Period mode button ───────────────────────────────────────────────────────
function ModeButton({ mode, onChange }: { mode: PeriodMode; onChange: (m: PeriodMode) => void }) {
  const { open, setOpen, ref } = useDropdown()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors select-none"
      >
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-700">{MODE_LABELS[mode]}</span>
        <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-[60] bg-white rounded-xl border border-slate-200 shadow-lg py-1 min-w-[200px]">
          {(Object.entries(MODE_LABELS) as [PeriodMode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => { onChange(m); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50',
                mode === m ? 'font-bold text-[#0a2540]' : 'text-slate-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Calendar panel ───────────────────────────────────────────────────────────
interface CalendarPanelProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  onClose: () => void
}

function CalendarPanel({ from, to, onChange, onClose }: CalendarPanelProps) {
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(from ? parseISO(from) : new Date()),
  )
  const [picking, setPicking] = useState<{ from: Date | null; to: Date | null }>({
    from: from ? parseISO(from) : null,
    to: to ? parseISO(to) : null,
  })
  const [hovered, setHovered] = useState<Date | null>(null)

  const f = picking.from
  const t = picking.to

  const days = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  })
  const startPad = (getDay(startOfMonth(viewMonth)) + 6) % 7 // Monday-first

  function handleDay(day: Date) {
    if (!f || (f && t)) {
      setPicking({ from: day, to: null })
    } else {
      const [s, e] = day < f ? [day, f] : [f, day]
      setPicking({ from: s, to: e })
      onChange(format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd'))
      onClose()
    }
  }

  function isInRange(day: Date) {
    if (!f) return false
    const rangeEnd = t ?? hovered
    if (!rangeEnd) return false
    const [s, e] = f <= rangeEnd ? [f, rangeEnd] : [rangeEnd, f]
    return isWithinInterval(day, { start: s, end: e })
  }

  return (
    <div className="p-3.5 w-[272px]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <span className="text-[11px] font-bold text-slate-700 capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="text-[9px] font-semibold text-slate-400 text-center py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={i} />
        ))}
        {days.map((day) => {
          const isStart = !!(f && isSameDay(day, f))
          const isEnd = !!(t && isSameDay(day, t))
          const inRange = isInRange(day)
          const isSelected = isStart || isEnd
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDay(day)}
              onMouseEnter={() => { if (f && !t) setHovered(day) }}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'h-7 text-[11px] font-medium rounded-md transition-all',
                isSelected && 'bg-[#0a2540] text-white font-bold',
                inRange && !isSelected && 'bg-slate-100 text-[#0a2540]',
                !isSelected && !inRange && 'hover:bg-slate-100 text-slate-700',
                isToday(day) && !isSelected && 'ring-1 ring-[#c9933a]/60 font-semibold',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Selection feedback */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 min-h-[24px] text-center">
        {f && !t && (
          <p className="text-[10px] text-slate-500">
            <span className="font-bold text-slate-700">{format(f, 'dd/MM/yyyy')}</span>
            <span className="mx-1">→</span>
            <span>selecione o fim</span>
          </p>
        )}
        {f && t && (
          <p className="text-[10px] text-slate-600 font-medium">
            {format(f, 'dd/MM/yyyy')} → {format(t, 'dd/MM/yyyy')}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Custom range trigger ─────────────────────────────────────────────────────
function CustomRangeTrigger({ from, to, onChange }: {
  from: string; to: string; onChange: (f: string, t: string) => void
}) {
  const { open, setOpen, ref } = useDropdown()

  const fromDate = from ? parseISO(from) : null
  const toDate = to ? parseISO(to) : null
  const label = fromDate && toDate
    ? `${format(fromDate, 'dd/MM')} → ${format(toDate, 'dd/MM/yyyy')}`
    : fromDate
    ? `${format(fromDate, 'dd/MM/yyyy')} → …`
    : 'Selecionar período'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg border border-[#c9933a]/40 bg-[#FFF8EC] text-[#92510d] hover:bg-[#FFF3DA] transition-colors select-none"
      >
        <span>{label}</span>
        <ChevronDown className={cn('w-3 h-3 text-[#c9933a] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-[60] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <CalendarPanel
            from={from}
            to={to}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PeriodSelector({ period, semanas, onChange }: PeriodSelectorProps) {
  const semanaOpts = [...semanas].reverse()

  function setMode(mode: PeriodMode) {
    if (mode === 'closed_week') {
      onChange({ mode, semana: semanaOpts[0] ?? '' })
    } else if (mode === 'custom') {
      const today = new Date().toISOString().split('T')[0]
      onChange({ mode, dateFrom: today, dateTo: today })
    } else {
      onChange({ mode })
    }
  }

  const selectedSemana = period.semana ?? semanaOpts[0] ?? ''
  const semanaRange = getSemanaDateRange(selectedSemana)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ModeButton mode={period.mode} onChange={setMode} />

      {/* Week selector — only for closed_week */}
      {period.mode === 'closed_week' && semanaOpts.length > 0 && (
        <Select
          value={selectedSemana}
          onValueChange={(v) => v && onChange({ ...period, semana: v })}
        >
          <SelectTrigger className="h-8 text-xs min-w-[180px] border-[#c9933a]/40 bg-[#FFF8EC] text-[#92510d] font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span>{selectedSemana}</span>
              {semanaRange && (
                <span className="font-normal text-[10px] text-[#c9933a]/70">· {semanaRange}</span>
              )}
            </span>
          </SelectTrigger>
          <SelectContent>
            {semanaOpts.map((s) => {
              const range = getSemanaDateRange(s)
              return (
                <SelectItem key={s} value={s} className="text-xs">
                  <span className="font-semibold">{s}</span>
                  {range && <span className="ml-2 text-slate-400">{range}</span>}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )}

      {/* Calendar date range picker — only for custom */}
      {period.mode === 'custom' && (
        <CustomRangeTrigger
          from={period.dateFrom ?? ''}
          to={period.dateTo ?? ''}
          onChange={(dateFrom, dateTo) => onChange({ ...period, dateFrom, dateTo })}
        />
      )}
    </div>
  )
}
