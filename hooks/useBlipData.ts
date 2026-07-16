'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface BlipKPIs {
  emAberto: number
  aguardando: number
  finalizadasHoje: number
  perdidos: number
  tempoMedioAtendimento: string
  tempoEspera: string
  tempoPrimeiraResposta: string
}

export interface BlipDailyPoint {
  date: string
  iniciadas: number
  finalizadas: number
  perdidos: number
}

export interface BlipAttendant {
  nome: string
  tickets: number
}

export interface BlipData {
  kpis: BlipKPIs
  dailySeries: BlipDailyPoint[]
  attendants: BlipAttendant[]
}

const CACHE_TTL = 60 * 60 * 1000
type Cache = { data: BlipData; ts: number } | null
let _cache: Cache = null

export function useBlipData() {
  const [data, setData] = useState<BlipData | null>(_cache?.data ?? null)
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
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const toISO = (d: Date) => d.toISOString().split('T')[0]
      const res = await fetch(
        `/api/blip?beginDate=${toISO(firstDay)}&endDate=${toISO(today)}`,
        { cache: 'no-store' },
      )
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      _cache = { data: body, ts: Date.now() }
      setData(body)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados da Blip')
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
