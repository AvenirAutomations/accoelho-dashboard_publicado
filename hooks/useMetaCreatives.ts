'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface MetaAd {
  id: string
  nome: string
  thumbnail: string
  criativo: string
  spend: number
  impressoes: number
  cliques: number
  ctr: number
  cpm: number
  alcance: number
}

export interface MetaCreativesData {
  ads: MetaAd[]
}

const CACHE_TTL = 60 * 60 * 1000
type Cache = { data: MetaCreativesData; ts: number } | null
let _cache: Cache = null

export function useMetaCreatives() {
  const [data, setData] = useState<MetaCreativesData | null>(_cache?.data ?? null)
  const [loading, setLoading] = useState(_cache === null)
  const [error, setError] = useState<string | null>(null)
  const fetching = useRef(false)

  const fetchData = useCallback(async (force = false) => {
    if (fetching.current) return
    if (!force && _cache && Date.now() - _cache.ts < CACHE_TTL) {
      setData(_cache.data)
      setLoading(false)
      return
    }
    fetching.current = true
    setLoading(true)
    try {
      const res = await fetch('/api/meta-creatives', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      _cache = { data: body, ts: Date.now() }
      setData(body)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar criativos')
    } finally {
      setLoading(false)
      fetching.current = false
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), CACHE_TTL)
    return () => clearInterval(interval)
  }, [fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  return { data, loading, error, refresh }
}
