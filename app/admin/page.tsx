'use client'

import { useMemo, useState } from 'react'
import {
  DollarSign, ShoppingCart, Package, Users, Percent,
  TrendingUp, BarChart3, Eye, MousePointerClick, RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
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
  getDailyTrend, getDailyComparison,
  getEcommerceRoas, getVariation,
  formatCurrency, formatNumber, formatPercent, formatCompact, formatRoas,
} from '@/lib/metrics'
import { filterRowsByPeriod, getPrevPeriod, getPeriodLabel } from '@/lib/period'
import type { Filters, PeriodFilter } from '@/types'

const DEFAULT_FILTERS: Filters = {
  canal: 'Todos',
  campanha: 'Todas',
  period: { mode: 'this_month' },
}

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

export default function AdminPage() {
  const { rows, vtex, ga4, loading, error, lastUpdated, refresh } = useSheetData()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [activeTab, setActiveTab] = useState('executivo')

  const period: PeriodFilter = filters.period

  const periodLabel = getPeriodLabel(period)

  const periodRows = useMemo(() => filterRowsByPeriod(rows, period), [rows, period])
  const periodVtex = useMemo(() => filterRowsByPeriod(vtex, period), [vtex, period])
  const periodGa4  = useMemo(() => filterRowsByPeriod(ga4, period), [ga4, period])

  const prevPeriod = useMemo(() => getPrevPeriod(period), [period])
  const prevRows   = useMemo(() => prevPeriod ? filterRowsByPeriod(rows, prevPeriod) : [], [rows, prevPeriod])
  const prevVtex   = useMemo(() => prevPeriod ? filterRowsByPeriod(vtex, prevPeriod) : [], [vtex, prevPeriod])

  const filteredAds = useMemo(() => applyAdFilters(periodRows, filters), [periodRows, filters])

  const execCurrent  = useMemo(() => aggregateExecutive(filteredAds, periodVtex), [filteredAds, periodVtex])
  const execPrevious = useMemo(() => prevRows.length > 0 ? aggregateExecutive(prevRows, prevVtex) : null, [prevRows, prevVtex])

  const googleMetrics = useMemo(() => aggregateGoogleAds(filteredAds), [filteredAds])
  const prevGoogle    = useMemo(() => aggregateGoogleAds(prevRows), [prevRows])
  const metaMetrics   = useMemo(() => aggregateMetaAds(filteredAds), [filteredAds])
  const prevMeta      = useMemo(() => aggregateMetaAds(prevRows), [prevRows])
  const ga4Metrics    = useMemo(() => aggregateGA4(periodGa4), [periodGa4])
  const vtexMetrics   = useMemo(() => aggregateVTEX(periodVtex), [periodVtex])
  const prevVtexAgg   = useMemo(() => aggregateVTEX(prevVtex), [prevVtex])

  const trend      = useMemo(() => getDailyTrend(rows, vtex, ga4), [rows, vtex, ga4])
  const comparison = useMemo(() => getDailyComparison(rows, vtex, ga4), [rows, vtex, ga4])


  const vG = (cur: number, pre: number) => prevRows.length > 0 ? getVariation(cur, pre) : null
  const vM = (cur: number, pre: number) => prevRows.length > 0 ? getVariation(cur, pre) : null
  const vV = (cur: number, pre: number) => prevVtex.length > 0 ? getVariation(cur, pre) : null

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
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">Erro ao carregar dados</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={refresh} className="px-4 py-2 bg-[#016233] text-white text-sm rounded-lg">Tentar novamente</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ac-bg)' }}>
      <Header semanaAtual={periodLabel} produto="Admin" lastUpdated={lastUpdated} />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Back + period + refresh */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao dashboard
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-[#016233] bg-[#016233]/10 px-2 py-0.5 rounded-full">Admin</span>
            <Link href="/admin/data-check" className="text-xs font-medium text-slate-500 hover:text-slate-700 underline">
              Status das planilhas
            </Link>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        <FilterBar filters={filters} onFilterChange={setFilters} data={periodRows} />

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

          <TabsContent value="executivo" className="mt-4 space-y-4">
            <HeroSection current={execCurrent} previous={execPrevious} trend={trend} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2"><WeeklyChart data={trend} /></div>
              <GoalTracker current={execCurrent} periodLabel={periodLabel} />
            </div>
            <WeeklyComparison rows={comparison} highlightSemana={undefined} />
          </TabsContent>

          <TabsContent value="google" className="mt-4 space-y-4">
            <KPIGrid kpis={[
              { title: 'Investimento', value: formatCurrency(googleMetrics.investimento), variation: vG(googleMetrics.investimento, prevGoogle.investimento), icon: <DollarSign /> },
              { title: 'Impressões', value: formatCompact(googleMetrics.impressoes), variation: vG(googleMetrics.impressoes, prevGoogle.impressoes), icon: <Eye /> },
              { title: 'Cliques', value: formatNumber(googleMetrics.cliques), variation: vG(googleMetrics.cliques, prevGoogle.cliques), icon: <MousePointerClick /> },
              { title: 'CTR', value: formatPercent(googleMetrics.ctr), variation: vG(googleMetrics.ctr, prevGoogle.ctr), icon: <Percent /> },
              { title: 'CPC', value: formatCurrency(googleMetrics.cpc), variation: vG(googleMetrics.cpc, prevGoogle.cpc), lowerIsBetter: true, icon: <BarChart3 /> },
              { title: 'Conversões', value: formatNumber(googleMetrics.conversoes), variation: vG(googleMetrics.conversoes, prevGoogle.conversoes), icon: <ShoppingCart /> },

              { title: 'ROAS', value: formatRoas(getEcommerceRoas(filteredAds, periodVtex)), variation: vG(getEcommerceRoas(filteredAds, periodVtex), getEcommerceRoas(prevRows, prevVtex)), icon: <BarChart3 /> },
            ]} />
            <ChannelChart adRows={filteredAds.filter(r => r.source === 'google')} />
          </TabsContent>

          <TabsContent value="meta" className="mt-4 space-y-4">
            <MetaHighlightKPIs
              conversasIniciadas={metaMetrics.conversasIniciadas}
              variationConversas={vM(metaMetrics.conversasIniciadas, prevMeta.conversasIniciadas)}
              cpc={metaMetrics.cpc}
              cliques={metaMetrics.cliques}
              variationCpc={vM(metaMetrics.cpc, prevMeta.cpc)}
            />
            <KPIGrid kpis={[
              { title: 'Investimento', value: formatCurrency(metaMetrics.investimento), variation: vM(metaMetrics.investimento, prevMeta.investimento), icon: <DollarSign /> },
              { title: 'Alcance', value: formatCompact(metaMetrics.alcance), variation: vM(metaMetrics.alcance, prevMeta.alcance), icon: <Eye /> },
              { title: 'Impressões', value: formatCompact(metaMetrics.impressoes), variation: vM(metaMetrics.impressoes, prevMeta.impressoes), icon: <Eye /> },
              { title: 'Cliques', value: formatNumber(metaMetrics.cliques), variation: vM(metaMetrics.cliques, prevMeta.cliques), icon: <MousePointerClick /> },
              { title: 'CTR', value: formatPercent(metaMetrics.ctr), variation: vM(metaMetrics.ctr, prevMeta.ctr), icon: <Percent /> },
              { title: 'CPC', value: formatCurrency(metaMetrics.cpc), variation: vM(metaMetrics.cpc, prevMeta.cpc), lowerIsBetter: true, icon: <BarChart3 /> },
              { title: 'CPM', value: formatCurrency(metaMetrics.cpm), variation: vM(metaMetrics.cpm, prevMeta.cpm), lowerIsBetter: true, icon: <BarChart3 /> },
            ]} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-4">
            <KPIGrid kpis={[
              { title: 'Usuários', value: formatCompact(ga4Metrics.usuarios), icon: <Users /> },
              { title: 'Sessões', value: formatCompact(ga4Metrics.sessoes), icon: <Eye /> },
              { title: 'Engajamento', value: formatPercent(ga4Metrics.taxaEngajamento, 1), icon: <Percent /> },
              { title: 'Add to Cart', value: formatNumber(ga4Metrics.addToCart), icon: <ShoppingCart /> },
              { title: 'Checkout', value: formatNumber(ga4Metrics.checkout), icon: <Package /> },
              { title: 'Conversões', value: formatNumber(ga4Metrics.conversao), icon: <TrendingUp /> },
              { title: 'Taxa Add Cart', value: formatPercent(ga4Metrics.taxaAddToCart, 1), icon: <Percent /> },
              { title: 'Taxa Checkout', value: formatPercent(ga4Metrics.taxaCheckout, 1), icon: <Percent /> },
              { title: 'Taxa Conversão', value: formatPercent(ga4Metrics.taxaConversao, 2), icon: <Percent /> },
            ]} />
            <FunnelViz ga4={ga4Metrics} vtexPedidos={vtexMetrics.pedidos} />
          </TabsContent>

          <TabsContent value="vtex" className="mt-4 space-y-4">
            <KPIGrid kpis={[
              { title: 'Receita Total', value: formatCurrency(vtexMetrics.receita), variation: vV(vtexMetrics.receita, prevVtexAgg.receita), icon: <DollarSign /> },
              { title: 'Pedidos', value: formatNumber(vtexMetrics.pedidos), variation: vV(vtexMetrics.pedidos, prevVtexAgg.pedidos), icon: <ShoppingCart /> },
              { title: 'Ticket Médio', value: formatCurrency(vtexMetrics.ticketMedio), variation: vV(vtexMetrics.ticketMedio, prevVtexAgg.ticketMedio), icon: <BarChart3 /> },
              { title: 'Produtos Vendidos', value: formatNumber(vtexMetrics.produtosVendidos), variation: vV(vtexMetrics.produtosVendidos, prevVtexAgg.produtosVendidos), icon: <Package /> },
              { title: 'Novos Clientes', value: formatNumber(vtexMetrics.novosClientes), variation: vV(vtexMetrics.novosClientes, prevVtexAgg.novosClientes), icon: <Users /> },
              { title: 'Recorrentes', value: formatNumber(vtexMetrics.clientesRecorrentes), variation: vV(vtexMetrics.clientesRecorrentes, prevVtexAgg.clientesRecorrentes), icon: <Users /> },
              { title: 'Taxa Recorrência', value: formatPercent(vtexMetrics.taxaRecorrencia, 1), variation: vV(vtexMetrics.taxaRecorrencia, prevVtexAgg.taxaRecorrencia), icon: <Percent /> },
            ]} />
            <WeeklyChart data={trend} />
          </TabsContent>

          <TabsContent value="funil" className="mt-4 space-y-4">
            <FunnelViz ga4={ga4Metrics} vtexPedidos={vtexMetrics.pedidos} />
            <WeeklyComparison rows={comparison} highlightSemana={undefined} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
