import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const META_TOKEN = process.env.META_ACCESS_TOKEN
const AD_ACCOUNT_ID = '513586913025981'
const BASE = 'https://graph.facebook.com/v20.0'

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

export async function GET() {
  if (!META_TOKEN) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN não configurada' }, { status: 503 })
  }

  try {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const since = toISO(firstDay)
    const until = toISO(today)

    // Fetch top ads with insights + creative thumbnail
    const fields = [
      'id',
      'name',
      'creative{id,name,thumbnail_url,image_url,body,title}',
      'insights.date_preset(this_month){spend,impressions,clicks,ctr,cpm,reach}',
    ].join(',')

    const url = `${BASE}/act_${AD_ACCOUNT_ID}/ads?fields=${encodeURIComponent(fields)}&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}&limit=50&access_token=${META_TOKEN}`

    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()

    if (!res.ok || json.error) {
      throw new Error(json.error?.message ?? `HTTP ${res.status}`)
    }

    const ads = (json.data ?? []) as Record<string, unknown>[]

    const parsed = ads
      .map((ad) => {
        const insights = (ad.insights as { data?: Record<string, string>[] } | undefined)?.data?.[0]
        if (!insights) return null
        const creative = ad.creative as Record<string, string> | undefined
        return {
          id: String(ad.id ?? ''),
          nome: String(ad.name ?? ''),
          thumbnail: String(creative?.thumbnail_url ?? creative?.image_url ?? ''),
          criativo: String(creative?.name ?? creative?.title ?? ''),
          spend: parseFloat(insights.spend ?? '0'),
          impressoes: parseInt(insights.impressions ?? '0', 10),
          cliques: parseInt(insights.clicks ?? '0', 10),
          ctr: parseFloat(insights.ctr ?? '0'),
          cpm: parseFloat(insights.cpm ?? '0'),
          alcance: parseInt(insights.reach ?? '0', 10),
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b!.spend - a!.spend))
      .slice(0, 10)

    return NextResponse.json({ ads: parsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[/api/meta-creatives]', message)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
