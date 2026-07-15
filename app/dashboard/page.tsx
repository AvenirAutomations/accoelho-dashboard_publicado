'use client'

import { useMemo, useState } from 'react'
import {
  Eye, MousePointerClick, DollarSign, Percent, BarChart3,
  ShoppingCart, Package, Users, TrendingUp,
  RefreshCw, Phone,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Header from '@/components/layout/Header'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import FilterBar from '@/components/dashboard/FilterBar'
import KPICard from '@/components/dashboard/KPICard'
import HeroSection from '@/components/dashboard/HeroSection'
import WeeklyChart from '@/components/dashboard/WeeklyChart'
import FunnelViz from '@/components/dashboard/FunnelViz'
import ChannelChart from '@/components/dashboard/ChannelChart'
import GoalTracker from '@/components/dashboard/GoalTracker'
import WeeklyComparison from '@/components/dashboard/WeeklyComparison'
import MetaHighlightKPIs from '@/components/dashboard/MetaHighlightKPIs'
import { useSheetData } from '@/hooks/useSheetData'
import {
  applyAdFilters,
  aggregateGoogleAds, aggregateMetaAds,
  aggregateGA4, aggregateVTEX, aggregateExecutive,
  getWeeklyTrend, getChannelMetrics, getWeeklyComparison,
  getVariation,
  formatCurrency, formatNumber, formatPercent, formatCompact, formatRoas,
} from '@/lib/metrics'
import { filterRowsByPeriod, getPrevPeriod, getPeriodLabel } from '@/lib/period'
import type { Filters, PeriodFilter } from '@/types'

const DEFAULT_FILTERS: Filters = {
  canal: 'Todos',
  campanha: 'Todas',
  period: { mode: 'this_month' },
}

// ─── KPI grid helpers ─────────────────────────────────────────────────────────
function KPIGrid({ kpis }: {
  kpis: { title: string; value: string; variation?: ReturnType<typeof getVariation> | null; lowerIsBetter?: boolean; icon?: React.ReactNode; spark?: number[] }[]
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => (
        <KPICard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          variation={kpi.variation}
          lowerIsBetter={kpi.lowerIsBetter}
          icon={kpi.icon}
          sparklineData={kpi.spark && kpi.spark.length >= 2 ? kpi.spark : undefined}
          index={i}
        />
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { rows, vtex, ga4, loading, error, lastUpdated, refresh } = useSheetData()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [activeTab, setActiveTab] = useState('executivo')

  const period: PeriodFilter = filters.period

  const periodLabel = getPeriodLabel(period)

  // ─── Period-filtered data ────────────────────────────────────────────────────
  const periodRows  = useMemo(() => filterRowsByPeriod(rows, period), [rows, period])
  const periodVtex  = useMemo(() => filterRowsByPeriod(vtex, period), [vtex, period])
  const periodGa4   = useMemo(() => filterRowsByPeriod(ga4, period), [ga4, period])

  // Previous period for comparison
  const prevPeriod  = useMemo(() => getPrevPeriod(period), [period])
  const prevRows    = useMemo(() => prevPeriod ? filterRowsByPeriod(rows, prevPeriod) : [], [rows, prevPeriod])
  const prevVtex    = useMemo(() => prevPeriod ? filterRowsByPeriod(vtex, prevPeriod) : [], [vtex, prevPeriod])

  // ─── Ad row filters ──────────────────────────────────────────────────────────
  const filteredAds = useMemo(() => applyAdFilters(periodRows, filters), [periodRows, filters])

  // ─── Aggregated metrics ──────────────────────────────────────────────────────
  const execCurrent  = useMemo(() => aggregateExecutive(filteredAds, periodVtex), [filteredAds, periodVtex])
  const execPrevious = useMemo(() => prevRows.length > 0 ? aggregateExecutive(prevRows, prevVtex) : null, [prevRows, prevVtex])

  const googleMetrics = useMemo(() => aggregateGoogleAds(filteredAds), [filteredAds])
  const prevGoogle    = useMemo(() => aggregateGoogleAds(prevRows), [prevRows])

  const metaMetrics   = useMemo(() => aggregateMetaAds(filteredAds), [filteredAds])
  const prevMeta      = useMemo(() => aggregateMetaAds(prevRows), [prevRows])

  const ga4Metrics    = useMemo(() => aggregateGA4(periodGa4), [periodGa4])
  const vtexMetrics   = useMemo(() => aggregateVTEX(periodVtex), [periodVtex])
  const prevVtexAgg   = useMemo(() => aggregateVTEX(prevVtex), [prevVtex])

  // ─── Trend & comparison (full history) ──────────────────────────────────────
  const trend      = useMemo(() => getWeeklyTrend(rows, vtex, ga4), [rows, vtex, ga4])
  const comparison = useMemo(() => getWeeklyComparison(rows, vtex, ga4), [rows, vtex, ga4])

  // ─── Variation helpers ───────────────────────────────────────────────────────
  const vG = (cur: number, pre: number) => prevRows.length > 0 ? getVariation(cur, pre) : null
  const vM = (cur: number, pre: number) => prevRows.length > 0 ? getVariation(cur, pre) : null
  const vV = (cur: number, pre: number) => prevVtex.length > 0 ? getVariation(cur, pre) : null

  // ─── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ac-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#016233] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Carregando dados…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ac-bg)' }}>
        <div className="text-center max-w-md px-6">
          <p className="text-red-500 font-semibold mb-2">Erro ao carregar dados</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#016233] text-white text-sm rounded-lg mx-auto hover:bg-[#014a26] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ac-bg)' }}>
      <Header semanaAtual={periodLabel} produto="" lastUpdated={lastUpdated} />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* ── Period + refresh ── */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <PeriodSelector
            period={period}
            onChange={p => setFilters(f => ({ ...f, period: p }))}
          />
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white border border-slate-200 text-xs font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 h-10 p-1 gap-0.5">
            {[
              { value: 'executivo', label: 'Visão Executiva' },
              { value: 'google', label: 'Google Ads' },
              { value: 'meta', label: 'Meta Ads' },
              { value: 'analytics', label: 'Analytics' },
              { value: 'vtex', label: 'VTEX' },
              { value: 'funil', label: 'Funil' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs font-medium data-[state=active]:bg-[#016233] data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — VISÃO EXECUTIVA
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="executivo" className="mt-4 space-y-4">
            <HeroSection current={execCurrent} previous={execPrevious} trend={trend} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <WeeklyChart data={trend} />
              </div>
              <GoalTracker current={execCurrent} />
            </div>

            <WeeklyComparison rows={comparison} highlightSemana={undefined} />
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — GOOGLE ADS
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="google" className="mt-4 space-y-4">
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              data={periodRows.filter(r => r.source === 'google')}
            />

            <KPIGrid kpis={[
              { title: 'Investimento', value: formatCurrency(googleMetrics.investimento), variation: vG(googleMetrics.investimento, prevGoogle.investimento), lowerIsBetter: false, icon: <DollarSign />, spark: trend.map(t => t.investimento) },
              { title: 'Impressões', value: formatCompact(googleMetrics.impressoes), variation: vG(googleMetrics.impressoes, prevGoogle.impressoes), icon: <Eye />, spark: trend.map(t => t.sessoes) },
              { title: 'Cliques', value: formatNumber(googleMetrics.cliques), variation: vG(googleMetrics.cliques, prevGoogle.cliques), icon: <MousePointerClick />, spark: trend.map(t => t.conversoes) },
              { title: 'CTR', value: formatPercent(googleMetrics.ctr), variation: vG(googleMetrics.ctr, prevGoogle.ctr), icon: <Percent /> },
              { title: 'CPC', value: formatCurrency(googleMetrics.cpc), variation: vG(googleMetrics.cpc, prevGoogle.cpc), lowerIsBetter: true, icon: <BarChart3 /> },
              { title: 'Conversões', value: formatNumber(googleMetrics.conversoes), variation: vG(googleMetrics.conversoes, prevGoogle.conversoes), icon: <ShoppingCart />, spark: trend.map(t => t.conversoes) },
              { title: 'Ligações', value: formatNumber(googleMetrics.ligacoes), variation: vG(googleMetrics.ligacoes, prevGoogle.ligacoes), icon: <Phone /> },
              { title: 'Receita Ads', value: formatCurrency(googleMetrics.receita), variation: vG(googleMetrics.receita, prevGoogle.receita), icon: <TrendingUp /> },
              { title: 'ROAS', value: formatRoas(googleMetrics.roas), variation: vG(googleMetrics.roas, prevGoogle.roas), icon: <BarChart3 /> },
            ]} />

            <ChannelChart
              channels={getChannelMetrics(filteredAds.filter(r => r.source === 'google'))}
              adRows={filteredAds.filter(r => r.source === 'google')}
            />
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — META ADS
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="meta" className="mt-4 space-y-4">
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              data={periodRows.filter(r => r.source === 'meta')}
            />

            <MetaHighlightKPIs
              conversasIniciadas={metaMetrics.conversasIniciadas}
              variationConversas={vM(metaMetrics.conversasIniciadas, prevMeta.conversasIniciadas)}
              cpc={metaMetrics.cpc}
              cliques={metaMetrics.cliques}
              variationCpc={vM(metaMetrics.cpc, prevMeta.cpc)}
            />

            <KPIGrid kpis={[
              { title: 'Investimento', value: formatCurrency(metaMetrics.investimento), variation: vM(metaMetrics.investimento, prevMeta.investimento), icon: <DollarSign />, spark: trend.map(t => t.investimento) },
              { title: 'Alcance', value: formatCompact(metaMetrics.alcance), variation: vM(metaMetrics.alcance, prevMeta.alcance), icon: <Eye /> },
              { title: 'Impressões', value: formatCompact(metaMetrics.impressoes), variation: vM(metaMetrics.impressoes, prevMeta.impressoes), icon: <Eye /> },
              { title: 'Cliques', value: formatNumber(metaMetrics.cliques), variation: vM(metaMetrics.cliques, prevMeta.cliques), icon: <MousePointerClick /> },
              { title: 'CTR', value: formatPercent(metaMetrics.ctr), variation: vM(metaMetrics.ctr, prevMeta.ctr), icon: <Percent /> },
              { title: 'CPC', value: formatCurrency(metaMetrics.cpc), variation: vM(metaMetrics.cpc, prevMeta.cpc), lowerIsBetter: true, icon: <BarChart3 /> },
              { title: 'CPM', value: formatCurrency(metaMetrics.cpm), variation: vM(metaMetrics.cpm, prevMeta.cpm), lowerIsBetter: true, icon: <BarChart3 /> },
            ]} />

          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4 — ANALYTICS (GA4)
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="analytics" className="mt-4 space-y-4">
            <KPIGrid kpis={[
              { title: 'Usuários', value: formatCompact(ga4Metrics.usuarios), icon: <Users />, spark: trend.map(t => t.sessoes) },
              { title: 'Sessões', value: formatCompact(ga4Metrics.sessoes), icon: <Eye />, spark: trend.map(t => t.sessoes) },
              { title: 'Engajamento', value: formatPercent(ga4Metrics.taxaEngajamento, 1), icon: <Percent /> },
              { title: 'Add to Cart', value: formatNumber(ga4Metrics.addToCart), icon: <ShoppingCart /> },
              { title: 'Checkout', value: formatNumber(ga4Metrics.checkout), icon: <Package /> },
              { title: 'Conversões', value: formatNumber(ga4Metrics.conversao), icon: <TrendingUp />, spark: trend.map(t => t.conversoes) },
              { title: 'Taxa Add Cart', value: formatPercent(ga4Metrics.taxaAddToCart, 1), icon: <Percent /> },
              { title: 'Taxa Checkout', value: formatPercent(ga4Metrics.taxaCheckout, 1), icon: <Percent /> },
              { title: 'Taxa Conversão', value: formatPercent(ga4Metrics.taxaConversao, 2), icon: <Percent /> },
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FunnelViz ga4={ga4Metrics} vtexPedidos={vtexMetrics.pedidos} />
              <div className="grid grid-cols-1 gap-4 content-start">
                <div
                  className="rounded-2xl p-5"
                  style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
                >
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Resumo de Sessões</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Sessões totais', value: formatCompact(ga4Metrics.sessoes), color: '#6366f1' },
                      { label: 'Add to Cart', value: `${formatNumber(ga4Metrics.addToCart)} (${formatPercent(ga4Metrics.taxaAddToCart, 1)})`, color: '#f37021' },
                      { label: 'Checkout', value: `${formatNumber(ga4Metrics.checkout)} (${formatPercent(ga4Metrics.taxaCheckout, 1)})`, color: '#d97706' },
                      { label: 'Compras', value: `${formatNumber(ga4Metrics.conversao)} (${formatPercent(ga4Metrics.taxaConversao, 2)})`, color: '#016233' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-xs text-slate-600">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 5 — VTEX
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="vtex" className="mt-4 space-y-4">
            <KPIGrid kpis={[
              { title: 'Receita Total', value: formatCurrency(vtexMetrics.receita), variation: vV(vtexMetrics.receita, prevVtexAgg.receita), icon: <DollarSign />, spark: trend.map(t => t.receita) },
              { title: 'Pedidos', value: formatNumber(vtexMetrics.pedidos), variation: vV(vtexMetrics.pedidos, prevVtexAgg.pedidos), icon: <ShoppingCart />, spark: trend.map(t => t.pedidos) },
              { title: 'Ticket Médio', value: formatCurrency(vtexMetrics.ticketMedio), variation: vV(vtexMetrics.ticketMedio, prevVtexAgg.ticketMedio), icon: <BarChart3 /> },
              { title: 'Produtos Vendidos', value: formatNumber(vtexMetrics.produtosVendidos), variation: vV(vtexMetrics.produtosVendidos, prevVtexAgg.produtosVendidos), icon: <Package /> },
              { title: 'Novos Clientes', value: formatNumber(vtexMetrics.novosClientes), variation: vV(vtexMetrics.novosClientes, prevVtexAgg.novosClientes), icon: <Users /> },
              { title: 'Clientes Recorrentes', value: formatNumber(vtexMetrics.clientesRecorrentes), variation: vV(vtexMetrics.clientesRecorrentes, prevVtexAgg.clientesRecorrentes), icon: <Users /> },
              { title: 'Taxa Recorrência', value: formatPercent(vtexMetrics.taxaRecorrencia, 1), variation: vV(vtexMetrics.taxaRecorrencia, prevVtexAgg.taxaRecorrencia), icon: <Percent /> },
            ]} />

            <WeeklyChart data={trend} />
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 6 — FUNIL E-COMMERCE
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="funil" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FunnelViz ga4={ga4Metrics} vtexPedidos={vtexMetrics.pedidos} />

              <div
                className="rounded-2xl p-5"
                style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
              >
                <h3 className="text-sm font-bold text-slate-800 mb-1">Métricas de Conversão</h3>
                <p className="text-[11px] text-slate-400 mb-4">Combinação GA4 + VTEX + Mídia Paga</p>
                <div className="space-y-3">
                  {[
                    { label: 'Custo por Sessão', value: execCurrent.investimentoTotal > 0 && ga4Metrics.sessoes > 0 ? formatCurrency(execCurrent.investimentoTotal / ga4Metrics.sessoes) : '—', note: 'Invest. total ÷ Sessões' },
                    { label: 'Custo por Carrinho', value: execCurrent.investimentoTotal > 0 && ga4Metrics.addToCart > 0 ? formatCurrency(execCurrent.investimentoTotal / ga4Metrics.addToCart) : '—', note: 'Invest. total ÷ Add to Cart' },
                    { label: 'CAC (por pedido)', value: execCurrent.investimentoTotal > 0 && vtexMetrics.pedidos > 0 ? formatCurrency(execCurrent.investimentoTotal / vtexMetrics.pedidos) : '—', note: 'Invest. total ÷ Pedidos' },
                    { label: 'ROAS Geral', value: formatRoas(execCurrent.roasGeral), note: 'Receita VTEX ÷ Invest. total' },
                    { label: 'ROI E-commerce', value: execCurrent.investimentoTotal > 0 ? formatPercent(((execCurrent.receitaTotal - execCurrent.investimentoTotal) / execCurrent.investimentoTotal) * 100, 1) : '—', note: '(Receita − Invest.) ÷ Invest.' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                        <p className="text-[10px] text-slate-400">{item.note}</p>
                      </div>
                      <span className="text-sm font-black text-slate-900 tabular-nums flex-shrink-0">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <WeeklyComparison rows={comparison} highlightSemana={undefined} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
