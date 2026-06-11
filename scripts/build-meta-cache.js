#!/usr/bin/env node
// Parses fresh MCP data and merges with existing cache.
// Usage: node scripts/build-meta-cache.js <mcp-data-file>
const fs = require('fs')
const path = require('path')

const mcpFile = process.argv[2]
if (!mcpFile) { console.error('Usage: node build-meta-cache.js <mcp-data-file>'); process.exit(1) }

// ── Helpers ──────────────────────────────────────────────────────────────────
const PT_MONTHS = {
  janeiro:1, fevereiro:2, marco:3, março:3, abril:4, maio:5, junho:6,
  julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12,
}

function normalizePt(s) {
  return s
    .replace(/[çÇ]/g, 'c')
    .replace(/[ãâàáäÃÂÀÁÄ]/g, 'a')
    .replace(/[êéèëÊÉÈË]/g, 'e')
    .replace(/[îíìïÎÍÌÏ]/g, 'i')
    .replace(/[ôóòõöÔÓÒÕÖ]/g, 'o')
    .replace(/[ûúùüÛÚÙÜ]/g, 'u')
}

function parsePtDate(s) {
  const m = s.match(/(\d+)\s+de\s+(\p{L}+)\s+de\s+(\d{4})/iu)
  if (!m) return null
  const month = PT_MONTHS[normalizePt(m[2].toLowerCase())]
  if (!month) return null
  return `${m[3]}-${String(month).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`
}

function parseBRL(s) {
  // "71,92 R$ (BRL)" or "71,92 R$ (BRL)"
  const m = s.match(/([\d\s.,]+)/)
  if (!m) return 0
  const clean = m[1].trim().replace(/\s/g,'').replace(/\./g,'').replace(',','.')
  return parseFloat(clean) || 0
}

function parseIntVal(s) {
  // "10 827" (with non-breaking space), "6381"
  return parseInt(s.replace(/\s/g,'').replace(/ /g,''), 10) || 0
}

function dateToSemana(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number)
  if (!y||!m||!d) return `S?/${new Date().getFullYear()}`
  const date = new Date(Date.UTC(y,m-1,d))
  const dow = date.getUTCDay()||7
  const thursday = new Date(date)
  thursday.setUTCDate(date.getUTCDate()+4-dow)
  const isoYear = thursday.getUTCFullYear()
  const jan4 = new Date(Date.UTC(isoYear,0,4))
  const dow4 = jan4.getUTCDay()||7
  const mondayW1 = new Date(jan4)
  mondayW1.setUTCDate(jan4.getUTCDate()-dow4+1)
  const weekNum = Math.floor((thursday.getTime()-mondayW1.getTime())/(7*86400000))+1
  return `S${weekNum}/${isoYear}`
}

// ── Parse campaign name → estado, canal ──────────────────────────────────────
function parseCampaign(name) {
  const m = name.match(/\[EnsinoTecnico\]\[(\w+)\]/i)
  const estado = m ? m[1].toUpperCase() : 'RJ'
  const canal = name.includes('WhatsApp') ? 'Meta Ads - WhatsApp' : 'Meta Ads'
  return { estado, canal }
}

// ── Parse fresh MCP rows ──────────────────────────────────────────────────────
const rawFile = fs.readFileSync(mcpFile, 'utf-8').replace(/^﻿/,'')
const wrapper = JSON.parse(rawFile)
const entities = JSON.parse(wrapper.ad_entities)

const freshRows = []
for (let i = 0; i < entities.length; i++) {
  const e = entities[i]
  // Skip rows where all metrics are unavailable (e.g. test/inactive campaigns)
  if (!e.date_start || e.date_start === 'Not available' || e.impressions === 'Not available') continue
  const dateStr = parsePtDate(e.date_start)
  if (!dateStr) { console.warn('Skipping unrecognized date:', e.date_start); continue }
  const { estado, canal } = parseCampaign(e.name)
  freshRows.push({
    id: `meta_${dateStr}_${e.id}_${i}`,
    data: dateStr,
    semana: dateToSemana(dateStr),
    produto: 'Ensino Técnico',
    estado,
    canal,
    campanha: e.name,
    curso: '',
    impressoes: parseIntVal(e.impressions ?? '0'),
    alcance: parseIntVal(e.reach ?? '0'),
    cliques: 0,
    valorInvestido: parseBRL(e.amount_spent ?? '0'),
    conversoes: 0,
    mensagensIniciadas: 0,
    conversasWhatsapp: 0,
    leads: 0,
    inscricoes: 0,
    pagos: 0,
    matriculas: 0,
  })
}

console.log(`Parsed ${freshRows.length} rows from MCP data`)

// ── Determine coverage window from fresh data ─────────────────────────────────
const freshDates = new Set(freshRows.map(r => r.data))
const freshMin = [...freshDates].sort()[0]
console.log(`Fresh data coverage: ${freshMin} → ${[...freshDates].sort().slice(-1)[0]}`)

// ── Load existing cache and keep rows BEFORE the fresh window ─────────────────
const cachePath = path.join(__dirname, '..', 'data', 'meta-ads-cache.json')
let olderRows = []
if (fs.existsSync(cachePath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(cachePath, 'utf-8').replace(/^﻿/,''))
    olderRows = (existing.rows ?? []).filter(r => r.data < freshMin).map(r => {
      // Normalize canal for WhatsApp campaigns
      const canal = r.campanha && r.campanha.includes('WhatsApp') ? 'Meta Ads - WhatsApp' : r.canal
      return { ...r, canal, leads: r.leads ?? 0 }
    })
    console.log(`Kept ${olderRows.length} historical rows from existing cache (before ${freshMin})`)
  } catch (e) {
    console.warn('Could not parse existing cache, starting fresh:', e.message)
  }
}

// ── Merge and sort ────────────────────────────────────────────────────────────
const allRows = [...olderRows, ...freshRows].sort((a,b) => a.data.localeCompare(b.data))
console.log(`Total merged rows: ${allRows.length}`)

// ── Write new cache ───────────────────────────────────────────────────────────
const cache = { fetchedAt: new Date().toISOString(), rows: allRows }
const outDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8')
console.log(`Written to ${cachePath}`)
console.log(`Date range: ${allRows[0]?.data} → ${allRows[allRows.length-1]?.data}`)
