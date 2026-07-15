'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isWithinInterval, isSameDay, isToday, parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { PeriodFilter, PeriodMode } from '@/types'
import { getPeriodLabel } from '@/lib/period'

interface PeriodSelectorProps {
  period: PeriodFilter
  onChange: (period: PeriodFilter) => void
}

const MODES: { mode: PeriodMode; label: string }[] = [
  { mode: 'today',      label: 'Hoje' },
  { mode: 'yesterday',  label: 'Ontem' },
  { mode: 'last7',      label: 'Últimos 7 dias' },
  { mode: 'this_month', label: 'Este mês' },
  { mode: 'custom',     label: 'Personalizado' },
]

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

// ─── Calendar panel ───────────────────────────────────────────────────────────
function CalendarPanel({ from, to, onChange, onClose }: {
  from: string; to: string
  onChange: (from: string, to: string) => void
  onClose: () => void
}) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(from ? parseISO(from) : new Date()))
  const [picking, setPicking] = useState<{ from: Date | null; to: Date | null }>({
    from: from ? parseISO(from) : null,
    to: to ? parseISO(to) : null,
  })
  const [hovered, setHovered] = useState<Date | null>(null)

  const f = picking.from
  const t = picking.to
  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const startPad = (getDay(startOfMonth(viewMonth)) + 6) % 7

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
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <span className="text-[11px] font-bold text-slate-700 capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-[9px] font-semibold text-slate-400 text-center py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={i} />)}
        {days.map(day => {
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  const { open, setOpen, ref } = useDropdown()
  const [showCalendar, setShowCalendar] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCalendar) return
    function handle(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showCalendar])

  function selectMode(mode: PeriodMode) {
    setOpen(false)
    if (mode === 'custom') {
      const today = new Date().toISOString().split('T')[0]
      onChange({ mode, dateFrom: today, dateTo: today })
      setShowCalendar(true)
    } else {
      onChange({ mode })
      setShowCalendar(false)
    }
  }

  const label = period.mode === 'custom' && period.dateFrom && period.dateTo
    ? getPeriodLabel(period)
    : MODES.find(m => m.mode === period.mode)?.label ?? 'Período'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Mode dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors select-none"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-700">{label}</span>
          <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 z-[60] bg-white rounded-xl border border-slate-200 shadow-lg py-1 min-w-[180px]">
            {MODES.map(({ mode, label: lbl }) => (
              <button
                key={mode}
                onClick={() => selectMode(mode)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50',
                  period.mode === mode ? 'font-bold text-[#0a2540]' : 'text-slate-600',
                )}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Calendar — only for custom */}
      {period.mode === 'custom' && (
        <div ref={calRef} className="relative">
          <button
            onClick={() => setShowCalendar(o => !o)}
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg border border-[#c9933a]/40 bg-[#FFF8EC] text-[#92510d] hover:bg-[#FFF3DA] transition-colors select-none"
          >
            <span>
              {period.dateFrom && period.dateTo
                ? `${period.dateFrom.split('-').reverse().join('/')} → ${period.dateTo.split('-').reverse().join('/')}`
                : 'Selecionar datas'}
            </span>
            <ChevronDown className={cn('w-3 h-3 text-[#c9933a] transition-transform', showCalendar && 'rotate-180')} />
          </button>

          {showCalendar && (
            <div className="absolute top-full left-0 mt-1 z-[60] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              <CalendarPanel
                from={period.dateFrom ?? ''}
                to={period.dateTo ?? ''}
                onChange={(dateFrom, dateTo) => { onChange({ mode: 'custom', dateFrom, dateTo }); setShowCalendar(false) }}
                onClose={() => setShowCalendar(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
