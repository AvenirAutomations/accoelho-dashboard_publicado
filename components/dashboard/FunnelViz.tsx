'use client'

import { motion } from 'framer-motion'
import type { GA4Metrics } from '@/types'
import { formatCompact, formatPercent } from '@/lib/metrics'

interface FunnelVizProps {
  ga4: GA4Metrics
  vtexPedidos?: number
}

interface FStep {
  key: string
  label: string
  value: number
  color: string
  sublabel?: string
}

export default function FunnelViz({ ga4, vtexPedidos }: FunnelVizProps) {
  const steps: FStep[] = [
    {
      key: 'sessoes',
      label: 'Sessões',
      value: ga4.sessoes,
      color: '#6366f1',
      sublabel: 'Visitantes no site',
    },
    {
      key: 'add',
      label: 'Adicionaram ao Carrinho',
      value: ga4.addToCart,
      color: '#f37021',
      sublabel: `${ga4.taxaAddToCart.toFixed(1)}% das sessões`,
    },
    {
      key: 'checkout',
      label: 'Iniciaram Checkout',
      value: ga4.checkout,
      color: '#d97706',
      sublabel: `${ga4.taxaCheckout.toFixed(1)}% do carrinho`,
    },
    {
      key: 'conv',
      label: 'Compras (GA4)',
      value: ga4.conversao,
      color: '#016233',
      sublabel: `${ga4.taxaConversao.toFixed(2)}% das sessões`,
    },
    ...(vtexPedidos !== undefined ? [{
      key: 'vtex',
      label: 'Pedidos Confirmados (VTEX)',
      value: vtexPedidos,
      color: '#059669',
      sublabel: 'Receita capturada',
    }] : []),
  ]

  const maxVal = steps[0]?.value || 1

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#f37021,#016233)' }} />
        <h3 className="text-sm font-bold text-slate-800">Funil E-commerce</h3>
        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full ml-auto">
          GA4 + VTEX
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const widthPct = (step.value / maxVal) * 100
          const dropRate = i > 0 && steps[i - 1].value > 0
            ? (step.value / steps[i - 1].value) * 100
            : null
          const isLow = dropRate !== null && dropRate < 20

          return (
            <div key={step.key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-semibold text-slate-700">{step.label}</span>
                  {step.sublabel && (
                    <span className="text-[10px] text-slate-400 ml-2">{step.sublabel}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {dropRate !== null && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isLow ? '#fee2e2' : '#ecfdf5',
                        color: isLow ? '#dc2626' : '#059669',
                      }}
                    >
                      {formatPercent(dropRate, 1)}
                    </span>
                  )}
                  <span className="text-xs font-black text-slate-800 tabular-nums w-16 text-right">
                    {formatCompact(step.value)}
                  </span>
                </div>
              </div>
              <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                <motion.div
                  className="h-full rounded-lg"
                  style={{ backgroundColor: step.color, opacity: 0.88 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.65, delay: i * 0.09, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary row */}
      <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-slate-400">Add to Cart</p>
          <p className="text-sm font-bold text-slate-700">{formatPercent(ga4.taxaAddToCart, 1)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400">Checkout Rate</p>
          <p className="text-sm font-bold text-slate-700">{formatPercent(ga4.taxaCheckout, 1)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400">Conv. Rate</p>
          <p className="text-sm font-bold text-slate-700">{formatPercent(ga4.taxaConversao, 2)}</p>
        </div>
      </div>
    </div>
  )
}
