'use client'

import type { ExecutiveMetrics } from '@/types'
import { formatCurrency, formatNumber, formatRoas } from '@/lib/metrics'

interface GoalTrackerProps {
  current: ExecutiveMetrics
  periodLabel?: string
}

export default function GoalTracker({ current, periodLabel }: GoalTrackerProps) {
  const items = [
    {
      label: 'Receita Total',
      value: formatCurrency(current.receitaTotal),
      color: '#016233',
    },
    {
      label: 'Pedidos',
      value: formatNumber(current.pedidos),
      color: '#f37021',
    },
    {
      label: 'ROAS',
      value: formatRoas(current.roasGeral),
      color: '#6366f1',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(current.ticketMedio),
      color: '#0ea5e9',
    },
  ]

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="text-sm font-bold text-slate-800 mb-0.5">Cenário do Mês</h3>
      <p className="text-[11px] text-slate-400 mb-5">{periodLabel ?? 'AC Coelho E-commerce'}</p>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-medium text-slate-500">{item.label}</span>
            </div>
            <span className="text-sm font-black text-slate-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
