'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Megaphone, TrendingUp } from 'lucide-react'
import { useMetaCreatives, type DatePreset } from '@/hooks/useMetaCreatives'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: 'last_7d' },
  { label: '14 dias', value: 'last_14d' },
  { label: 'Este mês', value: 'this_month' },
  { label: '30 dias', value: 'last_30d' },
]

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtN(n: number) {
  return n.toLocaleString('pt-BR')
}

export default function MetaCampaigns() {
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [open, setOpen] = useState<string | null>(null)
  const { data, loading, error } = useMetaCreatives(preset)

  return (
    <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E4E8EF' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#f37021]" />
          <span className="text-sm font-semibold text-slate-700">Campanhas Ativas — Criativos</span>
        </div>
        {/* Period filter */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                preset === p.value
                  ? 'bg-[#f37021] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-[#f37021] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-2">
          {data.campaigns.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma campanha ativa encontrada</p>
          )}

          {data.campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-slate-100 overflow-hidden">
              {/* Campaign row */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                onClick={() => setOpen(o => o === campaign.id ? null : campaign.id)}
              >
                <span className="text-slate-400">
                  {open === campaign.id
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />}
                </span>
                <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{campaign.nome}</span>
                <div className="hidden sm:flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Investido</p>
                    <p className="text-xs font-bold text-slate-800">R$ {fmt(campaign.spend)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Cliques</p>
                    <p className="text-xs font-bold text-slate-800">{fmtN(campaign.cliques)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">CTR</p>
                    <p className="text-xs font-bold text-slate-800">{campaign.ctr.toFixed(2)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">CPM</p>
                    <p className="text-xs font-bold text-slate-800">R$ {fmt(campaign.cpm)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Alcance</p>
                    <p className="text-xs font-bold text-slate-800">{fmtN(campaign.alcance)}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
                    {campaign.ads.length} anúncio{campaign.ads.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              {/* Ads grid (expanded) */}
              {open === campaign.id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50">
                  {campaign.ads.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Sem criativos com dados no período</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {campaign.ads.map((ad, i) => (
                        <div key={ad.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col">
                          <div className="relative">
                            {ad.thumbnail ? (
                              <img src={ad.thumbnail} alt={ad.nome} className="w-full h-40 object-cover" />
                            ) : (
                              <div className="w-full h-40 bg-slate-200 flex items-center justify-center">
                                <Megaphone className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                            <span className="absolute top-2 left-2 bg-[#f37021] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              #{i + 1}
                            </span>
                          </div>
                          <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                            <p className="text-[11px] font-semibold text-slate-700 line-clamp-2 leading-tight">{ad.nome}</p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-auto">
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase">Investido</p>
                                <p className="text-[11px] font-bold text-slate-800">R$ {fmt(ad.spend)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase">Cliques</p>
                                <p className="text-[11px] font-bold text-slate-800">{fmtN(ad.cliques)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase">CTR</p>
                                <p className="text-[11px] font-bold text-slate-800">{ad.ctr.toFixed(2)}%</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase">CPM</p>
                                <p className="text-[11px] font-bold text-slate-800">R$ {fmt(ad.cpm)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
