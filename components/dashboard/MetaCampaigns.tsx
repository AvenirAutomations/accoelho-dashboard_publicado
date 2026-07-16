'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Megaphone, TrendingUp, X, MessageCircle } from 'lucide-react'
import { useMetaCreatives, type DatePreset, type MetaAdCreative, type MetaCampaign } from '@/hooks/useMetaCreatives'

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
function fmtN(n: number) { return n.toLocaleString('pt-BR') }

const isMsg = (nome: string) => nome.toUpperCase().includes('[MSG]')

// ── Lightbox ────────────────────────────────────────────────────────────────
function AdLightbox({
  ad, campaign, onClose,
}: { ad: MetaAdCreative; campaign: MetaCampaign; onClose: () => void }) {
  const msg = isMsg(campaign.nome)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative bg-slate-900">
          {ad.thumbnail ? (
            <img src={ad.thumbnail} alt={ad.nome} className="w-full max-h-[420px] object-contain" />
          ) : (
            <div className="w-full h-64 flex items-center justify-center">
              <Megaphone className="w-12 h-12 text-slate-500" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-xs text-slate-400 mb-0.5 truncate">{campaign.nome}</p>
          <p className="text-sm font-semibold text-slate-800 mb-4 line-clamp-2">{ad.nome}</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Investido</p>
              <p className="text-sm font-bold text-slate-800">R$ {fmt(ad.spend)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Cliques</p>
              <p className="text-sm font-bold text-slate-800">{fmtN(ad.cliques)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Impressões</p>
              <p className="text-sm font-bold text-slate-800">{fmtN(ad.impressoes)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">CTR</p>
              <p className="text-sm font-bold text-slate-800">{ad.ctr.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">CPM</p>
              <p className="text-sm font-bold text-slate-800">R$ {fmt(ad.cpm)}</p>
            </div>
            {msg && (
              <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="flex items-center gap-1 mb-1">
                  <MessageCircle className="w-3 h-3 text-green-600" />
                  <p className="text-[10px] text-green-600 uppercase tracking-wide">Conversas</p>
                </div>
                <p className="text-sm font-bold text-green-700">{fmtN(ad.conversas)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Ad card ──────────────────────────────────────────────────────────────────
function AdCard({ ad, campaign, onSelect }: { ad: MetaAdCreative; campaign: MetaCampaign; onSelect: () => void; index: number }) {
  const msg = isMsg(campaign.nome)
  return (
    <button
      onClick={onSelect}
      className="rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col text-left hover:shadow-md hover:border-slate-300 transition-all"
    >
      <div className="relative">
        {ad.thumbnail ? (
          <img src={ad.thumbnail} alt={ad.nome} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-slate-200 flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-slate-400" />
          </div>
        )}
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
          {msg ? (
            <div className="col-span-2">
              <p className="text-[9px] text-green-600 uppercase flex items-center gap-0.5">
                <MessageCircle className="w-2.5 h-2.5" /> Conversas
              </p>
              <p className="text-[11px] font-bold text-green-700">{fmtN(ad.conversas)}</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[9px] text-slate-400 uppercase">CTR</p>
                <p className="text-[11px] font-bold text-slate-800">{ad.ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase">CPM</p>
                <p className="text-[11px] font-bold text-slate-800">R$ {fmt(ad.cpm)}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MetaCampaigns() {
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [open, setOpen] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ ad: MetaAdCreative; campaign: MetaCampaign } | null>(null)
  const { data, loading, error } = useMetaCreatives(preset)

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <AdLightbox ad={lightbox.ad} campaign={lightbox.campaign} onClose={() => setLightbox(null)} />
      )}

      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E4E8EF' }}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#f37021]" />
            <span className="text-sm font-semibold text-slate-700">Campanhas Ativas — Criativos</span>
          </div>
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

        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-[#f37021] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center py-8">{error}</p>
        )}

        {!loading && !error && data && (
          <div className="space-y-2">
            {data.campaigns.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Nenhuma campanha ativa encontrada</p>
            )}

            {data.campaigns.map((campaign) => {
              const msg = isMsg(campaign.nome)
              return (
                <div key={campaign.id} className="rounded-xl border border-slate-100 overflow-hidden">
                  {/* Campaign row */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setOpen(o => o === campaign.id ? null : campaign.id)}
                  >
                    <span className="text-slate-400 shrink-0">
                      {open === campaign.id
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{campaign.nome}</span>
                    <div className="hidden sm:flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Investido</p>
                        <p className="text-xs font-bold text-slate-800">R$ {fmt(campaign.spend)}</p>
                      </div>
                      {msg ? (
                        <div className="text-right">
                          <p className="text-[10px] text-green-600 flex items-center gap-0.5 justify-end">
                            <MessageCircle className="w-3 h-3" /> Conversas
                          </p>
                          <p className="text-xs font-bold text-green-700">{fmtN(campaign.conversas)}</p>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Alcance</p>
                        <p className="text-xs font-bold text-slate-800">{fmtN(campaign.alcance)}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                        {campaign.ads.length} anúncio{campaign.ads.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>

                  {/* Ads grid */}
                  {open === campaign.id && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      {campaign.ads.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Sem criativos no período</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {campaign.ads.map((ad, i) => (
                            <AdCard
                              key={ad.id}
                              ad={ad}
                              campaign={campaign}
                              index={i}
                              onSelect={() => setLightbox({ ad, campaign })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
