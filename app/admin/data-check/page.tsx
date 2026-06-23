import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { getSheetsHealth } from '@/lib/sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DataCheckPage() {
  const health = await getSheetsHealth()

  return (
    <div className="min-h-screen" style={{ background: 'var(--ac-bg)' }}>
      <main className="max-w-screen-md mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao admin
          </Link>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Status das planilhas (Google Sheets)</h1>
          <p className="text-sm text-slate-500 mt-1">Diagnóstico da integração de dados — atualiza a cada acesso a esta página.</p>
          <p className="text-xs text-amber-600 mt-1">Fase atual: apenas Google_Ads e Meta_Ads estão conectadas. VTEX e GA4 ainda não fazem parte da integração.</p>
        </div>

        {/* SHEETS_MASTER_URL status */}
        <div
          className="rounded-2xl p-5 flex items-start gap-3"
          style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
        >
          {health.sheetId ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {health.sheetId ? 'Planilha conectada' : 'Planilha não configurada'}
            </p>
            {health.sheetId && (
              <p className="text-xs text-slate-400 mt-1">ID da planilha: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{health.sheetId}</code></p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              SHEETS_MASTER_URL via variável de ambiente: {health.masterUrlConfigured ? 'sim' : 'não — usando URL padrão fixa no código (lib/sheets.ts)'}
            </p>
            {!health.sheetId && (
              <p className="text-xs text-slate-400 mt-1">Configure a variável de ambiente <code className="bg-slate-100 px-1.5 py-0.5 rounded">SHEETS_MASTER_URL</code> com a URL da planilha (veja GOOGLE_SHEETS_SETUP.md).</p>
            )}
          </div>
        </div>

        {/* Per-tab status */}
        <div className="space-y-3">
          {health.tabs.map((tab) => (
            <div
              key={tab.tab}
              className="rounded-2xl p-5"
              style={{ background: '#fff', border: '1px solid #E4E8EF', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {tab.found && !tab.error ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : tab.found ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-bold text-slate-800">{tab.tab}</span>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {tab.found ? `${tab.count} registro${tab.count === 1 ? '' : 's'}` : 'não encontrada'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400">Última data encontrada</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{tab.lastDate ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{tab.found ? 'Aba encontrada' : 'Aba não encontrada'}</p>
                </div>
              </div>

              {tab.error && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  ⚠ {tab.error}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
