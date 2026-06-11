import { NextResponse } from 'next/server'
import { fetchFromSheets } from '@/lib/sheets'
import type { DashboardData } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data: DashboardData = await fetchFromSheets()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[/api/data]', message)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
