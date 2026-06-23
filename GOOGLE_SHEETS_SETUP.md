# Configuração do Google Sheets — Dashboard AC Coelho

O dashboard lê os dados de **uma única planilha Google Sheets**, com **4 abas** (sheets) nomeadas exatamente como abaixo. Não há mais dados de demonstração — se a planilha não estiver configurada ou uma aba não for encontrada, o dashboard mostra um erro em vez de números fictícios.

## 1. Crie a planilha com as 4 abas

Nomes de aba **exatos** (sensível a maiúsculas/minúsculas):

- `Google_Ads`
- `Meta_Ads`
- `VTEX`
- `GA4`

> ⚠️ **Importante:** formate a coluna de data como **texto puro** (`Formatar → Número → Texto simples`) e use o formato `AAAA-MM-DD` (ex.: `2026-06-01`). Se a coluna ficar formatada como "Data" do Google Sheets, a exportação pode gerar formatos ambíguos. O parser também aceita `DD/MM/AAAA` como alternativa, mas `AAAA-MM-DD` é o mais confiável.

A primeira linha de cada aba deve ser o cabeçalho (qualquer texto — não é lido pelo sistema, as colunas são identificadas pela **posição**, não pelo nome). A partir da linha 2, os dados.

## 2. Estrutura exata de cada aba

### `Google_Ads`

| Coluna | # | Exemplo |
|---|---|---|
| Date | 1 | `2026-06-01` |
| Channel | 2 | `Search` |
| Campaign | 3 | `Materiais — Pisos` |
| Impressions | 4 | `12000` |
| Clicks | 5 | `450` |
| Cost | 6 | `1800.00` |
| Conversions | 7 | `38` |
| Revenue | 8 | `9500.00` |
| Calls | 9 | `12` |

### `Meta_Ads`

| Coluna | # | Exemplo |
|---|---|---|
| Date | 1 | `2026-06-01` |
| Channel | 2 | `Feed` (ou `Stories`, `Reels`) |
| Campaign | 3 | `Promoção Pisos Junho` |
| Impressions | 4 | `25000` |
| Reach | 5 | `18000` |
| Clicks | 6 | `620` |
| Cost | 7 | `2100.00` |
| MessagingConversations | 8 | `45` |

### `VTEX`

| Coluna | # | Exemplo |
|---|---|---|
| Date | 1 | `2026-06-01` |
| Revenue | 2 | `38500.00` |
| Orders | 3 | `82` |
| AvgTicket | 4 | `469.51` |
| Products | 5 | `145` |
| NewCustomers | 6 | `30` |
| ReturningCustomers | 7 | `52` |

### `GA4`

| Coluna | # | Exemplo |
|---|---|---|
| Date | 1 | `2026-06-01` |
| Users | 2 | `4200` |
| Sessions | 3 | `5100` |
| EngagementRate | 4 | `62.5` |
| AddToCart | 5 | `380` |
| Checkout | 6 | `210` |
| Purchases | 7 | `82` |

## 3. Compartilhamento

A planilha precisa estar acessível por link (não precisa ser "Publicar na Web" — o sistema lê via endpoint de exportação do Google que respeita o compartilhamento normal):

1. Botão **Compartilhar** (canto superior direito).
2. Em "Acesso geral", selecione **"Qualquer pessoa com o link"**.
3. Papel: **Leitor**.

## 4. Variável de ambiente

Copie a URL da planilha (a URL normal que aparece na barra de endereço ao abrir a planilha, formato `https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit#gid=0`) e configure:

```
SHEETS_MASTER_URL=https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
```

- **Local:** adicione em `.env.local`.
- **Vercel:** Project Settings → Environment Variables → adicione `SHEETS_MASTER_URL` com esse valor → Redeploy.

O sistema extrai automaticamente o ID da planilha dessa URL e busca cada aba (`Google_Ads`, `Meta_Ads`, `VTEX`, `GA4`) individualmente.

## 5. Verificar se está funcionando

Acesse **`/admin/data-check`** (logado como admin) para ver, em tempo real:

- Se `SHEETS_MASTER_URL` está configurada.
- Se cada aba foi encontrada.
- Quantos registros foram lidos por aba.
- A última data encontrada em cada aba.
- Mensagens de erro específicas (aba não encontrada, planilha sem permissão, formato de data inválido, etc.).

## 6. Erros comuns

| Sintoma em `/admin/data-check` | Causa provável |
|---|---|
| "SHEETS_MASTER_URL não configurada" | Variável de ambiente ausente — configure e faça redeploy. |
| "HTTP 400 — verifique se a aba existe" | Nome da aba diferente do esperado (`Google_Ads`, `Meta_Ads`, `VTEX`, `GA4`) — confira maiúsculas/underscores. |
| "Resposta inesperada (HTML)" | Planilha não está compartilhada como "Qualquer pessoa com o link". |
| "Aba encontrada, mas nenhuma linha válida" | Datas na coluna 1 não estão em `AAAA-MM-DD` ou `DD/MM/AAAA`, ou a aba só tem o cabeçalho. |
