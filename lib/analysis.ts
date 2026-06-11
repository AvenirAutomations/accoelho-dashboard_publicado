import type { ExecutiveMetrics, AutoAnalysis, ChannelMetrics, DashboardInsight } from '@/types'
import { formatCurrency, formatPercent } from './metrics'

function variation(current: number, prev: number): number {
  if (prev === 0) return 0
  return ((current - prev) / prev) * 100
}

export function generateAnalysis(
  current: ExecutiveMetrics | null,
  previous: ExecutiveMetrics | null,
  channels: ChannelMetrics[],
): AutoAnalysis {
  if (!current) {
    return {
      summary: 'Nenhum dado disponível para o período selecionado.',
      insights: [],
      recommendations: [],
    }
  }

  const insights: DashboardInsight[] = []
  const recommendations: string[] = []

  if (previous) {
    const varReceita = variation(current.receitaTotal, previous.receitaTotal)
    const varRoas = variation(current.roasGeral, previous.roasGeral)
    const varInvest = variation(current.investimentoTotal, previous.investimentoTotal)

    if (Math.abs(varReceita) > 3) {
      insights.push({
        type: varReceita > 0 ? 'positive' : 'negative',
        title: 'Receita',
        description: `${varReceita > 0 ? 'Crescimento' : 'Queda'} de ${Math.abs(varReceita).toFixed(1)}% na receita em relação à semana anterior.`,
      })
    }

    if (varRoas < -8) {
      insights.push({
        type: 'warning',
        title: 'ROAS em queda',
        description: `ROAS caiu ${Math.abs(varRoas).toFixed(1)}%, indicando menor eficiência do investimento em mídia.`,
      })
      recommendations.push('Revisar campanhas com ROAS abaixo do esperado e redistribuir budget para os melhores performers.')
    } else if (varRoas > 5) {
      insights.push({
        type: 'positive',
        title: 'ROAS em alta',
        description: `ROAS cresceu ${varRoas.toFixed(1)}%, atingindo ${current.roasGeral.toFixed(1)}x neste período.`,
      })
    }

    if (varInvest > 15) {
      insights.push({
        type: 'warning',
        title: 'Aumento de Investimento',
        description: `Investimento cresceu ${varInvest.toFixed(1)}%. Verificar se o crescimento de receita acompanhou proporcionalmente.`,
      })
    }
  }

  if (current.roasGeral < 3) {
    insights.push({
      type: 'negative',
      title: 'ROAS abaixo do ideal',
      description: `ROAS atual de ${current.roasGeral.toFixed(1)}x está abaixo do benchmark mínimo de 3x para e-commerce.`,
    })
    recommendations.push('Auditar campanhas com ROAS baixo e pausar as que não estão gerando retorno adequado.')
  }

  if (channels.length > 0) {
    const bestCtr = channels.reduce((a, b) => (a.ctr > b.ctr ? a : b))
    insights.push({
      type: 'neutral',
      title: 'Canal com Melhor CTR',
      description: `${bestCtr.canal} registrou o maior CTR (${formatPercent(bestCtr.ctr)}) no período.`,
    })
  }

  if (recommendations.length === 0) {
    recommendations.push('Manter a estratégia atual e ampliar investimento nos canais com melhor ROAS.')
    recommendations.push('Testar novos criativos e públicos para escalar receita sem elevar proporcionalmente o CPV.')
  }

  const summary = `Receita de ${formatCurrency(current.receitaTotal)} com ${current.pedidos} pedidos e ROAS geral de ${current.roasGeral.toFixed(1)}x. Investimento total de ${formatCurrency(current.investimentoTotal)}.`

  return { summary, insights, recommendations }
}
