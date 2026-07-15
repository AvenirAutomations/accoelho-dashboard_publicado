'use client'

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeeklyTrend } from '@/types'
import { formatCompact, formatCurrency } from '@/lib/metrics'

interface WeeklyChartProps {
  data: WeeklyTrend[]
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
}

const safeN = (v: unknown) => Number(v ?? 0)

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <div className="h-48">{children}</div>
      </CardContent>
    </Card>
  )
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <ChartCard title="Receita Diária (R$)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#016233" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#016233" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `R$${formatCompact(safeN(v))}`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={v => [formatCurrency(safeN(v)), 'Receita']} />
            <Area type="monotone" dataKey="receita" stroke="#016233" strokeWidth={2} fill="url(#gradReceita)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Pedidos por Dia">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={v => [safeN(v).toLocaleString('pt-BR'), 'Pedidos']} />
            <Bar dataKey="pedidos" fill="#f37021" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="ROAS Diário">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradRoas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f37021" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f37021" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `${safeN(v).toFixed(1)}x`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={v => [`${safeN(v).toFixed(2)}x`, 'ROAS']} />
            <Area type="monotone" dataKey="roas" stroke="#f37021" strokeWidth={2} fill="url(#gradRoas)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Investimento Diário (R$)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradInvest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `R$${formatCompact(safeN(v))}`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={v => [formatCurrency(safeN(v)), 'Investimento']} />
            <Area type="monotone" dataKey="investimento" stroke="#6366f1" strokeWidth={2} fill="url(#gradInvest)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Sessões por Dia">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradSessoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => formatCompact(safeN(v))} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={v => [safeN(v).toLocaleString('pt-BR'), 'Sessões']} />
            <Area type="monotone" dataKey="sessoes" stroke="#3b82f6" strokeWidth={2} fill="url(#gradSessoes)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Receita vs Investimento">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradR2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#016233" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#016233" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `R$${formatCompact(safeN(v))}`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={v => [formatCurrency(safeN(v))]} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="receita" name="Receita" stroke="#016233" strokeWidth={2} fill="url(#gradR2)" />
            <Area type="monotone" dataKey="investimento" name="Investimento" stroke="#f37021" strokeWidth={2} fill="none" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
