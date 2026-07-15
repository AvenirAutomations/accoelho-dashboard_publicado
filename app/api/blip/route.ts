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

    const [countersResult, metricsResult, dailyResult] = await Promise.allSettled([
      blipCommand<Record<string, number>>('/monitoring/tickets?version=2'),
      blipCommand<Record<string, string>>('/monitoring/tickets-metrics?version=2'),
      blipCommand<{ items: Record<string, unknown>[] }>(
        `/analytics/reports/tickets?beginDate=${beginDate}&endDate=${endDate}`
      ),
    ])

    const c = countersResult.status === 'fulfilled' ? countersResult.value : {}
    const m = metricsResult.status === 'fulfilled' ? metricsResult.value : {}
    const items = dailyResult.status === 'fulfilled' ? (dailyResult.value?.items ?? []) : []

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
      }
    })

    return NextResponse.json({
      kpis: {
        emAberto: Number(c.open ?? 0),
        aguardando: Number(c.waiting ?? 0),
        finalizadasHoje: Number(c.closed ?? 0),
        tempoMedioHoje: String(m.avgAttendanceTime ?? '—'),
      },
      dailySeries,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[/api/blip]', message)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
