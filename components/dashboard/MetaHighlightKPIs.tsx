'use client'

import { motion } from 'framer-motion'
import { MessageSquare, TrendingUp, TrendingDown, Minus, Wallet } from 'lucide-react'
import type { KPIVariation } from '@/types'
import { formatNumber, formatCurrency } from '@/lib/metrics'

interface MetaHighlightKPIsProps {
  conversasIniciadas: number
  custoPorConversa: number
  variationConversas?: KPIVariation | null
  variationCusto?: KPIVariation | null
}

function HighlightCard({
  label,
  value,
  icon,
  variation,
  lowerIsBetter,
  gradient,
  shadow,
}: {
  label: string
  value: string
  icon: React.ReactNode
  variation?: KPIVariation | null
  lowerIsBetter: boolean
  gradient: string
  shadow: string
}) {
  const pct = variation?.variation ?? 0
  const hasVariation = variation !== null && variation !== undefined
  const isNeutral = Math.abs(pct) < 0.5
  const isPositive = lowerIsBetter ? pct < 0 : pct > 0
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const badgeColor = isNeutral ? '#e2e8f0' : isPositive ? '#34d399' : '#f87171'

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between min-h-[136px]"
      style={{ background: gradient, boxShadow: shadow }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-white/80 uppercase tracking-widest">{label}</p>
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <span className="text-white [&>*]:w-4.5 [&>*]:h-4.5">{icon}</span>
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-3 mt-3">
        <p className="text-4xl font-black text-white leading-none tracking-tight">{value}</p>
        {hasVariation && (
          <div
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mb-1"
            style={{ backgroundColor: `${badgeColor}30`, color: badgeColor }}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{isNeutral ? 'Estável' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function MetaHighlightKPIs({
  conversasIniciadas,
  custoPorConversa,
  variationConversas,
  variationCusto,
}: MetaHighlightKPIsProps) {
  const custoDisplay = conversasIniciadas > 0 ? formatCurrency(custoPorConversa) : '—'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <HighlightCard
        label="Conversas Iniciadas"
        value={formatNumber(conversasIniciadas)}
        icon={<MessageSquare />}
        variation={variationConversas}
        lowerIsBetter={false}
        gradient="linear-gradient(135deg, #012d17 0%, #014a26 28%, #016233 62%, #017a3f 100%)"
        shadow="0 8px 32px rgba(1,98,51,0.35), 0 2px 8px rgba(1,98,51,0.2)"
      />
      <HighlightCard
        label="Custo por Conversa"
        value={custoDisplay}
        icon={<Wallet />}
        variation={variationCusto}
        lowerIsBetter
        gradient="linear-gradient(135deg, #7a3408 0%, #a8470d 28%, #d35f0f 62%, #f37021 100%)"
        shadow="0 8px 32px rgba(243,112,33,0.35), 0 2px 8px rgba(243,112,33,0.2)"
      />
    </div>
  )
}
