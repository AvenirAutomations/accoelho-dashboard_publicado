import type {
  CampaignRow, VTEXRow, GA4Row,
  GoogleAdsMetrics, MetaAdsMetrics, GA4Metrics, VTEXMetrics,
  ExecutiveMetrics, WeeklyTrend, ChannelMetrics,
  WeeklyComparisonRow, KPIVariation, Filters,
} from '@/types'
import { getAllSemanas, getSemanaDateRange } from '@/lib/period'

type AdFilters = Partial<Pick<Filters, 'canal' | 'campanha'>>

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

// ─── Ad row filters ────────────────────────────────────────────────────────────
export function applyAdFilters(rows: CampaignRow[], filters: AdFilters): CampaignRow[] {
  return rows.filter(r => {
    if (filters.canal && filters.canal !== 'Todos' && r.canal !== filters.canal) return false
    if (filters.campanha && filters.campanha !== 'Todas' && r.campanha !== filters.campanha) return false
    return true
  })
}

// ─── Source-specific aggregation ──────────────────────────────────────────────
export function aggregateGoogleAds(rows: CampaignRow[]): GoogleAdsMetrics {
  const google = rows.filter(r => r.source === 'google')
  const t = google.reduce(
    (a, r) => ({
      investimento: a.investimento + r.valorInvestido,
      impressoes: a.impressoes + r.impressoes,
      cliques: a.cliques + r.cliques,
      conversoes: a.conversoes + r.conversoes,
      ligacoes: a.ligacoes + r.ligacoes,
      receita: a.receita + r.receitaAds,
    }),
    { investimento: 0, impressoes: 0, cliques: 0, conversoes: 0, ligacoes: 0, receita: 0 },
  )
  return {
    ...t,
    ctr: safeDiv(t.cliques, t.impressoes) * 100,
    cpc: safeDiv(t.investimento, t.cliques),
    roas: safeDiv(t.receita, t.investimento),
  }
}

export function aggregateMetaAds(rows: CampaignRow[]): MetaAdsMetrics {
  const meta = rows.filter(r => r.source === 'meta')
  const t = meta.reduce(
    (a, r) => ({
      investimento: a.investimento + r.valorInvestido,
      alcance: a.alcance + r.alcance,
      impressoes: a.impressoes + r.impressoes,
      cliques: a.cliques + r.cliques,
      conversasIniciadas: a.conversasIniciadas + r.conversasIniciadas,
    }),
    { investimento: 0, alcance: 0, impressoes: 0, cliques: 0, conversasIniciadas: 0 },
  )
  return {
    ...t,
    ctr: safeDiv(t.cliques, t.impressoes) * 100,
    cpc: safeDiv(t.investimento, t.cliques),
    cpl: safeDiv(t.investimento, t.conversasIniciadas),
  }
}

export function aggregateGA4(rows: GA4Row[]): GA4Metrics {
  const t = rows.reduce(
    (a, r) => ({
      usuarios: a.usuarios + r.usuarios,
      sessoes: a.sessoes + r.sessoes,
      taxaEngajamento: a.taxaEngajamento + r.taxaEngajamento,
      addToCart: a.addToCart + r.addToCart,
      checkout: a.checkout + r.checkout,
      conversao: a.conversao + r.conversao,
      _count: a._count + 1,
    }),
    { usuarios: 0, sessoes: 0, taxaEngajamento: 0, addToCart: 0, checkout: 0, conversao: 0, _count: 0 },
  )
  return {
    usuarios: t.usuarios,
    sessoes: t.sessoes,
    taxaEngajamento: safeDiv(t.taxaEngajamento, t._count),
    addToCart: t.addToCart,
    checkout: t.checkout,
    conversao: t.conversao,
    taxaAddToCart: safeDiv(t.addToCart, t.sessoes) * 100,
    taxaCheckout: safeDiv(t.checkout, t.addToCart) * 100,
    taxaConversao: safeDiv(t.conversao, t.sessoes) * 100,
  }
}

export function aggregateVTEX(rows: VTEXRow[]): VTEXMetrics {
  const t = rows.reduce(
    (a, r) => ({
      receita: a.receita + r.receita,
      pedidos: a.pedidos + r.pedidos,
      produtosVendidos: a.produtosVendidos + r.produtosVendidos,
      novosClientes: a.novosClientes + r.novosClientes,
      clientesRecorrentes: a.clientesRecorrentes + r.clientesRecorrentes,
    }),
    { receita: 0, pedidos: 0, produtosVendidos: 0, novosClientes: 0, clientesRecorrentes: 0 },
  )
  return {
    ...t,
    ticketMedio: safeDiv(t.receita, t.pedidos),
    taxaRecorrencia: safeDiv(t.clientesRecorrentes, t.pedidos) * 100,
  }
}

export function aggregateExecutive(
  adRows: CampaignRow[],
  vtexRows: VTEXRow[],
): ExecutiveMetrics {
  const google = aggregateGoogleAds(adRows)
  const meta = aggregateMetaAds(adRows)
  const vtex = aggregateVTEX(vtexRows)
  const investimentoTotal = google.investimento + meta.investimento
  return {
    receitaTotal: vtex.receita,
    pedidos: vtex.pedidos,
    ticketMedio: vtex.ticketMedio,
    roasGeral: safeDiv(vtex.receita, investimentoTotal),
    investimentoTotal,
    leadsWhatsapp: meta.conversasIniciadas,
    ligacoesLojas: google.ligacoes,
  }
}

// ─── Weekly trend (across all semanas in adRows) ───────────────────────────────
export function getWeeklyTrend(
  adRows: CampaignRow[],
  vtexRows: VTEXRow[],
  ga4Rows: GA4Row[],
): WeeklyTrend[] {
  const semanas = getAllSemanas(adRows)
  return semanas.map(semana => {
    const ads   = adRows.filter(r => r.semana === semana)
    const vtex  = vtexRows.filter(r => r.semana === semana)
    const ga4   = ga4Rows.filter(r => r.semana === semana)
    const gAgg  = aggregateGoogleAds(ads)
    const mAgg  = aggregateMetaAds(ads)
    const vAgg  = aggregateVTEX(vtex)
    const g4Agg = aggregateGA4(ga4)
    const invest = gAgg.investimento + mAgg.investimento
    return {
      semana,
      receita: vAgg.receita,
      pedidos: vAgg.pedidos,
      investimento: invest,
      roas: safeDiv(vAgg.receita, invest),
      sessoes: g4Agg.sessoes,
      conversoes: g4Agg.conversao,
    }
  })
}

// ─── Channel breakdown for ad rows ────────────────────────────────────────────
export function getChannelMetrics(rows: CampaignRow[]): ChannelMetrics[] {
  const byCanal = new Map<string, CampaignRow[]>()
  for (const row of rows) {
    if (!byCanal.has(row.canal)) byCanal.set(row.canal, [])
    byCanal.get(row.canal)!.push(row)
  }
  return [...byCanal.entries()].map(([canal, cRows]) => {
    const t = cRows.reduce(
      (a, r) => ({
        impressoes: a.impressoes + r.impressoes,
        cliques: a.cliques + r.cliques,
        valorInvestido: a.valorInvestido + r.valorInvestido,
        conversoes: a.conversoes + r.conversoes,
      }),
      { impressoes: 0, cliques: 0, valorInvestido: 0, conversoes: 0 },
    )
    return {
      canal,
      ...t,
      ctr: safeDiv(t.cliques, t.impressoes) * 100,
      cpc: safeDiv(t.valorInvestido, t.cliques),
    }
  })
}

// ─── Weekly comparison table ───────────────────────────────────────────────────
export function getWeeklyComparison(
  adRows: CampaignRow[],
  vtexRows: VTEXRow[],
  ga4Rows: GA4Row[],
): WeeklyComparisonRow[] {
  const semanas = getAllSemanas(adRows)
  const base: WeeklyComparisonRow[] = semanas.map(semana => {
    const ads  = adRows.filter(r => r.semana === semana)
    const vtex = vtexRows.filter(r => r.semana === semana)
    const ga4  = ga4Rows.filter(r => r.semana === semana)
    const exec = aggregateExecutive(ads, vtex)
    const g4   = aggregateGA4(ga4)
    return {
      semana,
      dateRange: getSemanaDateRange(semana),
      receita: exec.receitaTotal,
      pedidos: exec.pedidos,
      ticketMedio: exec.ticketMedio,
      investimento: exec.investimentoTotal,
      roas: exec.roasGeral,
      sessoes: g4.sessoes,
    }
  })

  return base.map((row, i) => {
    if (i === 0) return row
    const prev = base[i - 1]
    return {
      ...row,
      varReceita:     prev.receita > 0      ? ((row.receita - prev.receita) / prev.receita) * 100 : undefined,
      varPedidos:     prev.pedidos > 0      ? ((row.pedidos - prev.pedidos) / prev.pedidos) * 100 : undefined,
      varInvestimento: prev.investimento > 0 ? ((row.investimento - prev.investimento) / prev.investimento) * 100 : undefined,
      varRoas:        prev.roas > 0         ? ((row.roas - prev.roas) / prev.roas) * 100 : undefined,
    }
  })
}

export function getVariation(current: number, previous: number): KPIVariation {
  return {
    current,
    previous,
    variation: previous === 0 ? 0 : ((current - previous) / previous) * 100,
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(Math.round(value))
}

export function formatRoas(value: number): string {
  return `${value.toFixed(1)}x`
}
