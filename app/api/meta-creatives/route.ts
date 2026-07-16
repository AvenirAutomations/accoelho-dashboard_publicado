import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const META_TOKEN = process.env.META_ACCESS_TOKEN
const AD_ACCOUNT_ID = '513586913025981'
const BASE = 'https://graph.facebook.com/v20.0'

export async function GET() {
  if (!META_TOKEN) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN não configurada' }, { status: 503 })
  }

  try {
    // Use date_preset consistently — avoids conflict with time_range + insights.date_preset
    const fields = [
      'id',
      'name',
      'creative{id,name,thumbnail_url,image_url}',
      'insights.date_preset(this_month){spend,impressions,clicks,ctr,cpm,reach}',
    ].join(',')

    const params = new URLSearchParams({
      fields,
      date_preset: 'this_month',
      limit: '50',
      access_token: META_TOKEN,
    })

    const url = `${BASE}/act_${AD_ACCOUNT_ID}/ads?${params}`

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
        const rawImg = String(creative?.image_url ?? creative?.thumbnail_url ?? '')
        const imageUrl = rawImg.replace(/\/s\d+x\d+\//, '/s960x960/')
        return {
          id: String(ad.id ?? ''),
          nome: String(ad.name ?? ''),
          thumbnail: imageUrl,
          spend: parseFloat(insights.spend ?? '0'),
          impressoes: parseInt(insights.impressions ?? '0', 10),
          cliques: parseInt(insights.clicks ?? '0', 10),
          ctr: parseFloat(insights.ctr ?? '0'),
          cpm: parseFloat(insights.cpm ?? '0'),
          alcance: parseInt(insights.reach ?? '0', 10),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.spend - a!.spend)
      .slice(0, 10)

    return NextResponse.json({
      ads: parsed,
      _debug: { total: ads.length, withInsights: parsed.length },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[/api/meta-creatives]', message)
    return NextResponse.json({ error: message, ads: [] }, { status: 503 })
  }
}
