# Peepers Tools

Gerador de anúncios profissionais para marketplaces brasileiros com IA — Mercado Livre, Shopee, Amazon BR e Magalu.

## O que é

Wizard de 5 etapas que automatiza a criação de listings de e-commerce:

1. **Upload de fotos** — o vendedor carrega até 7 fotos do produto
2. **Identificação** — IA (Gemini vision) reconhece o produto, categoria e características
3. **Geração de anúncios** — títulos e descrições otimizados para cada marketplace
4. **Prompts de imagem** — geração de 7 imagens profissionais com Visual DNA
5. **Editor de overlays + Exportação** — editor visual em canvas e exportação em ZIP

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript strict, Vite 5.4, Tailwind CSS 3.4, shadcn/ui (Radix), Framer Motion |
| State | React Context (`CreateListingContext`) + localStorage (auto-save, chave `draft_product_v2`) |
| Backend | Supabase — Auth, Postgres com RLS, Storage, Edge Functions (Deno/TypeScript) |
| IA | Google Gemini 2.5 Flash (texto/visão/function-calling) + Gemini 2.0 Flash Image (geração) |
| Export | Canvas API + JSZip + FileSaver |
| Testes | Vitest + Testing Library (unit), Playwright (E2E configurado) |
| Deploy | Vercel (frontend) + Supabase Cloud (edge functions) |

## Comandos

```bash
npm run dev          # dev server (Vite, porta 5173)
npm run build        # build de produção
npm run lint         # ESLint
npm run test         # testes unitários (Vitest)
npm run test:watch   # testes em modo watch
```

Rodar um único arquivo de teste:
```bash
npx vitest run src/context/CreateListingContext.test.tsx
```

## Variáveis de ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

Edge functions precisam das seguintes secrets no Supabase:
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ALLOWED_ORIGIN          # domínio do frontend em produção (ex: https://peepers-tools.vercel.app)
```

Chaves de IA são fornecidas pelo próprio usuário via página de Configurações (**modelo BYOK**).

## Estrutura principal

```
src/
  components/create/         # componentes do wizard (StepUpload, StepIdentify, StepAds, …)
    overlay-editor/          # editor visual de overlays em canvas (OverlayEditor + sub-componentes)
  context/
    CreateListingContext.tsx  # todo o estado do wizard + persistência no localStorage
    AuthContext.tsx           # auth Supabase (OAuth Google)
  lib/
    overlayTemplates.ts       # IMAGE_ROLES + templates de overlay padrão por função de imagem
    knowledgeCategories.ts    # espelho frontend das 10 categorias de produto
  pages/
    CreateListing.tsx         # rota /create — renderiza o wizard
    History.tsx               # histórico de listings
  integrations/supabase/      # cliente Supabase auto-gerado (não editar)

supabase/
  functions/
    _shared/
      helpers.ts              # utilitários: auth, CORS, callGoogleAI(), sanitizeForLLM(), rate limit
      knowledge/              # base de conhecimento por marketplace e categoria (7 módulos)
    identify-product/         # visão IA → nome, categoria, suggested_category, características
    generate-ads/             # títulos + descrições para ML, Shopee, Amazon BR, Magalu
    generate-prompts/         # prompts de imagem + Visual DNA (cores, iluminação, estilo)
    generate-image/           # geração de imagem via Gemini 2.0 Flash Image
    generate-overlay-copy/    # textos curtos PT-BR para overlays (headline, bullets, badges)
  migrations/                 # migrations SQL (Postgres + RLS)
```

## Arquitetura das edge functions

Todas as 5 edge functions seguem o mesmo padrão:
1. `getCorsHeaders(req)` — CORS com allowlist de origens
2. `authenticate(req, cors)` — verifica JWT Supabase
3. `checkRateLimit(userId, functionName, cors)` — quota por usuário via tabela `rate_limits`
4. `buildKnowledge(options)` — injeta base de conhecimento de marketplace/categoria no prompt
5. `callGoogleAI()` — chama Google Generative Language API diretamente
6. `parseToolCallResult()` — extrai JSON estruturado da resposta via function-calling

## Rate limits (por hora, por usuário)

| Função | Limite |
|--------|--------|
| identify-product | 20 |
| generate-ads | 30 |
| generate-prompts | 20 |
| generate-image | 50 |
| generate-overlay-copy | 50 |
