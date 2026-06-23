'use client'

import { motion } from 'framer-motion'
import { MessageCircle, CircleDollarSign, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import type { KPIVariation } from '@/types'
import { formatNumber, formatCurrency } from '@/lib/metrics'

interface MetaHighlightKPIsProps {
  conversasIniciadas: number
  custoPorConversa: number
  variationConversas?: KPIVariation | null
  variationCusto?: KPIVariation | null
}

interface HeroTheme {
  background: string
  borderColor: string
  shadow: string
  shadowHover: string
  iconBg: string
  valueColor: string
  labelColor: string
  glow: string
}

function HeroKPICard({
  label,
  subtitle,
  value,
  icon,
  variation,
  lowerIsBetter,
  theme,
}: {
  label: string
  subtitle: string
  value: string
  icon: React.ReactNode
  variation?: KPIVariation | null
  lowerIsBetter: boolean
  theme: HeroTheme
}) {
  const pct = variation?.variation ?? 0
  const hasVariation = variation !== null && variation !== undefined
  const isNeutral = Math.abs(pct) < 0.5
  const isPositive = lowerIsBetter ? pct < 0 : pct > 0
  const TrendIcon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight
  const trendColor = isNeutral ? '#94a3b8' : isPositive ? '#059669' : '#dc2626'
  const trendBg = isNeutral ? '#f1f5f9' : isPositive ? '#ecfdf5' : '#fef2f2'

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8 group"
      style={{ background: theme.background, border: `1px solid ${theme.borderColor}`, boxShadow: theme.shadow }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: theme.shadowHover }}
    >
      {/* decorative glow */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-[0.18] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.28]"
        style={{ background: theme.glow }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.labelColor }}>
            KPI Principal
          </p>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1">{label}</h3>
        </div>
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105"
          style={{ background: theme.iconBg }}
        >
          <span className="text-white [&>*]:w-6 [&>*]:h-6 sm:[&>*]:w-7 sm:[&>*]:h-7">{icon}</span>
        </div>
      </div>

      <p className="relative mt-5 sm:mt-6 text-4xl sm:text-5xl font-black leading-none tracking-tight" style={{ color: theme.valueColor }}>
        {value}
      </p>

      <p className="relative mt-2.5 text-xs sm:text-[13px] text-slate-400 leading-relaxed">{subtitle}</p>

      <div className="relative mt-5 flex items-center gap-2 flex-wrap">
        {hasVariation ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: trendBg, color: trendColor }}
          >
            <TrendIcon className="w-3.5 h-3.5" />
            {isNeutral ? 'Estável' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
            Sem comparação
          </span>
        )}
        <span className="text-[11px] text-slate-400">vs período anterior</span>
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
  const hasConversas = conversasIniciadas > 0 && Number.isFinite(custoPorConversa)
  const custoDisplay = hasConversas ? formatCurrency(custoPorConversa) : '—'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
      <HeroKPICard
        label="Conversas Iniciadas"
        subtitle="Total de conversas iniciadas pelo Meta Ads"
        value={formatNumber(conversasIniciadas)}
        icon={<MessageCircle />}
        variation={variationConversas}
        lowerIsBetter={false}
        theme={{
          background: 'linear-gradient(165deg, #ffffff 0%, #f3fdf7 55%, #e9f9ef 100%)',
          borderColor: '#d8f3e3',
          shadow: '0 1px 3px rgba(1,98,51,0.06), 0 16px 32px -8px rgba(1,98,51,0.12)',
          shadowHover: '0 4px 10px rgba(1,98,51,0.10), 0 22px 40px -8px rgba(1,98,51,0.18)',
          iconBg: 'linear-gradient(135deg, #016233 0%, #019a4f 100%)',
          valueColor: '#014a26',
          labelColor: '#017a3f',
          glow: '#22c55e',
        }}
      />
      <HeroKPICard
        label="Custo por Conversa"
        subtitle="Investimento médio por conversa iniciada"
        value={custoDisplay}
        icon={<CircleDollarSign />}
        variation={variationCusto}
        lowerIsBetter
        theme={{
          background: 'linear-gradient(165deg, #ffffff 0%, #fff7ee 55%, #ffefdd 100%)',
          borderColor: '#fde3c7',
          shadow: '0 1px 3px rgba(243,112,33,0.08), 0 16px 32px -8px rgba(243,112,33,0.14)',
          shadowHover: '0 4px 10px rgba(243,112,33,0.12), 0 22px 40px -8px rgba(243,112,33,0.20)',
          iconBg: 'linear-gradient(135deg, #f37021 0%, #fb923c 100%)',
          valueColor: '#b8480f',
          labelColor: '#d35f0f',
          glow: '#fb923c',
        }}
      />
    </div>
  )
}
