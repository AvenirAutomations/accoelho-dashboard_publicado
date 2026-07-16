'use client'

import { useMemo, useState } from 'react'
import {
  DollarSign, ShoppingCart, Percent,
  TrendingUp, BarChart3, Eye, MousePointerClick, RefreshCw,
  MessageCircle, Clock, CheckCheck, Timer, XCircle, Hourglass, Zap, Trophy, Megaphone,
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

import ChannelChart from '@/components/dashboard/ChannelChart'
import GoalTracker from '@/components/dashboard/GoalTracker'
import WeeklyComparison from '@/components/dashboard/WeeklyComparison'
import BlipChart from '@/components/dashboard/BlipChart'
import MetaHighlightKPIs from '@/components/dashboard/MetaHighlightKPIs'
import { useSheetData } from '@/hooks/useSheetData'
import { useBlipData } from '@/hooks/useBlipData'
import { useMetaCreatives } from '@/hooks/useMetaCreatives'
import {
  applyAdFilters,
  aggregateGoogleAds, aggregateMetaAds,
  aggregateVTEX, aggregateExecutive,
  getDailyTrend, getDailyComparison,
  getEcommerceRoas, getEcommerceInvest, getVariation,
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
  const { data: blipData, loading: blipLoading, error: blipError } = useBlipData()
  const { data: creativesData, loading: creativesLoading } = useMetaCreatives()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [activeTab, setActiveTab] = useState('executivo')

  const period: PeriodFilter = filters.period

  const periodLabel = getPeriodLabel(period)

  const periodRows = useMemo(() => filterRowsByPeriod(rows, period), [rows, period])
  const periodVtex = useMemo(() => filterRowsByPeriod(vtex, period), [vtex, period])
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
              { value: 'vtex', label: 'Ecommerce' },
              { value: 'whatsapp', label: 'WhatsApp' },
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
            <MetaCreativesGrid data={creativesData?.ads ?? []} loading={creativesLoading} />
          </TabsContent>

          <TabsContent value="vtex" className="mt-4 space-y-4">
            <KPIGrid kpis={[
              { title: 'Receita Total', value: formatCurrency(vtexMetrics.receita), variation: vV(vtexMetrics.receita, prevVtexAgg.receita), icon: <DollarSign /> },
              { title: 'Pedidos', value: formatNumber(vtexMetrics.pedidos), variation: vV(vtexMetrics.pedidos, prevVtexAgg.pedidos), icon: <ShoppingCart /> },
              { title: 'Ticket Médio', value: formatCurrency(vtexMetrics.ticketMedio), variation: vV(vtexMetrics.ticketMedio, prevVtexAgg.ticketMedio), icon: <BarChart3 /> },
              { title: 'ROAS', value: formatRoas(getEcommerceRoas(filteredAds, periodVtex)), variation: vG(getEcommerceRoas(filteredAds, periodVtex), getEcommerceRoas(prevRows, prevVtex)), icon: <TrendingUp /> },
              { title: 'Invest. Ecommerce', value: formatCurrency(getEcommerceInvest(filteredAds)), variation: vG(getEcommerceInvest(filteredAds), getEcommerceInvest(prevRows)), lowerIsBetter: false, icon: <DollarSign /> },
            ]} />
            <WeeklyChart data={trend} />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-4 space-y-4">
            {blipLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-[#016233] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : blipError ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: '#fff', border: '1px solid #E4E8EF' }}>
                <p className="text-sm text-red-500 font-medium">Erro ao carregar dados do WhatsApp</p>
                <p className="text-xs text-slate-400 mt-1">{blipError}</p>
              </div>
            ) : blipData ? (
              <>
                {/* Volumes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'Em Aberto', value: String(blipData.kpis.emAberto), icon: <MessageCircle /> },
                    { title: 'Aguardando', value: String(blipData.kpis.aguardando), icon: <Clock /> },
                    { title: 'Finalizadas Hoje', value: String(blipData.kpis.finalizadasHoje), icon: <CheckCheck /> },
                    { title: 'Perdidos / Abandonados', value: String(blipData.kpis.perdidos), icon: <XCircle /> },
                  ].map((kpi, i) => (
                    <KPICard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} index={i} />
                  ))}
                </div>

                {/* Tempos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: 'Tempo Médio de Atendimento', value: formatBlipTime(blipData.kpis.tempoMedioAtendimento), icon: <Timer /> },
                    { title: 'Tempo Médio de Espera na Fila', value: formatBlipTime(blipData.kpis.tempoEspera), icon: <Hourglass /> },
                    { title: 'Tempo Médio 1ª Resposta', value: formatBlipTime(blipData.kpis.tempoPrimeiraResposta), icon: <Zap /> },
                  ].map((kpi, i) => (
                    <KPICard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} index={i + 4} />
                  ))}
                </div>

                <BlipChart data={blipData.dailySeries} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Ranking de atendentes */}
                  {blipData.attendants.length > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E4E8EF' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 text-[#016233]" />
                        <span className="text-sm font-semibold text-slate-700">Ranking de Atendentes — Mês Atual</span>
                      </div>
                      <div className="space-y-2">
                        {blipData.attendants.map((att, i) => {
                          const max = blipData.attendants[0].tickets
                          const pct = max > 0 ? (att.tickets / max) * 100 : 0
                          return (
                            <div key={att.nome} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-medium text-slate-700 truncate">{att.nome}</span>
                                  <span className="text-xs font-bold text-[#016233] ml-2 shrink-0">{att.tickets} tickets</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full bg-[#016233]" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Conversas por anúncio (Click Tracker) */}
                  {blipData.adTracking.length > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E4E8EF' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Megaphone className="w-4 h-4 text-[#f37021]" />
                        <span className="text-sm font-semibold text-slate-700">Conversas por Anúncio — Mês Atual</span>
                      </div>
                      <div className="space-y-2">
                        {blipData.adTracking.map((ad, i) => {
                          const max = blipData.adTracking[0].conversas
                          const pct = max > 0 ? (ad.conversas / max) * 100 : 0
                          return (
                            <div key={ad.nome + i} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-medium text-slate-700 truncate" title={ad.nome}>{ad.nome}</span>
                                  <span className="text-xs font-bold text-[#f37021] ml-2 shrink-0">{ad.conversas}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full bg-[#f37021]" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function MetaCreativesGrid({ data, loading }: { data: import('@/hooks/useMetaCreatives').MetaAd[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-[#f37021] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!data.length) return null
  return (
    <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E4E8EF' }}>
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-[#f37021]" />
        <span className="text-sm font-semibold text-slate-700">Top Criativos — Mês Atual</span>
        <span className="text-xs text-slate-400 ml-1">(por investimento)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((ad, i) => (
          <div key={ad.id} className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 flex flex-col">
            <div className="relative">
              {ad.thumbnail ? (
                <img src={ad.thumbnail} alt={ad.nome} className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-36 bg-slate-200 flex items-center justify-center">
                  <Megaphone className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <span className="absolute top-2 left-2 bg-[#f37021] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                #{i + 1}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2 flex-1">
              <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-tight">{ad.nome}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-auto">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Investido</p>
                  <p className="text-xs font-bold text-slate-800">R$ {ad.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cliques</p>
                  <p className="text-xs font-bold text-slate-800">{ad.cliques.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">CTR</p>
                  <p className="text-xs font-bold text-slate-800">{ad.ctr.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">CPM</p>
                  <p className="text-xs font-bold text-slate-800">R$ {ad.cpm.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatBlipTime(ts: string): string {
  if (!ts || ts === '—') return '—'
  try {
    let totalSeconds = 0
    if (ts.includes('.') && ts.indexOf('.') < ts.indexOf(':')) {
      const [days, time] = ts.split('.')
      const [h, m, s] = time.split(':').map(Number)
      totalSeconds = parseInt(days) * 86400 + h * 3600 + m * 60 + (s || 0)
    } else {
      const [h, m, s] = ts.split(':').map(Number)
      totalSeconds = h * 3600 + m * 60 + (s || 0)
    }
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  } catch {
    return ts
  }
}
