// ─── Period ───────────────────────────────────────────────────────────────────
export type PeriodMode = 'today' | 'yesterday' | 'last7' | 'this_month' | 'custom'

export interface PeriodFilter {
  mode: PeriodMode
  dateFrom?: string // "YYYY-MM-DD" — only for 'custom'
  dateTo?: string   // "YYYY-MM-DD" — only for 'custom'
}

// ─── Raw row types ─────────────────────────────────────────────────────────────

/** Unified ad row: Google Ads or Meta Ads, campaign-level daily data */
export interface CampaignRow {
  id: string
  data: string       // "YYYY-MM-DD"
  semana: string     // "S19/2026"
  source: 'google' | 'meta'
  campanha: string
  canal: string      // "Search", "Shopping", "Display", "Reels", "Feed"…
  impressoes: number
  cliques: number
  valorInvestido: number
  // Google Ads
  conversoes: number
  receitaAds: number
  ligacoes: number
  // Meta Ads
  alcance: number
  conversasIniciadas: number
}

/** VTEX order data — daily aggregated */
export interface VTEXRow {
  data: string
  semana: string
  receita: number
  pedidos: number
  ticketMedio: number
  produtosVendidos: number
  novosClientes: number
  clientesRecorrentes: number
}

/** Google Analytics 4 — daily aggregated */
export interface GA4Row {
  data: string
  semana: string
  usuarios: number
  sessoes: number
  taxaEngajamento: number  // 0–100 (%)
  addToCart: number
  checkout: number
  conversao: number        // completed purchases
}

// ─── API response ─────────────────────────────────────────────────────────────
export interface DashboardData {
  rows: CampaignRow[]
  vtex: VTEXRow[]
  ga4: GA4Row[]
}

// ─── Sheets diagnostics (admin/data-check) ────────────────────────────────────
export interface SheetTabStatus {
  tab: string
  found: boolean
  count: number
  lastDate: string | null
  error: string | null
}

export interface SheetsHealth {
  masterUrlConfigured: boolean
  sheetId: string | null
  tabs: SheetTabStatus[]
}

// ─── Aggregated metrics ───────────────────────────────────────────────────────
export interface GoogleAdsMetrics {
  investimento: number
  impressoes: number
  cliques: number
  ctr: number
  cpc: number
  conversoes: number
  ligacoes: number
  receita: number
  roas: number
}

export interface MetaAdsMetrics {
  investimento: number
  alcance: number
  impressoes: number
  cliques: number
  ctr: number
  cpc: number
  cpm: number
  conversasIniciadas: number
  cpl: number
}

export interface GA4Metrics {
  usuarios: number
  sessoes: number
  taxaEngajamento: number
  addToCart: number
  checkout: number
  conversao: number
  taxaAddToCart: number  // addToCart / sessoes * 100
  taxaCheckout: number   // checkout / addToCart * 100
  taxaConversao: number  // conversao / sessoes * 100
}

export interface VTEXMetrics {
  receita: number
  pedidos: number
  ticketMedio: number
  produtosVendidos: number
  novosClientes: number
  clientesRecorrentes: number
  taxaRecorrencia: number
}

export interface ExecutiveMetrics {
  receitaTotal: number
  pedidos: number
  ticketMedio: number
  roasGeral: number
  investimentoTotal: number
  leadsWhatsapp: number
  ligacoesLojas: number
}

// ─── Weekly trend ─────────────────────────────────────────────────────────────
export interface WeeklyTrend {
  semana: string
  label: string   // display label: "DD/MM" for daily, "S27" for weekly
  receita: number
  pedidos: number
  investimento: number
  roas: number
  sessoes: number
  conversoes: number
}

// ─── Channel breakdown ────────────────────────────────────────────────────────
export interface ChannelMetrics {
  canal: string
  impressoes: number
  cliques: number
  valorInvestido: number
  conversoes: number
  ctr: number
  cpc: number
}

// ─── Weekly comparison row ─────────────────────────────────────────────────────
export interface WeeklyComparisonRow {
  semana: string
  dateRange: string
  receita: number
  pedidos: number
  ticketMedio: number
  investimento: number
  roas: number
  sessoes: number
  varReceita?: number
  varPedidos?: number
  varInvestimento?: number
  varRoas?: number
}

// ─── Funnel ───────────────────────────────────────────────────────────────────
export interface FunnelStep {
  name: string
  value: number
  fill: string
  pct?: number
}

// ─── Misc ─────────────────────────────────────────────────────────────────────
export interface KPIVariation {
  current: number
  previous: number
  variation: number
}

export interface Filters {
  canal: string
  campanha: string
  period: PeriodFilter
}

export interface DashboardInsight {
  type: 'positive' | 'negative' | 'warning' | 'neutral'
  title: string
  description: string
}

export interface AutoAnalysis {
  summary: string
  insights: DashboardInsight[]
  recommendations: string[]
}
