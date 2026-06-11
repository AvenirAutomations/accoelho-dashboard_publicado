import type { CampaignRow, VTEXRow, GA4Row, DashboardData } from '@/types'

// Deterministic pseudo-random (seeded)
function mkRand(seed: number) {
  let s = seed
  return () => {
    s = Math.sin(s) * 10000
    return s - Math.floor(s)
  }
}

export const SEMANAS = ['S16/2026', 'S17/2026', 'S18/2026', 'S19/2026', 'S20/2026']
export const SEMANA_ATUAL = 'S20/2026'

// Week start dates (Mon) for each semana
const WEEK_STARTS: Record<string, string> = {
  'S16/2026': '2026-04-13',
  'S17/2026': '2026-04-20',
  'S18/2026': '2026-04-27',
  'S19/2026': '2026-05-04',
  'S20/2026': '2026-05-11',
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

// ─── Google Ads campaigns ─────────────────────────────────────────────────────
const GOOGLE_CAMPAIGNS = [
  { campanha: 'AC Coelho | Search | Materiais Gerais', canal: 'Search' },
  { campanha: 'AC Coelho | Shopping | Catálogo Geral', canal: 'Shopping' },
  { campanha: 'AC Coelho | Search | Tintas e Acabamentos', canal: 'Search' },
  { campanha: 'AC Coelho | Shopping | Ferragens', canal: 'Shopping' },
  { campanha: 'AC Coelho | Display | Remarketing', canal: 'Display' },
]

const GOOGLE_BASE: Record<string, { spend: number; impr: number; clicks: number; conv: number; ligacoes: number; roas: number }> = {
  'Search':   { spend: 3200, impr: 45000,  clicks: 1440, conv: 86,  ligacoes: 22, roas: 7.2 },
  'Shopping': { spend: 4100, impr: 92000,  clicks: 1968, conv: 118, ligacoes: 0,  roas: 9.1 },
  'Display':  { spend: 900,  impr: 185000, clicks: 612,  conv: 12,  ligacoes: 0,  roas: 2.8 },
}

// ─── Meta Ads campaigns ───────────────────────────────────────────────────────
const META_CAMPAIGNS = [
  { campanha: 'AC Coelho | Feed | Promoção da Semana', canal: 'Feed' },
  { campanha: 'AC Coelho | Reels | Obra do Mês', canal: 'Reels' },
  { campanha: 'AC Coelho | Feed | Catálogo Dinâmico', canal: 'Feed' },
  { campanha: 'AC Coelho | Stories | WhatsApp Obras', canal: 'Stories' },
]

const META_BASE: Record<string, { spend: number; alcance: number; impr: number; clicks: number; wpp: number }> = {
  'Feed':    { spend: 2400, alcance: 38000, impr: 72000,  clicks: 1080, wpp: 0  },
  'Reels':   { spend: 1600, alcance: 62000, impr: 98000,  clicks: 980,  wpp: 0  },
  'Stories': { spend: 1100, alcance: 22000, impr: 38000,  clicks: 456,  wpp: 62 },
}

function generateAdRows(): CampaignRow[] {
  const rows: CampaignRow[] = []
  const rand = mkRand(42)

  SEMANAS.forEach((semana, wIdx) => {
    const weekStart = WEEK_STARTS[semana]
    const growthFactor = 1 + wIdx * 0.08
    const days = semana === 'S20/2026' ? 3 : 7

    // Google Ads
    GOOGLE_CAMPAIGNS.forEach((camp, cIdx) => {
      const base = GOOGLE_BASE[camp.canal]
      for (let d = 0; d < days; d++) {
        const jitter = 0.78 + rand() * 0.44
        const weekendDip = d >= 5 ? 0.65 : 1.0

        const dailySpend    = (base.spend / 7) * growthFactor * jitter * weekendDip
        const dailyImpr     = Math.round((base.impr / 7) * growthFactor * jitter * weekendDip)
        const dailyClicks   = Math.round((base.clicks / 7) * growthFactor * jitter * weekendDip)
        const dailyConv     = Math.round((base.conv / 7) * growthFactor * jitter * weekendDip)
        const dailyLig      = Math.round((base.ligacoes / 7) * growthFactor * (0.9 + rand() * 0.2))
        const dailyReceita  = dailySpend * base.roas * (0.9 + rand() * 0.2)

        rows.push({
          id: `g${wIdx}-${cIdx}-${d}`,
          data: addDays(weekStart, d),
          semana,
          source: 'google',
          campanha: camp.campanha,
          canal: camp.canal,
          impressoes: dailyImpr,
          cliques: dailyClicks,
          valorInvestido: Math.round(dailySpend * 100) / 100,
          conversoes: dailyConv,
          receitaAds: Math.round(dailyReceita * 100) / 100,
          ligacoes: dailyLig,
          alcance: 0,
          conversasIniciadas: 0,
        })
      }
    })

    // Meta Ads
    META_CAMPAIGNS.forEach((camp, cIdx) => {
      const base = META_BASE[camp.canal]
      for (let d = 0; d < days; d++) {
        const jitter = 0.80 + rand() * 0.40

        const dailySpend    = (base.spend / 7) * growthFactor * jitter
        const dailyAlcance  = Math.round((base.alcance / 7) * growthFactor * jitter)
        const dailyImpr     = Math.round((base.impr / 7) * growthFactor * jitter)
        const dailyClicks   = Math.round((base.clicks / 7) * growthFactor * jitter)
        const dailyWpp      = base.wpp > 0 ? Math.round((base.wpp / 7) * growthFactor * (0.9 + rand() * 0.2)) : 0

        rows.push({
          id: `m${wIdx}-${cIdx}-${d}`,
          data: addDays(weekStart, d),
          semana,
          source: 'meta',
          campanha: camp.campanha,
          canal: camp.canal,
          impressoes: dailyImpr,
          cliques: dailyClicks,
          valorInvestido: Math.round(dailySpend * 100) / 100,
          conversoes: 0,
          receitaAds: 0,
          ligacoes: 0,
          alcance: dailyAlcance,
          conversasIniciadas: dailyWpp,
        })
      }
    })
  })

  return rows
}

// ─── VTEX rows ─────────────────────────────────────────────────────────────────
function generateVTEXRows(): VTEXRow[] {
  const rows: VTEXRow[] = []
  const rand = mkRand(77)

  const weeklyBase = [
    { receita: 152000, pedidos: 318 },
    { receita: 171000, pedidos: 347 },
    { receita: 189000, pedidos: 382 },
    { receita: 207000, pedidos: 415 },
    { receita: 76000,  pedidos: 152 }, // partial (3 days)
  ]

  SEMANAS.forEach((semana, wIdx) => {
    const weekStart = WEEK_STARTS[semana]
    const days = semana === 'S20/2026' ? 3 : 7
    const base = weeklyBase[wIdx]

    for (let d = 0; d < days; d++) {
      const jitter = 0.75 + rand() * 0.50
      const weekendBoost = d >= 5 ? 1.35 : 1.0

      const dailyReceita  = (base.receita / 7) * jitter * weekendBoost
      const dailyPedidos  = Math.max(1, Math.round((base.pedidos / 7) * jitter * weekendBoost))
      const dailyTicket   = dailyReceita / dailyPedidos
      const dailyProdutos = Math.round(dailyPedidos * (2.1 + rand() * 0.8))
      const novosRatio    = 0.35 + rand() * 0.15
      const dailyNovos    = Math.round(dailyPedidos * novosRatio)

      rows.push({
        data: addDays(weekStart, d),
        semana,
        receita: Math.round(dailyReceita * 100) / 100,
        pedidos: dailyPedidos,
        ticketMedio: Math.round(dailyTicket * 100) / 100,
        produtosVendidos: dailyProdutos,
        novosClientes: dailyNovos,
        clientesRecorrentes: dailyPedidos - dailyNovos,
      })
    }
  })

  return rows
}

// ─── GA4 rows ─────────────────────────────────────────────────────────────────
function generateGA4Rows(): GA4Row[] {
  const rows: GA4Row[] = []
  const rand = mkRand(99)

  const weeklyBase = [
    { sessoes: 28400, usuarios: 22100 },
    { sessoes: 31200, usuarios: 24300 },
    { sessoes: 34500, usuarios: 26900 },
    { sessoes: 37800, usuarios: 29400 },
    { sessoes: 14100, usuarios: 11000 }, // partial
  ]

  SEMANAS.forEach((semana, wIdx) => {
    const weekStart = WEEK_STARTS[semana]
    const days = semana === 'S20/2026' ? 3 : 7
    const base = weeklyBase[wIdx]

    for (let d = 0; d < days; d++) {
      const jitter = 0.80 + rand() * 0.40

      const dailySessoes  = Math.round((base.sessoes / 7) * jitter)
      const dailyUsuarios = Math.round((base.usuarios / 7) * jitter)
      const engRate       = 62 + rand() * 18
      const addRate       = 0.082 + rand() * 0.028
      const checkoutRate  = 0.38 + rand() * 0.14
      const convRate      = 0.72 + rand() * 0.18

      const dailyAdd      = Math.round(dailySessoes * addRate)
      const dailyCheckout = Math.round(dailyAdd * checkoutRate)
      const dailyConv     = Math.round(dailyCheckout * convRate)

      rows.push({
        data: addDays(weekStart, d),
        semana,
        usuarios: dailyUsuarios,
        sessoes: dailySessoes,
        taxaEngajamento: Math.round(engRate * 10) / 10,
        addToCart: dailyAdd,
        checkout: dailyCheckout,
        conversao: dailyConv,
      })
    }
  })

  return rows
}

// ─── Export ───────────────────────────────────────────────────────────────────
let _mockCache: DashboardData | null = null

export function getMockData(): DashboardData {
  if (_mockCache) return _mockCache
  _mockCache = {
    rows: generateAdRows(),
    vtex: generateVTEXRows(),
    ga4: generateGA4Rows(),
  }
  return _mockCache
}
