'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type DatePreset = 'today' | 'last_7d' | 'last_14d' | 'this_month' | 'last_30d'

export interface MetaAdCreative {
  id: string
  nome: string
  thumbnail: string
  spend: number
  impressoes: number
  cliques: number
  ctr: number
  cpm: number
}

export interface MetaCampaign {
  id: string
  nome: string
  spend: number
  impressoes: number
  cliques: number
  ctr: number
  cpm: number
  alcance: number
  ads: MetaAdCreative[]
}

export interface MetaCreativesData {
  campaigns: MetaCampaign[]
}

const CACHE_TTL = 60 * 60 * 1000
const _cache = new Map<string, { data: MetaCreativesData; ts: number }>()

export function useMetaCreatives(preset: DatePreset = 'this_month') {
  const [data, setData] = useState<MetaCreativesData | null>(_cache.get(preset)?.data ?? null)
  const [loading, setLoading] = useState(!_cache.has(preset))
  const [error, setError] = useState<string | null>(null)
  const fetching = useRef(false)

  const fetchData = useCallback(async (force = false) => {
    if (fetching.current) return
    const cached = _cache.get(preset)
    if (!force && cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data)
      setLoading(false)
      return
    }
    fetching.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/meta-creatives?preset=${preset}`, { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      _cache.set(preset, { data: body, ts: Date.now() })
      setData(body)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar criativos')
    } finally {
      setLoading(false)
      fetching.current = false
    }
  }, [preset])

  useEffect(() => {
    setData(_cache.get(preset)?.data ?? null)
    setLoading(!_cache.has(preset))
    fetchData()
  }, [preset, fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])
  return { data, loading, error, refresh }
}
