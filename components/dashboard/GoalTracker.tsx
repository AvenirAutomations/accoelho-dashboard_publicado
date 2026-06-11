'use client'

import { motion } from 'framer-motion'
import type { ExecutiveMetrics } from '@/types'
import { formatCurrency, formatNumber, formatRoas } from '@/lib/metrics'
import { METAS } from '@/lib/goals'

interface GoalTrackerProps {
  current: ExecutiveMetrics
}

export default function GoalTracker({ current }: GoalTrackerProps) {
  const goals = [
    {
      label: 'Receita Semanal',
      current: current.receitaTotal,
      target: METAS.receita,
      format: (v: number) => formatCurrency(v),
      color: '#016233',
    },
    {
      label: 'Pedidos',
      current: current.pedidos,
      target: METAS.pedidos,
      format: (v: number) => formatNumber(v),
      color: '#f37021',
    },
    {
      label: 'ROAS Geral',
      current: current.roasGeral,
      target: METAS.roas,
      format: (v: number) => formatRoas(v),
      color: '#6366f1',
    },
  ]

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="text-sm font-bold text-slate-800 mb-1">Metas da Semana</h3>
      <p className="text-[11px] text-slate-400 mb-4">AC Coelho E-commerce</p>

      <div className="space-y-4">
        {goals.map((goal, i) => {
          const pct = Math.min(150, goal.target > 0 ? (goal.current / goal.target) * 100 : 0)
          const achieved = pct >= 100
          const barColor = achieved ? '#016233' : goal.color

          return (
            <div key={goal.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">{goal.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Meta: {goal.format(goal.target)}</span>
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: achieved ? '#ecfdf5' : '#fffbeb',
                      color: achieved ? '#016233' : '#b45309',
                    }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct)}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-slate-800">{goal.format(goal.current)}</span>
                {achieved ? (
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Meta atingida</span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Faltam {goal.format(Math.max(0, goal.target - goal.current))}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
