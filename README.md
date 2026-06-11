# AC Coelho — Dashboard de Performance

Dashboard de performance de e-commerce para a AC Coelho (Materiais de Construção), construído em Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.

Reúne dados de **Google Ads**, **Meta Ads**, **Google Analytics 4** e **VTEX** em uma visão executiva única, com análise automática via Gemini e acesso protegido por login.

## Stack

- Next.js 16 (App Router, Turbopack, Server Components)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Recharts (gráficos)
- framer-motion (animações)
- jose (JWT — sessão de login)
- Google Generative AI (Gemini — análise automática, opcional)

## Estrutura do projeto

```
idor-dashboard/
├── app/
│   ├── admin/page.tsx         # Painel admin (todas as abas + filtros globais)
│   ├── dashboard/page.tsx     # Dashboard do cliente (6 abas)
│   ├── login/page.tsx         # Tela de login
│   ├── api/
│   │   ├── auth/login/        # POST — autentica e cria cookie de sessão
│   │   ├── auth/logout/        # POST — remove cookie de sessão
│   │   ├── data/               # GET — dados consolidados (Sheets ou mock)
│   │   └── analysis/           # POST — análise automática via Gemini
│   ├── layout.tsx
│   └── page.tsx                # Redireciona para /dashboard
├── components/
│   ├── dashboard/               # KPICard, HeroSection, FunnelViz, gráficos, etc.
│   ├── layout/                  # Header
│   └── ui/                      # shadcn/ui (Tabs, Card, Select, Badge...)
├── lib/
│   ├── auth.ts                  # Verificação de credenciais (env vars)
│   ├── session.ts                # Criação/verificação de JWT de sessão
│   ├── sheets.ts                  # Leitura/parse das planilhas (Google Sheets CSV)
│   ├── mock-data.ts               # Dados de demonstração (fallback)
│   ├── metrics.ts                  # Agregações e cálculos de KPIs
│   ├── period.ts                    # Filtros de período/semana
│   ├── goals.ts                      # Metas e score de performance
│   └── analysis.ts                    # Geração de insights (regra + IA)
├── hooks/useSheetData.ts        # Hook de fetch com cache (5 min)
├── types/index.ts               # Tipos compartilhados
├── proxy.ts                      # Proteção de rotas (login obrigatório)
├── .env.local.example           # Template de variáveis de ambiente
└── package.json
```

## Pré-requisitos

- Node.js 20+
- npm

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local
# edite .env.local com seus valores (veja seção abaixo)
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e configure:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `SESSION_SECRET` | ✅ | String aleatória com 32+ caracteres, usada para assinar o JWT de sessão |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Login com acesso a `/admin` e `/dashboard` |
| `CLIENT_EMAIL` / `CLIENT_PASSWORD` | ✅ | Login com acesso somente a `/dashboard` (uso para compartilhar com o cliente) |
| `GEMINI_API_KEY` | opcional | Habilita a análise automática com IA (sem ela, usa-se a análise por regras) |
| `SHEETS_GOOGLE_ADS_URL` | opcional | CSV publicado do Google Ads |
| `SHEETS_META_ADS_URL` | opcional | CSV publicado do Meta Ads |
| `SHEETS_VTEX_URL` | opcional | CSV publicado do VTEX |
| `SHEETS_GA4_URL` | opcional | CSV publicado do GA4 |

Sem as URLs de planilha configuradas, o dashboard funciona normalmente com **dados de demonstração** (`lib/mock-data.ts`).

Gere um `SESSION_SECRET` seguro com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Autenticação

O acesso é protegido por login simples (e-mail + senha), validado contra as variáveis de ambiente — sem dependências externas (Firebase, banco de dados, etc.):

- **Admin** (`ADMIN_EMAIL` / `ADMIN_PASSWORD`): acessa `/admin` e `/dashboard`.
- **Cliente** (`CLIENT_EMAIL` / `CLIENT_PASSWORD`): acessa apenas `/dashboard` — use essas credenciais para compartilhar o dashboard com o cliente AC Coelho.

Atualmente ambos apontam para a mesma credencial: `adm@accoelho.com.br` / `123456y@`.

Após o login, uma sessão JWT (8h) é gravada em cookie `httpOnly`. Todas as rotas (exceto `/login`) exigem sessão válida — ver `proxy.ts`.

> Para trocar a senha de acesso, basta alterar `ADMIN_PASSWORD`/`CLIENT_PASSWORD` nas variáveis de ambiente (e redeploy, se em produção).

## Deploy na Vercel

### 1. Subir o projeto para o GitHub

```bash
git init                       # se ainda não for um repositório
git add .
git commit -m "Dashboard AC Coelho — pronto para deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/ac-coelho-dashboard.git
git push -u origin main
```

> O `.env.local` **não é** versionado (está no `.gitignore`) — suas chaves não vão para o GitHub.

### 2. Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do GitHub.
2. Framework detectado automaticamente: **Next.js**.
3. Em **Environment Variables**, adicione todas as variáveis listadas acima (no mínimo `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_EMAIL`, `CLIENT_PASSWORD`).
4. Clique em **Deploy**.

A cada `git push` na branch `main`, a Vercel faz o redeploy automaticamente.

### 3. Compartilhar com o cliente

Envie ao cliente a URL gerada pela Vercel (ex.: `https://ac-coelho-dashboard.vercel.app`) junto com o login `adm@accoelho.com.br` / `123456y@`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção localmente |
| `npm run lint` | ESLint |

## Verificação de produção

Antes de cada deploy importante, rode localmente:

```bash
npm run lint
npm run build
```

Ambos devem terminar sem erros.
