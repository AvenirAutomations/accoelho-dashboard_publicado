import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const BLIP_AUTH_KEY = process.env.BLIP_AUTH_KEY
const COMMANDS_URL = 'https://accoelhoprincipal.http.msging.net/commands'

async function blipCommand<T>(uri: string): Promise<T> {
  const res = await fetch(COMMANDS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: BLIP_AUTH_KEY!,
    },
    body: JSON.stringify({
      id: randomUUID(),
      to: 'postmaster@desk.msging.net',
      method: 'get',
      uri,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Blip HTTP ${res.status} para ${uri}`)
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(`Blip erro para ${uri}: ${JSON.stringify(json.reason)}`)
  }
  return json.resource as T
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  if (!BLIP_AUTH_KEY) {
    return NextResponse.json({ error: 'BLIP_AUTH_KEY não configurada' }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const beginDate = searchParams.get('beginDate') ?? toISO(firstDay)
    const endDate = searchParams.get('endDate') ?? toISO(today)

    const [countersResult, metricsResult, dailyResult, timingsResult, attendantsResult, trackingResult] =
      await Promise.allSettled([
        blipCommand<Record<string, number>>('/monitoring/tickets?version=2'),
        blipCommand<Record<string, string>>('/monitoring/tickets-metrics?version=2'),
        blipCommand<{ items: Record<string, unknown>[] }>(
          `/analytics/reports/tickets?beginDate=${beginDate}&endDate=${endDate}`
        ),
        blipCommand<Record<string, string>>(
          `/analytics/reports/timings?beginDate=${beginDate}&endDate=${endDate}`
        ),
        blipCommand<{ items: Record<string, unknown>[] }>(
          `/analytics/reports/attendants?beginDate=${beginDate}&endDate=${endDate}`
        ),
        blipCommand<{ items: Record<string, unknown>[] }>(
          `/analytics/reports/tracking?beginDate=${beginDate}&endDate=${endDate}`
        ),
      ])

    const c = countersResult.status === 'fulfilled' ? countersResult.value : {}
    const m = metricsResult.status === 'fulfilled' ? metricsResult.value : {}
    const t = timingsResult.status === 'fulfilled' ? timingsResult.value : {}
    const items = dailyResult.status === 'fulfilled' ? (dailyResult.value?.items ?? []) : []
    const attItems =
      attendantsResult.status === 'fulfilled' ? (attendantsResult.value?.items ?? []) : []
    const trackItems =
      trackingResult.status === 'fulfilled' ? (trackingResult.value?.items ?? []) : []

    const dailySeries = items.map((item) => {
      const date = String(item.date ?? '').slice(0, 10)
      const [, month, day] = date.split('-')
      return {
        date: day && month ? `${day}/${month}` : date,
        iniciadas:
          Number(item.waiting ?? 0) +
          Number(item.open ?? 0) +
          Number(item.closed ?? 0) +
          Number(item.transferred ?? 0) +
          Number(item.missed ?? 0),
        finalizadas: Number(item.closed ?? 0),
        perdidos: Number(item.missed ?? 0),
      }
    })

    const attendants = attItems
      .map((a) => ({
        nome: String(a.name ?? a.agentName ?? a.identity ?? 'Atendente'),
        tickets: Number(
          a.closedTickets ?? a.closed ?? a.attendances ?? a.ticketsClosed ?? 0
        ),
      }))
      .filter((a) => a.tickets > 0)
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10)

    const adTracking = trackItems
      .map((item) => ({
        nome: String(
          item.campaignName ?? item.adName ?? item.name ?? item.source ?? item.label ?? 'Sem nome'
        ),
        conversas: Number(item.count ?? item.total ?? item.contacts ?? item.conversations ?? 0),
      }))
      .filter((item) => item.conversas > 0)
      .sort((a, b) => b.conversas - a.conversas)
      .slice(0, 15)

    // Log raw tracking items server-side so we can inspect the real field names on first deploy
    if (trackItems.length > 0) {
      console.log('[blip/tracking] sample item keys:', Object.keys(trackItems[0]))
    } else if (trackingResult.status === 'rejected') {
      console.log('[blip/tracking] endpoint error:', (trackingResult.reason as Error)?.message)
    }

    return NextResponse.json({
      kpis: {
        emAberto: Number(c.open ?? 0),
        aguardando: Number(c.waiting ?? 0),
        finalizadasHoje: Number(c.closed ?? 0),
        perdidos: Number(c.missed ?? 0),
        tempoMedioAtendimento: String(m.avgAttendanceTime ?? t.avgAttendanceTime ?? '—'),
        tempoEspera: String(t.avgQueueTime ?? '—'),
        tempoPrimeiraResposta: String(
          t.avgFirstResponseTime ?? t.avgResponseTime ?? '—'
        ),
      },
      dailySeries,
      attendants,
      adTracking,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[/api/blip]', message)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
