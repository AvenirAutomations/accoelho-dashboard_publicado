import type { ExecutiveMetrics } from '@/types'

export const METAS = {
  receita:     200000,
  pedidos:     400,
  roas:        5.0,
  investimento: 25000,
  sessoes:     30000,
}

export function calcGoalPct(value: number, meta: number): number {
  return Math.min(150, meta > 0 ? (value / meta) * 100 : 0)
}

export function getScoreConfig(score: number) {
  if (score >= 80) return { label: 'Excelente', color: '#34d399' }
  if (score >= 65) return { label: 'Boa', color: '#60a5fa' }
  if (score >= 45) return { label: 'Atenção', color: '#fbbf24' }
  return { label: 'Crítica', color: '#f87171' }
}

export function calculatePerformanceScore(
  current: ExecutiveMetrics,
  previous: ExecutiveMetrics | null,
): number {
  let score = 0

  // Goal attainment — 40 pts
  score += Math.min(20, calcGoalPct(current.receitaTotal, METAS.receita) * 0.20)
  score += Math.min(20, calcGoalPct(current.roasGeral, METAS.roas) * 0.20)

  // ROAS health — 30 pts
  const roasPts = Math.min(30, current.roasGeral * 6)
  score += roasPts

  // WoW growth — 30 pts
  if (previous && previous.receitaTotal > 0) {
    const receitaGrowth = ((current.receitaTotal - previous.receitaTotal) / previous.receitaTotal) * 100
    score += 15 + Math.min(15, Math.max(-15, receitaGrowth * 0.75))
  } else {
    score += 30
  }

  return Math.round(Math.min(100, Math.max(0, score)))
}
