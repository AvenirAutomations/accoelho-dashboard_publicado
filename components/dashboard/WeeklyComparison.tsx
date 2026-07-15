'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { WeeklyComparisonRow } from '@/types'
import { formatCurrency, formatNumber, formatCompact } from '@/lib/metrics'

interface WeeklyComparisonProps {
  rows: WeeklyComparisonRow[]
  highlightSemana?: string
}

function Var({ value, lowerIsBetter = false }: { value?: number; lowerIsBetter?: boolean }) {
  if (value === undefined) return <span className="text-slate-300">—</span>
  const abs = Math.abs(value)
  if (abs < 0.5) return <Minus className="w-3 h-3 text-slate-400 inline" />
  const isGood = lowerIsBetter ? value < 0 : value > 0
  const color = isGood ? 'text-emerald-600' : 'text-red-500'
  const Icon = value > 0 ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export default function WeeklyComparison({ rows, highlightSemana }: WeeklyComparisonProps) {
  if (rows.length === 0) return null

  const sorted = [...rows].reverse()

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="px-5 pt-4 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Comparativo Diário</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Dia a dia — mês atual</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 whitespace-nowrap">Dia</th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Receita</th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Pedidos</th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Ticket Médio</th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Investimento</th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500">ROAS</th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Sessões</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map(row => {
              const isHighlight = row.semana === highlightSemana
              return (
                <tr
                  key={row.semana}
                  className={`transition-colors ${isHighlight ? 'bg-[#f0f7f2]' : 'hover:bg-slate-50/60'}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-bold ${isHighlight ? 'text-[#016233]' : 'text-slate-700'}`}>
                      {row.semana}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-semibold text-slate-700">{formatCurrency(row.receita)}</div>
                    <Var value={row.varReceita} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-semibold text-slate-700">{formatNumber(row.pedidos)}</div>
                    <Var value={row.varPedidos} />
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">{formatCurrency(row.ticketMedio)}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-semibold text-slate-700">{formatCurrency(row.investimento)}</div>
                    <Var value={row.varInvestimento} lowerIsBetter />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-semibold text-slate-700">{row.roas.toFixed(1)}x</div>
                    <Var value={row.varRoas} />
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">{formatCompact(row.sessoes)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
