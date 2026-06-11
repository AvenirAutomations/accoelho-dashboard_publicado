import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ExecutiveMetrics, ChannelMetrics, AutoAnalysis } from '@/types'
import { formatCurrency, formatPercent, formatNumber, formatRoas } from '@/lib/metrics'

export interface AnalysisRequest {
  semana: string
  current: ExecutiveMetrics
  previous: ExecutiveMetrics | null
  channels: ChannelMetrics[]
}

function buildPrompt(req: AnalysisRequest): string {
  const { semana, current, previous, channels } = req

  const pct = (cur: number, prev: number) => {
    if (!prev) return 'sem dado anterior'
    const v = ((cur - prev) / prev) * 100
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
  }

  const lines: string[] = []

  lines.push(`Você é um especialista sênior em e-commerce e performance de mídia paga.`)
  lines.push(`Analise os dados abaixo e gere uma análise profissional, executiva e objetiva em português brasileiro.`)
  lines.push(``)
  lines.push(`## Contexto`)
  lines.push(`Empresa: AC Coelho — Materiais de Construção`)
  lines.push(`Semana analisada: ${semana}`)
  lines.push(``)
  lines.push(`## Resultados${previous ? ' (vs semana anterior)' : ''}`)
  lines.push(`- Receita Total: ${formatCurrency(current.receitaTotal)}${previous ? ` (${pct(current.receitaTotal, previous.receitaTotal)})` : ''}`)
  lines.push(`- Pedidos: ${formatNumber(current.pedidos)}${previous ? ` (${pct(current.pedidos, previous.pedidos)})` : ''}`)
  lines.push(`- Ticket Médio: ${formatCurrency(current.ticketMedio)}${previous ? ` (${pct(current.ticketMedio, previous.ticketMedio)})` : ''}`)
  lines.push(`- ROAS Geral: ${formatRoas(current.roasGeral)}${previous ? ` (${pct(current.roasGeral, previous.roasGeral)})` : ''}`)
  lines.push(`- Investimento Total: ${formatCurrency(current.investimentoTotal)}${previous ? ` (${pct(current.investimentoTotal, previous.investimentoTotal)})` : ''}`)
  lines.push(`- Leads WhatsApp: ${formatNumber(current.leadsWhatsapp)}${previous ? ` (${pct(current.leadsWhatsapp, previous.leadsWhatsapp)})` : ''}`)
  lines.push(`- Ligações para Lojas: ${formatNumber(current.ligacoesLojas)}${previous ? ` (${pct(current.ligacoesLojas, previous.ligacoesLojas)})` : ''}`)

  if (channels.length > 0) {
    lines.push(``)
    lines.push(`## Desempenho por canal`)
    for (const ch of channels) {
      lines.push(`- ${ch.canal}: ${formatNumber(ch.cliques)} cliques, investido ${formatCurrency(ch.valorInvestido)}, CTR ${formatPercent(ch.ctr)}, CPC ${formatCurrency(ch.cpc)}`)
    }
  }

  lines.push(``)
  lines.push(`## Instruções de resposta`)
  lines.push(`Responda SOMENTE com um objeto JSON válido, sem markdown, sem explicações extras:`)
  lines.push(`{`)
  lines.push(`  "summary": "Resumo executivo em 2-3 frases.",`)
  lines.push(`  "insights": [`)
  lines.push(`    { "type": "positive|negative|warning|neutral", "title": "Título curto", "description": "Descrição em 1-2 frases." }`)
  lines.push(`  ],`)
  lines.push(`  "recommendations": ["Recomendação 1.", "Recomendação 2.", "Recomendação 3."]`)
  lines.push(`}`)
  lines.push(`Gere entre 3 e 6 insights e 2 a 4 recomendações. Seja direto, estratégico e use os números reais.`)

  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY não configurada.' }, { status: 503 })
  }

  let body: AnalysisRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

    const result = await model.generateContent(buildPrompt(body))
    const text = result.response.text().trim()
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    const analysis: AutoAnalysis = JSON.parse(cleaned)
    return NextResponse.json(analysis)
  } catch (err) {
    console.error('[Gemini analysis error]', err)
    return NextResponse.json({ error: 'Falha ao gerar análise com Gemini.' }, { status: 500 })
  }
}
