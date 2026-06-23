import type { CampaignRow, DashboardData, SheetsHealth, SheetTabStatus } from '@/types'
import { dateToSemana } from '@/lib/period'

// URL fixa da planilha AC Coelho — usada caso SHEETS_MASTER_URL não esteja
// configurada no ambiente (permite funcionar sem depender de env vars na Vercel).
const DEFAULT_MASTER_URL = 'https://docs.google.com/spreadsheets/d/1sVnBbrfCtILliCAgpfWpLGaEY1F5U7eP2qO8OUj35hM/edit?usp=sharing'

// VTEX e GA4 ainda não foram conectadas — apenas Google_Ads e Meta_Ads por enquanto.
const TAB_NAMES = {
  googleAds: 'Google_Ads',
  metaAds: 'Meta_Ads',
} as const

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

// Accepts "YYYY-MM-DD" or "DD/MM/YYYY" (common when Sheets exports a Date-formatted column)
function normalizeDate(raw: string): string | null {
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (br) {
    const [, d, m, y] = br
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

function parseHeaders(headerLine: string): string[] {
  return parseCSVLine(headerLine).map((h) => h.replace(/^﻿/, '').toLowerCase().trim())
}

function findCol(headers: string[], name: string): number {
  return headers.indexOf(name)
}

// ─── Sheet ID + per-tab CSV URL ────────────────────────────────────────────────
function extractSheetId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) return url.trim()
  return null
}

function getMasterUrl(): string {
  return process.env.SHEETS_MASTER_URL || DEFAULT_MASTER_URL
}

function buildTabUrl(sheetId: string, tabName: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
}

async function fetchTabCSV(sheetId: string, tabName: string): Promise<{ csv: string | null; error: string | null }> {
  try {
    const res = await fetch(buildTabUrl(sheetId, tabName), { redirect: 'follow', cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) {
      return {
        csv: null,
        error: `HTTP ${res.status} — verifique se a aba "${tabName}" existe (nome exato) e se a planilha está compartilhada como "Qualquer pessoa com o link pode visualizar"`,
      }
    }
    if (text.trimStart().startsWith('<')) {
      return { csv: null, error: `Resposta inesperada (HTML) para a aba "${tabName}" — verifique as permissões de compartilhamento da planilha` }
    }
    return { csv: text, error: null }
  } catch (e) {
    return { csv: null, error: e instanceof Error ? e.message : 'Erro de rede ao buscar a aba' }
  }
}

// ─── Parsers (colunas reais da planilha AC Coelho) ────────────────────────────

// Google_Ads: Date | Campaign | Impressions | Clicks | Cost | Conversions | ConversionValue
function parseGoogleAds(csv: string): CampaignRow[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseHeaders(lines[0])
  const iDate    = findCol(headers, 'date')
  const iCamp    = findCol(headers, 'campaign')
  const iImpr    = findCol(headers, 'impressions')
  const iClicks  = findCol(headers, 'clicks')
  const iCost    = findCol(headers, 'cost')
  const iConv    = findCol(headers, 'conversions')
  const iConvVal = findCol(headers, 'conversionvalue')
  if (iDate === -1) return []

  const rows: CampaignRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = parseCSVLine(line)
    const dateStr = normalizeDate(c[iDate] ?? '')
    if (!dateStr) continue
    rows.push({
      id: `g${i}`,
      data: dateStr,
      semana: dateToSemana(dateStr),
      source: 'google',
      canal: 'Google Ads',
      campanha: iCamp >= 0 ? (c[iCamp]?.trim() ?? '') : '',
      impressoes: iImpr >= 0 ? parseNum(c[iImpr] ?? '') : 0,
      cliques: iClicks >= 0 ? parseNum(c[iClicks] ?? '') : 0,
      valorInvestido: iCost >= 0 ? parseNum(c[iCost] ?? '') : 0,
      conversoes: iConv >= 0 ? parseNum(c[iConv] ?? '') : 0,
      receitaAds: iConvVal >= 0 ? parseNum(c[iConvVal] ?? '') : 0,
      ligacoes: 0,
      alcance: 0,
      conversasIniciadas: 0,
    })
  }
  return rows
}

// Meta_Ads: Day | Campaign Name | Reach | Impressions | Link Clicks | Messaging Conversations Started | Amount Spent
function parseMetaAds(csv: string): CampaignRow[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseHeaders(lines[0])
  const iDay    = findCol(headers, 'day')
  const iCamp   = findCol(headers, 'campaign name')
  const iReach  = findCol(headers, 'reach')
  const iImpr   = findCol(headers, 'impressions')
  const iClicks = findCol(headers, 'link clicks')
  const iMsgs   = findCol(headers, 'messaging conversations started')
  const iSpend  = findCol(headers, 'amount spent')
  if (iDay === -1) return []

  const rows: CampaignRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = parseCSVLine(line)
    const dateStr = normalizeDate(c[iDay] ?? '')
    if (!dateStr) continue
    const campanha = iCamp >= 0 ? (c[iCamp]?.trim() ?? '') : ''
    const canal = /stories/i.test(campanha) ? 'Stories' : /reels/i.test(campanha) ? 'Reels' : 'Feed'
    rows.push({
      id: `m${i}`,
      data: dateStr,
      semana: dateToSemana(dateStr),
      source: 'meta',
      canal,
      campanha,
      impressoes: iImpr >= 0 ? parseNum(c[iImpr] ?? '') : 0,
      alcance: iReach >= 0 ? parseNum(c[iReach] ?? '') : 0,
      cliques: iClicks >= 0 ? parseNum(c[iClicks] ?? '') : 0,
      valorInvestido: iSpend >= 0 ? parseNum(c[iSpend] ?? '') : 0,
      conversasIniciadas: iMsgs >= 0 ? parseNum(c[iMsgs] ?? '') : 0,
      conversoes: 0,
      receitaAds: 0,
      ligacoes: 0,
    })
  }
  return rows
}

function lastDateOf(rows: { data: string }[]): string | null {
  if (rows.length === 0) return null
  return rows.reduce((max, r) => (r.data > max ? r.data : max), rows[0].data)
}

// ─── Main export — usado pelo /api/data ────────────────────────────────────────
// VTEX e GA4 ainda não estão conectadas: o dashboard funciona só com Google_Ads + Meta_Ads.
export async function fetchFromSheets(): Promise<DashboardData> {
  const masterUrl = getMasterUrl()
  const sheetId = extractSheetId(masterUrl)
  if (!sheetId) {
    throw new Error('SHEETS_MASTER_URL inválida — não foi possível extrair o ID da planilha a partir da URL configurada.')
  }

  const [googleRes, metaRes] = await Promise.all([
    fetchTabCSV(sheetId, TAB_NAMES.googleAds),
    fetchTabCSV(sheetId, TAB_NAMES.metaAds),
  ])

  if (googleRes.error) console.warn(`[sheets] ${TAB_NAMES.googleAds}: ${googleRes.error}`)
  if (metaRes.error) console.warn(`[sheets] ${TAB_NAMES.metaAds}: ${metaRes.error}`)

  const rows: CampaignRow[] = [
    ...(googleRes.csv ? parseGoogleAds(googleRes.csv) : []),
    ...(metaRes.csv ? parseMetaAds(metaRes.csv) : []),
  ]

  return { rows, vtex: [], ga4: [] }
}

// ─── Diagnostics — usado por /admin/data-check ─────────────────────────────────
export async function getSheetsHealth(): Promise<SheetsHealth> {
  const masterUrl = getMasterUrl()
  const usingDefault = !process.env.SHEETS_MASTER_URL

  const sheetId = extractSheetId(masterUrl)
  if (!sheetId) {
    return {
      masterUrlConfigured: !usingDefault,
      sheetId: null,
      tabs: Object.values(TAB_NAMES).map((tab) => ({
        tab, found: false, count: 0, lastDate: null,
        error: 'Não foi possível extrair o ID da planilha a partir da URL configurada',
      })),
    }
  }

  async function checkTab(tabName: string, parse: (csv: string) => { data: string }[]): Promise<SheetTabStatus> {
    const { csv, error } = await fetchTabCSV(sheetId!, tabName)
    if (error || !csv) {
      return { tab: tabName, found: false, count: 0, lastDate: null, error: error ?? 'Sem dados' }
    }
    const parsed = parse(csv)
    return {
      tab: tabName,
      found: true,
      count: parsed.length,
      lastDate: lastDateOf(parsed),
      error: parsed.length === 0 ? 'Aba encontrada, mas nenhuma linha válida foi reconhecida — verifique o formato das colunas' : null,
    }
  }

  const tabs = await Promise.all([
    checkTab(TAB_NAMES.googleAds, parseGoogleAds),
    checkTab(TAB_NAMES.metaAds, parseMetaAds),
  ])

  return { masterUrlConfigured: !usingDefault, sheetId, tabs }
}
