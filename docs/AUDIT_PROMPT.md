Atue como o Engenheiro de Software Líder (Staff/Principal) assumindo a responsabilidade técnica do **Peepers Tools** — que terá um conjunto de ferramentas internas começando com a ferramenta para criação automatizada de anúncios visuais para e-commerce brasileiro (Mercado Livre, Shopee, Amazon BR e Magalu).

---

## CONTEXTO DO PROJETO

### Produto
Wizard de 5 etapas: Upload de fotos → IA identifica produto → Gera títulos e descrições para marketplaces → Editor visual de overlays em canvas → Exportação do pacote completo (ZIP com imagens + copy).

### Stack

| Camada     | Tecnologia |
|------------|-----------|
| Frontend   | React 18, TypeScript strict, Vite 5.4, Tailwind CSS 3.4, shadcn/ui (Radix), Framer Motion, React Router 6, React Query 5 |
| State      | React Context (`CreateListingContext` + `AuthContext`) + React Query |
| Backend    | Supabase (Lovable Cloud) — Auth, Storage, Edge Functions (Deno) |
| IA         | Google Gemini 2.5 Flash (text/vision/function-calling) + `gemini-2.0-flash-preview-image-generation` (geração) — API direta Google (`https://generativelanguage.googleapis.com/v1beta`) |
| Export     | Canvas API + JSZip + FileSaver |
| Testes     | Vitest + Testing Library (unit), Playwright (E2E — setup existe, cobertura mínima) |
| Deploy     | Vercel (frontend) + Supabase Cloud |

### Edge Functions (Deno, em `supabase/functions/`)

| Função                  | Propósito |
|------------------------|-----------|
| `identify-product`     | Identifica produto via fotos (Gemini vision) |
| `generate-ads`          | Gera títulos e descrições para ML (60 chars), Shopee (120), Amazon BR (200) e Magalu (150); injeta base de conhecimento (`buildKnowledge`) |
| `generate-prompts`      | Gera 7 prompts de imagem + Visual DNA (cores, iluminação, tom); injeta regras de imagem por categoria |
| `generate-image`        | Gera imagem via `gemini-2.0-flash-preview-image-generation` com fotos de referência |
| `generate-overlay-copy` | Gera textos curtos PT-BR para overlays (headline ≤30, subheadline ≤50, bullet ≤40, badge ≤15, CTA ≤20); injeta regras de overlay |

### Padrões obrigatórios em TODAS as edge functions:
- `getCorsHeaders(req)` para CORS (allowlist: `peepers-tools.vercel.app`, `ALLOWED_ORIGIN` env var, `localhost:*` em dev)
- `authenticate(req, cors)` para auth (JWT Supabase — `verify_jwt = false` em `config.toml` para controle manual)
- `checkRateLimit(userId, functionName, cors)` para rate limiting via tabela `rate_limits` (Postgres)
- `buildKnowledge({ functionName, marketplace, category, includeBrand })` para injetar base de conhecimento no system prompt
- `sanitizeForLLM()` para todo input de usuário (encapsula em `<user_input>` + `LLM_SAFETY_INSTRUCTION` no system prompt)
- `createRequestLogger()` para logging estruturado
- Tratar `OPTIONS` preflight em todas as functions

---

## ARQUIVOS IMUТÁVEIS (auto-gerados, não editar)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `src/integrations/lovable/index.ts`
- `.env`

**Não proponha alterações nesses arquivos.**

---

## COMPONENTE CRÍTICO: OverlayEditor (`src/components/create/overlay-editor/`)

Editor visual de overlays com canvas, dividido em sub-componentes especializados:
- `OverlayEditor.tsx` — orquestrador principal
- `OverlayCanvas.tsx` — render do canvas
- `OverlayToolbar.tsx` — barra de ferramentas
- `OverlayPropertyPanel.tsx` — painel de propriedades do elemento selecionado
- `OverlayLayerList.tsx` — lista de camadas
- `OverlayAlignmentBar.tsx` — alinhamento
- `OverlayAICopyButton.tsx` — geração de copy via IA
- `OverlayGroupEditPanel.tsx` — edição em grupo
- `types.ts` — `OverlayElement` (tipo canônico, union discriminada)
- `constants.ts` — constantes do editor

Regras invioláveis:

1. **Coordenadas em % (0-100%)** — todo o sistema assume percentuais, NUNCA pixels absolutos para posição. Conversão para pixels acontece apenas no render do canvas.
2. **Ref gate (`loadedForRef`)** — O `useEffect` de carregamento usa um ref como gate para evitar ciclo de dependência com o contexto. **NÃO adicionar `getOverlayElements` nas deps** ou causa deseleção ao digitar.
3. **`OverlayElement` é o único tipo canônico** — definido em `overlay-editor/types.ts`. `OverlayElementData` é alias deprecated não usar em código novo.
4. **Snap em linhas-guia** (5%, 50%, 95%) + drag & drop com suporte touch e mouse.
5. **Undo/Redo** — stack de snapshots (max 20).
6. **Index 1 (cover)** — NÃO tem overlay (retorna array vazio).
7. **Exportação** — renderiza canvas em alta resolução e salva no Supabase Storage (`generated-images/` bucket público).

---

## STATE MANAGEMENT

`CreateListingContext` mantém todo o estado do wizard em memória + **persistência em `localStorage`** (chave: `draft_product_v2`, auto-save com debounce de 2s, restauração no mount com toast Restore/Discard).

Campos críticos:
- `marketplace: Marketplace` — marketplace alvo (`"mercadoLivre"` | `"shopee"` | `"amazon"` | `"magalu"`)
- `includeBrand: boolean` — incluir nome da marca nos títulos gerados
- `overlayElements: Record<number, OverlayElement[]>` — elementos por imagem (índice 1-7)
- `overlayUrls: Record<number, string>` — URLs das imagens exportadas
- `photoUrls: string[]` — URLs do Supabase Storage (não base64)
- `prompts: PromptCard[]` — com `id`, `prompt`, `approved`, `imageUrl`, `feedback`
- `visualDNA` — background, lighting, style, tone, accentColor, headlineColor
- `identification.suggested_category?: string` — categoria normalizada (1 das 10 chaves) sugerida pela IA
- `ads.amazon?: AdData & { bullets?: string[]; backend_search_terms?: string }` — dados Amazon
- `ads.magalu?: AdData` — dados Magalu

**Atenção:** Alterar a estrutura de `ListingData` pode corromper drafts existentes no localStorage dos usuários.

---

## O QUE NÃO QUEBRAR

- Ciclo de deps do overlay editor — o ref gate no useEffect é **intencional**
- Coordenadas em % — todo o sistema assume 0-100%
- `_shared/helpers.ts` — importado por TODAS as edge functions; breaking change afeta tudo
- `_shared/knowledge/` — importado como bundle; alterações em qualquer módulo afetam todas as functions que usam `buildKnowledge`
- Persistência no localStorage — alterar `ListingData` sem migração corrompe drafts
- CORS headers — sem eles o frontend não chama as functions
- `OverlayElement` em `overlay-editor/types.ts` — única fonte de verdade; qualquer alteração quebra canvas, export e persistência

---

## MODO DE OPERAÇÃO

- Analise o código real, não inferências
- Questione decisões técnicas quando houver alternativa **concretamente** melhor
- Priorize por impacto: conversão do seller, performance percebida, robustez das chamadas IA, custo operacional
- Pense como dono do produto + tech lead simultaneamente
- Toda sugestão deve ser acionável, com referência a arquivo/função real
- **Respeite os invariantes listados acima** — não proponha alterações que os violem

---

## ETAPA 1 — ANÁLISE TÉCNICA

### 1.1 Arquitetura
- Avaliar Context + localStorage vs alternativas (Zustand, persistência server-side). Considerar que drafts vivem apenas no browser — perdem se trocar máquina.
- Acoplamento com Gemini via Lovable AI Gateway — fallback se o gateway cair?
- Schema JSONB de prompts — escala com versionamento, A/B, histórico de iterações?
- Dívidas técnicas concretas (com referência a arquivo e linha)

### 1.2 Frontend
- Qualidade visual: nível SaaS premium ou MVP funcional?
- UX do wizard de 5 steps: fricção, feedback de loading durante chamadas IA (5-30s por chamada)
- ImageOverlayEditor: usabilidade real em mobile/touch? Performance com 7 imagens HD abertas?
- Acessibilidade: ARIA no overlay editor, navegação por teclado no stepper, contraste
- Performance: bundle size, lazy loading efetivo, otimização de imagens, re-renders no Context

### 1.3 Backend / Edge Functions
- Robustez das chamadas IA: `fetchWithRetry` com backoff e timeout de 30s já existe em `helpers.ts` — todas as functions usam corretamente?
- Base de conhecimento: `buildKnowledge()` adiciona ~6 000 tokens por chamada — qual o impacto no custo e latência?
- Custo: quantas chamadas Gemini por listing completa? Oportunidades de cache (mesmo produto → mesmo resultado)?
- Storage: lifecycle de imagens geradas órfãs (gerou mas não salvou no listing), limpeza
- Consistência: as 5 edge functions seguem exatamente os mesmos padrões ou há desvios?
- Error handling: erros do Gemini propagam de forma útil até o usuário?

### 1.4 Qualidade de Código
- TypeScript strict — verificar se está realmente em strict ou se há escape hatches
- Cobertura de testes: o overlay editor (multi-arquivo, mais complexo) tem ZERO testes
- Error boundaries: `ErrorBoundary.tsx` existe — cobre StepPrompts e StepExport (image-heavy)?
- As 40+ components shadcn/ui são todas necessárias ou tem bloat?

### 1.5 Produto
- Onboarding: seller entende o que fazer sem instrução no primeiro uso?
- Pontos de abandono no funil de 5 steps — algum step é confuso ou lento demais?
- History page: funcionalidade real ou placeholder?
- Export: o pacote ZIP é útil ou seria melhor integração direta com API dos marketplaces?

---

## ETAPA 2 — DIAGNÓSTICO

Classifique cada achado:
- 🔴 **Crítico** — quebra experiência, perde dados, compromete segurança, ou bloqueia crescimento
- 🟡 **Importante** — impacto médio em UX, performance ou manutenção
- 🟢 **Incremental** — polish, otimização, nice-to-have

---

## ETAPA 3 — PLANO DE AÇÃO

### Curto prazo (quick wins, <1 sprint)
- Robustez: retry/timeout nas chamadas IA, feedback visual de loading real (não spinner genérico)
- Bugs visíveis, edge cases no overlay editor
- Testes para o componente mais crítico (ImageOverlayEditor)

### Médio prazo (1-3 sprints)
- Cobertura de testes E2E dos 5 steps completos
- Acessibilidade do overlay editor
- Migração segura de drafts se `ListingData` mudar
- Error handling end-to-end (edge function → Context → Toast útil)
- Unificar `OverlayElement` e `OverlayElementData` em definição única

### Longo prazo (roadmap)
- Persistência server-side de drafts (trocar máquina sem perder trabalho)
- Integração direta com APIs dos marketplaces (ML, Shopee, Amazon)
- Billing/planos com limites de listings/mês
- Analytics de uso (qual step tem mais abandono, tempo médio por listing)
- Otimização de custos IA (batch, cache, modelo menor para tasks simples)

---

## ETAPA 4 — MELHORIAS DETALHADAS

Para cada melhoria relevante:
1. **Problema atual** — com referência ao arquivo/função real
2. **Solução proposta** — abordagem arquitetural, não pseudocódigo genérico
3. **Justificativa** — por que esta solução e não outra
4. **Impacto** — o que muda para o seller ou para o sistema
5. **Risco** — o que pode quebrar (referência aos invariantes acima)

---

## ETAPA 5 — FRONTEND PREMIUM

Público: **vendedores de marketplace brasileiro** (não técnicos, usam celular frequentemente).

- Design system: tokens atuais (Inter + Space Grotesk + HSL vars) são suficientes ou precisam de evolução?
- Empty states, tooltips para features de IA, onboarding contextual
- Loading states durante geração IA: progresso real ou estimativa? Skeleton? Animação?
- Mobile: overlay editor funciona em tela 375px? Drag com dedo é preciso?
- Conversão: CTAs claros, confirmação de sucesso com próximo passo, celebration moments

---

## ETAPA 6 — BACKEND ROBUSTO

- Padronização das 5 edge functions (DRY entre elas — `_shared/helpers.ts` e `_shared/knowledge/` já extraem patterns comuns; há mais a extrair?)
- Rate limiting por usuário (já implementado via tabela `rate_limits`; está sendo bypassado?)
- Geração de imagem: síncrona ou deveria ser async com polling/webhook?
- Limpeza de storage: imagens geradas em `generated-images/` sem listing associado
- Monitoramento: como saber se uma function está falhando silenciosamente? (`createRequestLogger` existe — está sendo usado?)
- Base de conhecimento (`buildKnowledge`): token budget de ~6k por chamada — está sendo respeitado? Impacto no custo?

---

## ETAPA 7 — FEATURES DE PRODUTO

Sugira features focadas em **valor real para sellers brasileiros**:
- **Retenção:** templates salvos por categoria, duplicação rápida, favoritos
- **Eficiência:** bulk generation (vários produtos de uma vez), presets de Visual DNA
- **Diferencial:** preview simulando como fica no ML/Shopee/Amazon, score de qualidade do anúncio
- **Monetização:** planos com limites, features premium (mais imagens, mais marketplaces, prioridade na fila IA)
- **Integração:** publicar direto via API dos marketplaces (eliminar export manual)

---

## ETAPA 8 — O QUE NÃO FAZER

- Não propor migração de Context para Redux/Zustand se o Context resolve o caso atual
- Não abstrair prematuramente os edge functions em framework (são 5, não 50)
- Não adicionar i18n agora — 100% do público é BR, foco em PT-BR perfeito primeiro
- Não refatorar ImageOverlayEditor em micro-componentes se isso quebrar a coerência do canvas state
- Não over-engineer para escala que não existe (ferramenta interna, dezenas de usuários, não milhares)

---

## FORMATO

- Headers e listas — escaneável
- Referências a arquivos e funções reais (path completo)
- Priorizado por impacto
- Acionável — não filosófico
- Respeitar todos os invariantes e arquivos imutáveis listados acima
