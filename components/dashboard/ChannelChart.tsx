'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChannelMetrics, CampaignRow } from '@/types'
import { formatCurrency, formatCompact, formatPercent, formatNumber } from '@/lib/metrics'

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
}

interface ChannelChartProps {
  channels: ChannelMetrics[]
  adRows: CampaignRow[]
}

function CampaignRanking({ adRows }: { adRows: CampaignRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const byCamp = new Map<string, { invest: number; cliques: number; impressoes: number; conversoes: number; receita: number }>()
  for (const r of adRows) {
    if (!byCamp.has(r.campanha)) byCamp.set(r.campanha, { invest: 0, cliques: 0, impressoes: 0, conversoes: 0, receita: 0 })
    const c = byCamp.get(r.campanha)!
    c.invest += r.valorInvestido
    c.cliques += r.cliques
    c.impressoes += r.impressoes
    c.conversoes += r.conversoes
    c.receita += r.receitaAds
  }

  const ranked = [...byCamp.entries()]
    .map(([campanha, m]) => ({ campanha, ...m }))
    .sort((a, b) => b.invest - a.invest)
    .slice(0, 10)

  if (ranked.length === 0) return null

  const maxInvest = ranked[0]!.invest

  return (
    <Card className="border-0 shadow-sm lg:col-span-2">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          Ranking de Campanhas por Investimento
          <span className="text-[10px] font-normal text-slate-400">Top {ranked.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-1">
          {ranked.map((c, i) => {
            const ctr   = c.impressoes > 0 ? (c.cliques / c.impressoes) * 100 : 0
            const cpc   = c.cliques > 0 ? c.invest / c.cliques : 0
            const roas  = c.receita > 0 ? c.receita / c.invest : 0
            const pct   = maxInvest > 0 ? (c.invest / maxInvest) * 100 : 0
            const isTop = i === 0
            const isOpen = expanded === c.campanha

            return (
              <div key={c.campanha}>
                <div
                  onClick={() => setExpanded(p => p === c.campanha ? null : c.campanha)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors duration-150 hover:bg-slate-50"
                >
                  <span
                    className="text-[11px] font-bold w-5 shrink-0 text-right tabular-nums"
                    style={{ color: isTop ? '#016233' : '#94a3b8' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[12px] font-medium text-slate-700 truncate" title={c.campanha}>
                          {c.campanha}
                        </span>
                        {isTop && (
                          <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#016233]/10 text-[#016233] tracking-wide">
                            TOP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3.5 shrink-0 text-[11px]">
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {formatCurrency(c.invest)}
                        </span>
                        {roas > 0 && (
                          <span className="text-emerald-600 font-semibold tabular-nums hidden sm:inline">
                            {roas.toFixed(1)}x ROAS
                          </span>
                        )}
                        <svg
                          className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          viewBox="0 0 16 16" fill="none"
                        >
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: mounted ? `${pct}%` : '0%',
                          transition: `width ${600 + i * 40}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                          background: isTop
                            ? 'linear-gradient(90deg, #016233 0%, #059669 100%)'
                            : 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mx-8 mb-2 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {[
                        { label: 'Investido',   value: formatCurrency(c.invest) },
                        { label: 'Cliques',     value: formatNumber(c.cliques) },
                        { label: 'CTR',         value: formatPercent(ctr) },
                        { label: 'CPC',         value: formatCurrency(cpc) },
                        { label: 'ROAS',        value: roas > 0 ? `${roas.toFixed(2)}x` : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
                          <span className="text-[13px] font-semibold text-slate-700 tabular-nums">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ChannelChart({ channels, adRows }: ChannelChartProps) {
  const channelData = channels.map(c => ({
    name: c.canal,
    Cliques: c.cliques,
    Investimento: c.valorInvestido,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-slate-700">Cliques por Canal</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => formatCompact(Number(v ?? 0))} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} width={72} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={v => [Number(v ?? 0).toLocaleString('pt-BR'), 'Cliques']} />
                <Bar dataKey="Cliques" fill="#016233" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-slate-700">Investimento por Canal</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `R$${formatCompact(Number(v ?? 0))}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} width={72} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={v => [formatCurrency(Number(v ?? 0)), 'Investido']} />
                <Bar dataKey="Investimento" fill="#f37021" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <CampaignRanking adRows={adRows} />
    </div>
  )
}
