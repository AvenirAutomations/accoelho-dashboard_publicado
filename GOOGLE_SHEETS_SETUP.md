# Configuração do Google Sheets — Dashboard AC Coelho

O dashboard lê os dados de **uma única planilha Google Sheets**, em abas separadas por fonte. Não há dados de demonstração — se a planilha ou uma aba não for encontrada, o dashboard mostra um erro/zeros em vez de números fictícios.

## Status atual da integração

| Aba | Status |
|---|---|
| `Google_Ads` | ✅ Conectada |
| `Meta_Ads` | ✅ Conectada |
| `VTEX` | ⏸️ Ainda não conectada (fora de escopo por enquanto) |
| `GA4` | ⏸️ Ainda não conectada (fora de escopo por enquanto) |

Enquanto VTEX e GA4 não forem conectadas, as abas "Visão Executiva" (Receita/Pedidos/ROAS geral, que vêm da VTEX) e "Analytics"/"Funil" (que vêm do GA4) mostram zero — isso é esperado e não é um erro.

## Planilha em uso

```
https://docs.google.com/spreadsheets/d/1sVnBbrfCtILliCAgpfWpLGaEY1F5U7eP2qO8OUj35hM/edit?usp=sharing
```

Essa URL está fixa em `lib/sheets.ts` (constante `DEFAULT_MASTER_URL`), então o dashboard funciona mesmo sem configurar `SHEETS_MASTER_URL` em nenhum ambiente. Se a variável de ambiente `SHEETS_MASTER_URL` for configurada (local ou Vercel), ela tem prioridade sobre essa URL fixa.

## Estrutura exata de cada aba

### `Google_Ads`

| Coluna (cabeçalho exato) | Exemplo |
|---|---|
| `Date` | `2026-06-01` |
| `Campaign` | `Materiais — Pisos` |
| `Impressions` | `12000` |
| `Clicks` | `450` |
| `Cost` | `1800.00` |
| `Conversions` | `38` |
| `ConversionValue` | `9500.00` |

### `Meta_Ads`

| Coluna (cabeçalho exato) | Exemplo |
|---|---|
| `Day` | `2026-06-01` |
| `Campaign Name` | `Promoção Pisos Junho` |
| `Reach` | `18000` |
| `Impressions` | `25000` |
| `Link Clicks` | `620` |
| `Messaging Conversations Started` | `45` |
| `Amount Spent` | `2100.00` |

> O parser identifica as colunas pelo **nome do cabeçalho** (sem diferenciar maiúsculas/minúsculas), não pela posição — então a ordem das colunas pode variar, desde que o nome do cabeçalho seja exatamente esse.

> ⚠️ Datas: use `AAAA-MM-DD` (preferível) ou `DD/MM/AAAA`. Evite colunas formatadas como "Data" no Sheets — formate como **texto puro** para evitar ambiguidade na exportação.

## Como os KPIs são calculados

### Google Ads
- **Investimento** = `Cost`
- **Impressões** = `Impressions`
- **Cliques** = `Clicks`
- **CTR** = `Clicks / Impressions * 100`
- **CPC** = `Cost / Clicks`
- **Conversões** = `Conversions`
- **Receita (valor de conversão)** = `ConversionValue`
- **ROAS** = `ConversionValue / Cost`

### Meta Ads
- **Investimento** = `Amount Spent`
- **Alcance** = `Reach`
- **Impressões** = `Impressions`
- **Cliques** = `Link Clicks`
- **CTR** = `Link Clicks / Impressions * 100`
- **CPC** = `Amount Spent / Link Clicks`
- **CPM** = `Amount Spent / Impressions * 1000`
- **Conversas iniciadas** = `Messaging Conversations Started`
- **Custo por conversa (CPL)** = `Amount Spent / Messaging Conversations Started`

## Compartilhamento

1. Botão **Compartilhar** (canto superior direito da planilha).
2. Em "Acesso geral", selecione **"Qualquer pessoa com o link"**.
3. Papel: **Leitor**.

## Variável de ambiente (opcional)

```
SHEETS_MASTER_URL=https://docs.google.com/spreadsheets/d/SEU_ID/edit
```

- **Local:** adicione em `.env.local` (se deixar vazio, usa a URL fixa em `lib/sheets.ts`).
- **Vercel:** Project Settings → Environment Variables → `SHEETS_MASTER_URL` → Redeploy. Útil para trocar de planilha sem alterar código.

## Verificar se está funcionando

Acesse **`/admin/data-check`** (logado como admin) para ver:

- Se a planilha foi conectada (e se via env var ou URL fixa no código).
- Se `Google_Ads` e `Meta_Ads` foram encontradas.
- Quantos registros foram lidos por aba.
- A última data encontrada em cada aba.
- Mensagens de erro específicas (aba não encontrada, planilha sem permissão, formato de data inválido, etc.).

## Erros comuns

| Sintoma em `/admin/data-check` | Causa provável |
|---|---|
| "Planilha não configurada" | URL inválida (nem a fixa no código nem a env var resolveram um ID válido). |
| "HTTP 400 — verifique se a aba existe" | Nome da aba diferente do esperado (`Google_Ads`, `Meta_Ads`) — confira maiúsculas/underscores. |
| "Resposta inesperada (HTML)" | Planilha não está compartilhada como "Qualquer pessoa com o link". |
| "Aba encontrada, mas nenhuma linha válida" | Cabeçalhos não correspondem exatamente aos nomes esperados, ou datas fora do formato aceito. |

## Reativando VTEX e GA4 no futuro

Quando essas abas estiverem prontas, será necessário: reintroduzir os parsers de VTEX/GA4 em `lib/sheets.ts` (disponíveis no histórico do Git, commit anterior a esta mudança), voltar a buscá-las em `fetchFromSheets()`/`getSheetsHealth()`, e adicionar as duas abas de volta na constante `TAB_NAMES`.
