'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Sparkline } from '@/components/ui/sparkline'
import type { ExecutiveMetrics, KPIVariation, WeeklyTrend } from '@/types'
import { formatCurrency, formatNumber, formatRoas, getVariation } from '@/lib/metrics'

interface HeroSectionProps {
  current: ExecutiveMetrics
  previous: ExecutiveMetrics | null
  trend: WeeklyTrend[]
}

function HeroKPI({
  label,
  value,
  variation,
  trend,
  isCurrency = false,
  isRoas = false,
}: {
  label: string
  value: number
  variation: KPIVariation | null
  trend: number[]
  isCurrency?: boolean
  isRoas?: boolean
}) {
  const pct = variation?.variation ?? 0
  const isNeutral = Math.abs(pct) < 0.5
  const isPositive = pct >= 0
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const color = isNeutral ? '#94a3b8' : isPositive ? '#34d399' : '#f87171'

  const displayValue = isCurrency
    ? formatCurrency(value)
    : isRoas
      ? formatRoas(value)
      : formatNumber(value)

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2 truncate">{label}</p>
        <p className="text-lg xl:text-2xl font-black text-white leading-none tracking-tight break-words min-w-0">{displayValue}</p>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div
          className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
          style={{ backgroundColor: `${color}38`, color, backdropFilter: 'blur(4px)' }}
        >
          <Icon className="w-3 h-3" />
          <span>{isNeutral ? 'Estável' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}</span>
        </div>
        <Sparkline data={trend} positive={isPositive} width={52} height={22} />
      </div>
    </div>
  )
}

export default function HeroSection({ current, previous, trend }: HeroSectionProps) {
  const v = (cur: number, pre: number | undefined) =>
    pre !== undefined && previous ? getVariation(cur, pre) : null

  const receitaTrend   = trend.map(t => t.receita)
  const pedidosTrend   = trend.map(t => t.pedidos)
  const roasTrend      = trend.map(t => t.roas)
  const investTrend    = trend.map(t => t.investimento)
  const wppTrend       = trend.map(t => t.conversoes)

  const kpis = [
    {
      label: 'Receita Total',
      value: current.receitaTotal,
      variation: v(current.receitaTotal, previous?.receitaTotal),
      trend: receitaTrend,
      isCurrency: true,
    },
    {
      label: 'Pedidos',
      value: current.pedidos,
      variation: v(current.pedidos, previous?.pedidos),
      trend: pedidosTrend,
    },
    {
      label: 'ROAS Geral',
      value: current.roasGeral,
      variation: v(current.roasGeral, previous?.roasGeral),
      trend: roasTrend,
      isRoas: true,
    },
    {
      label: 'Investimento Total',
      value: current.investimentoTotal,
      variation: v(current.investimentoTotal, previous?.investimentoTotal),
      trend: investTrend,
      isCurrency: true,
    },
    {
      label: 'Ticket Médio',
      value: current.ticketMedio,
      variation: v(current.ticketMedio, previous?.ticketMedio),
      trend: receitaTrend,
      isCurrency: true,
    },
    {
      label: 'Leads WhatsApp',
      value: current.leadsWhatsapp,
      variation: v(current.leadsWhatsapp, previous?.leadsWhatsapp),
      trend: wppTrend,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #012d17 0%, #014a26 28%, #016233 62%, #017a3f 100%)',
        boxShadow: '0 8px 32px rgba(1,98,51,0.45), 0 2px 8px rgba(1,98,51,0.25)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-white/20">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="p-4 xl:p-5 flex flex-col min-w-0">
            <HeroKPI
              label={kpi.label}
              value={kpi.value}
              variation={kpi.variation}
              trend={kpi.trend}
              isCurrency={kpi.isCurrency}
              isRoas={kpi.isRoas}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
