import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const META_TOKEN = process.env.META_ACCESS_TOKEN
const AD_ACCOUNT_ID = '513586913025981'
const BASE = 'https://graph.facebook.com/v20.0'

export type DatePreset = 'today' | 'last_7d' | 'last_14d' | 'this_month' | 'last_30d'

export async function GET(req: NextRequest) {
  if (!META_TOKEN) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN não configurada' }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const preset: DatePreset = (searchParams.get('preset') as DatePreset) ?? 'this_month'

    const fields = [
      'id',
      'name',
      'campaign{id,name,effective_status}',
      'creative{id,name,thumbnail_url,image_url}',
      `insights.date_preset(${preset}){spend,impressions,clicks,ctr,cpm,reach}`,
    ].join(',')

    const filtering = JSON.stringify([
      { field: 'campaign.effective_status', operator: 'IN', value: ['ACTIVE'] },
    ])

    const params = new URLSearchParams({
      fields,
      filtering,
      limit: '200',
      access_token: META_TOKEN,
    })

    const res = await fetch(`${BASE}/act_${AD_ACCOUNT_ID}/ads?${params}`, { cache: 'no-store' })
    const json = await res.json()

    if (!res.ok || json.error) {
      throw new Error(json.error?.message ?? `HTTP ${res.status}`)
    }

    const rawAds = (json.data ?? []) as Record<string, unknown>[]

    // Group by campaign
    const campaignMap = new Map<string, {
      id: string; nome: string; spend: number; impressoes: number
      cliques: number; ctr: number; cpm: number; alcance: number
      ads: { id: string; nome: string; thumbnail: string; spend: number; impressoes: number; cliques: number; ctr: number; cpm: number }[]
    }>()

    for (const ad of rawAds) {
      const insights = (ad.insights as { data?: Record<string, string>[] } | undefined)?.data?.[0]
      if (!insights) continue

      const campaign = ad.campaign as { id: string; name: string } | undefined
      if (!campaign) continue

      const creative = ad.creative as Record<string, string> | undefined
      const rawImg = String(creative?.image_url ?? creative?.thumbnail_url ?? '')
      const thumbnail = rawImg.replace(/\/s\d+x\d+\//, '/s960x960/')

      const adData = {
        id: String(ad.id ?? ''),
        nome: String(ad.name ?? ''),
        thumbnail,
        spend: parseFloat(insights.spend ?? '0'),
        impressoes: parseInt(insights.impressions ?? '0', 10),
        cliques: parseInt(insights.clicks ?? '0', 10),
        ctr: parseFloat(insights.ctr ?? '0'),
        cpm: parseFloat(insights.cpm ?? '0'),
      }

      const existing = campaignMap.get(campaign.id)
      if (existing) {
        existing.spend += adData.spend
        existing.impressoes += adData.impressoes
        existing.cliques += adData.cliques
        existing.alcance += parseInt(insights.reach ?? '0', 10)
        existing.ads.push(adData)
      } else {
        campaignMap.set(campaign.id, {
          id: campaign.id,
          nome: campaign.name,
          spend: adData.spend,
          impressoes: adData.impressoes,
          cliques: adData.cliques,
          ctr: 0,
          cpm: 0,
          alcance: parseInt(insights.reach ?? '0', 10),
          ads: [adData],
        })
      }
    }

    const campaigns = Array.from(campaignMap.values())
      .map(c => ({
        ...c,
        ctr: c.impressoes > 0 ? (c.cliques / c.impressoes) * 100 : 0,
        cpm: c.impressoes > 0 ? (c.spend / c.impressoes) * 1000 : 0,
        ads: c.ads.sort((a, b) => b.spend - a.spend),
      }))
      .sort((a, b) => b.spend - a.spend)

    return NextResponse.json({ campaigns })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[/api/meta-creatives]', message)
    return NextResponse.json({ error: message, campaigns: [] }, { status: 503 })
  }
}
