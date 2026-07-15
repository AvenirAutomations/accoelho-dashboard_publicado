'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { CampaignRow, VTEXRow, GA4Row } from '@/types'

const CACHE_TTL = 60 * 60 * 1000

type Cache = { rows: CampaignRow[]; vtex: VTEXRow[]; ga4: GA4Row[]; ts: number } | null
let _cache: Cache = null

export function useSheetData() {
  const [rows, setRows]       = useState<CampaignRow[]>(_cache?.rows ?? [])
  const [vtex, setVtex]       = useState<VTEXRow[]>(_cache?.vtex ?? [])
  const [ga4, setGa4]         = useState<GA4Row[]>(_cache?.ga4 ?? [])
  const [loading, setLoading] = useState(_cache === null)
  const [error, setError]     = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    _cache ? new Date(_cache.ts) : null,
  )
  const fetching = useRef(false)

  const fetchData = useCallback(async (force = false) => {
    if (fetching.current) return
    if (!force && _cache && Date.now() - _cache.ts < CACHE_TTL) {
      setRows(_cache.rows)
      setVtex(_cache.vtex)
      setGa4(_cache.ga4)
      setLoading(false)
      return
    }
    fetching.current = true
    setLoading(true)
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      _cache = { rows: body.rows, vtex: body.vtex, ga4: body.ga4, ts: Date.now() }
      setRows(body.rows)
      setVtex(body.vtex)
      setGa4(body.ga4)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
      fetching.current = false
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    fetchData()
    const interval = setInterval(() => fetchData(true), CACHE_TTL)
    return () => clearInterval(interval)
  }, [fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  return { rows, vtex, ga4, loading, error, lastUpdated, refresh }
}
