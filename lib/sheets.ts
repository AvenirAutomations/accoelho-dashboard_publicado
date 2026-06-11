import type { CampaignRow, VTEXRow, GA4Row, DashboardData } from '@/types'
import { getMockData } from '@/lib/mock-data'

// ─── CSV parsing ──────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === ',' && !inQ) {
      result.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

function parseNum(raw: string): number {
  const s = raw.trim()
  if (!s) return 0
  if (s.includes('.') && s.includes(',')) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  }
  if (s.includes(',')) return parseFloat(s.replace(',', '.')) || 0
  return parseFloat(s) || 0
}

function dateToSemana(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return `S?/${new Date().getFullYear()}`
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = date.getUTCDay() || 7
  const thursday = new Date(date)
  thursday.setUTCDate(date.getUTCDate() + 4 - dow)
  const isoYear = thursday.getUTCFullYear()
  const jan4 = new Date(Date.UTC(isoYear, 0, 4))
  const dow4 = jan4.getUTCDay() || 7
  const mondayW1 = new Date(jan4)
  mondayW1.setUTCDate(jan4.getUTCDate() - dow4 + 1)
  const weekNum = Math.floor((thursday.getTime() - mondayW1.getTime()) / (7 * 86400000)) + 1
  return `S${weekNum}/${isoYear}`
}

async function fetchCSV(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: 'follow', cache: 'no-store' })
    if (!res.ok) return null
    const text = await res.text()
    if (text.trimStart().startsWith('<')) return null
    return text
  } catch {
    return null
  }
}

// ─── Google Ads parser ─────────────────────────────────────────────────────────
// Expected cols: Date(0) Week(1) Channel(2) Campaign(3) Impressions(4) Clicks(5)
//                Cost(6) Conversions(7) Revenue(8) Calls(9)
function parseGoogleAds(csv: string): CampaignRow[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const rows: CampaignRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = parseCSVLine(line)
    if (c.length < 8) continue
    const dateStr = c[0].trim()
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    rows.push({
      id: `g${i}`,
      data: dateStr,
      semana: dateToSemana(dateStr),
      source: 'google',
      canal: c[2].trim() || 'Search',
      campanha: c[3].trim(),
      impressoes: parseNum(c[4] ?? ''),
      cliques: parseNum(c[5] ?? ''),
      valorInvestido: parseNum(c[6] ?? ''),
      conversoes: parseNum(c[7] ?? ''),
      receitaAds: parseNum(c[8] ?? ''),
      ligacoes: parseNum(c[9] ?? ''),
      alcance: 0,
      conversasIniciadas: 0,
    })
  }
  return rows
}

// ─── Meta Ads parser ───────────────────────────────────────────────────────────
// Meta Ads Manager export — auto-detects column order from header
function parseMetaAds(csv: string): CampaignRow[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/[""]/g, ''))
  const col = (name: string) => {
    const exact = headers.findIndex(h => h === name)
    return exact !== -1 ? exact : headers.findIndex(h => h.includes(name))
  }
  const iDay   = col('day')
  const iName  = col('campaign name')
  const iImpr  = col('impressions')
  const iReach = col('reach')
  const iClick = col('clicks')
  const iSpend = col('amount spent')
  const iMsgs  = col('messaging conversations started')
  if (iDay === -1 || iName === -1) return []
  const rows: CampaignRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = parseCSVLine(line)
    const dateStr = c[iDay]?.trim()
    if (!dateStr?.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    const campanha = c[iName]?.trim() ?? ''
    const canal = /stories/i.test(campanha) ? 'Stories'
      : /reels/i.test(campanha) ? 'Reels'
      : 'Feed'
    rows.push({
      id: `m${i}`,
      data: dateStr,
      semana: dateToSemana(dateStr),
      source: 'meta',
      campanha,
      canal,
      impressoes:          iImpr  >= 0 ? parseNum(c[iImpr]  ?? '') : 0,
      cliques:             iClick >= 0 ? parseNum(c[iClick] ?? '') : 0,
      valorInvestido:      iSpend >= 0 ? parseNum(c[iSpend] ?? '') : 0,
      alcance:             iReach >= 0 ? parseNum(c[iReach] ?? '') : 0,
      conversasIniciadas:  iMsgs  >= 0 ? parseNum(c[iMsgs]  ?? '') : 0,
      conversoes: 0,
      receitaAds: 0,
      ligacoes: 0,
    })
  }
  return rows
}

// ─── VTEX parser ───────────────────────────────────────────────────────────────
// Expected cols: Date(0) Revenue(1) Orders(2) AvgTicket(3) Products(4) NewCustomers(5) ReturningCustomers(6)
function parseVTEX(csv: string): VTEXRow[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const rows: VTEXRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = parseCSVLine(line)
    if (c.length < 5) continue
    const dateStr = c[0].trim()
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    const pedidos = parseNum(c[2] ?? '')
    rows.push({
      data: dateStr,
      semana: dateToSemana(dateStr),
      receita: parseNum(c[1] ?? ''),
      pedidos,
      ticketMedio: parseNum(c[3] ?? ''),
      produtosVendidos: parseNum(c[4] ?? ''),
      novosClientes: parseNum(c[5] ?? ''),
      clientesRecorrentes: parseNum(c[6] ?? ''),
    })
  }
  return rows
}

// ─── GA4 parser ────────────────────────────────────────────────────────────────
// Expected cols: Date(0) Users(1) Sessions(2) EngagementRate(3) AddToCart(4) Checkout(5) Purchases(6)
function parseGA4(csv: string): GA4Row[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const rows: GA4Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = parseCSVLine(line)
    if (c.length < 6) continue
    const dateStr = c[0].trim()
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    rows.push({
      data: dateStr,
      semana: dateToSemana(dateStr),
      usuarios: parseNum(c[1] ?? ''),
      sessoes: parseNum(c[2] ?? ''),
      taxaEngajamento: parseNum(c[3] ?? ''),
      addToCart: parseNum(c[4] ?? ''),
      checkout: parseNum(c[5] ?? ''),
      conversao: parseNum(c[6] ?? ''),
    })
  }
  return rows
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function fetchFromSheets(): Promise<DashboardData> {
  const rows: CampaignRow[] = []
  const vtex: VTEXRow[] = []
  const ga4: GA4Row[] = []
  let hasAnyData = false

  // Google Ads
  const googleUrl = process.env.SHEETS_GOOGLE_ADS_URL
  if (googleUrl) {
    const csv = await fetchCSV(googleUrl)
    if (csv) {
      const parsed = parseGoogleAds(csv)
      rows.push(...parsed)
      if (parsed.length > 0) hasAnyData = true
      console.log(`[Google Ads] ${parsed.length} linhas`)
    } else {
      console.warn('[sheets] Google Ads CSV inacessível')
    }
  }

  // Meta Ads
  const metaUrl = process.env.SHEETS_META_ADS_URL
  if (metaUrl) {
    const csv = await fetchCSV(metaUrl)
    if (csv) {
      const parsed = parseMetaAds(csv)
      rows.push(...parsed)
      if (parsed.length > 0) hasAnyData = true
      console.log(`[Meta Ads] ${parsed.length} linhas`)
    } else {
      console.warn('[sheets] Meta Ads CSV inacessível')
    }
  }

  // VTEX
  const vtexUrl = process.env.SHEETS_VTEX_URL
  if (vtexUrl) {
    const csv = await fetchCSV(vtexUrl)
    if (csv) {
      const parsed = parseVTEX(csv)
      vtex.push(...parsed)
      if (parsed.length > 0) hasAnyData = true
      console.log(`[VTEX] ${parsed.length} linhas`)
    } else {
      console.warn('[sheets] VTEX CSV inacessível')
    }
  }

  // GA4
  const ga4Url = process.env.SHEETS_GA4_URL
  if (ga4Url) {
    const csv = await fetchCSV(ga4Url)
    if (csv) {
      const parsed = parseGA4(csv)
      ga4.push(...parsed)
      if (parsed.length > 0) hasAnyData = true
      console.log(`[GA4] ${parsed.length} linhas`)
    } else {
      console.warn('[sheets] GA4 CSV inacessível')
    }
  }

  // Fall back to mock data when no sheets are configured
  if (!hasAnyData) {
    console.log('[sheets] Nenhuma planilha configurada — usando dados de demonstração')
    return getMockData()
  }

  return { rows, vtex, ga4 }
}
