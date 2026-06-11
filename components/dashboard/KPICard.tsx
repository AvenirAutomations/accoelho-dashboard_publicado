'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Sparkline } from '@/components/ui/sparkline'
import type { KPIVariation } from '@/types'

interface KPICardProps {
  title: string
  value: string
  variation?: KPIVariation | null
  lowerIsBetter?: boolean
  icon?: React.ReactNode
  sparklineData?: number[]
  index?: number
}

export default function KPICard({
  title,
  value,
  variation,
  lowerIsBetter = false,
  icon,
  sparklineData,
  index = 0,
}: KPICardProps) {
  const pct = variation?.variation ?? 0
  const hasVariation = variation !== null && variation !== undefined
  const isPositive = lowerIsBetter ? pct < 0 : pct > 0
  const isNeutral = Math.abs(pct) < 0.5

  const color = isNeutral ? '#9AA5B4' : isPositive ? '#059669' : '#DC2626'
  const bgColor = isNeutral ? '#F4F6F9' : isPositive ? '#ECFDF5' : '#FEF2F2'

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <motion.div
      className="card-premium p-4 flex flex-col gap-3 cursor-default group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">{title}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50 group-hover:bg-slate-100 transition-colors flex-shrink-0">
            <span className="[&>*]:w-3.5 [&>*]:h-3.5">{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</p>

      {/* Bottom row */}
      <div className="flex items-end justify-between gap-2">
        {hasVariation && (
          <div
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: bgColor, color }}
          >
            <Icon className="w-3 h-3" />
            <span>{isNeutral ? 'Estável' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}</span>
          </div>
        )}
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline data={sparklineData} positive={isPositive || isNeutral} width={56} height={22} />
        )}
      </div>
    </motion.div>
  )
}
