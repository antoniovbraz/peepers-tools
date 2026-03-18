

## Análise das Sugestões do Auditor

Concordo com a maioria, mas com ressalvas importantes em 2 itens. Aqui vai minha avaliação:

### Concordo e vou implementar

**1. CORS com env var** — Correto. Vou adicionar o secret `ALLOWED_ORIGIN` e usar nas 4 funções.

**2. Erro Google genérico** — Correto. `String(error)` pode expor detalhes internos. Trocar por mensagem fixa.

**4. ESLint `no-unused-vars: "warn"`** — Correto. Ajuda a detectar código morto.

**6. Remover dependências não utilizadas** — Parcialmente correto. `sonner`, `next-themes`, `@hookform/resolvers` e `zod` podem ser removidos (nenhum código ativo os importa). Porém `react-hook-form` é importado por `src/components/ui/form.tsx` (wrapper shadcn/ui) — remover quebraria a compilação. Vou manter `react-hook-form`.

**7. Apagar `sonner.tsx`** — Correto. O `App.tsx` já não importa Sonner, e o ficheiro depende de `next-themes` que também seria removido.

**8. Extrair `_shared/helpers.ts`** — Correto. Reduz duplicação nas 4 funções.

**9. Índices na tabela `listings`** — Correto. `user_id` e `created_at DESC` são usados em queries filtradas.

### Discordo

**3. `verify_jwt = true`** — O auditor desconhece uma limitação da plataforma. O sistema de signing-keys do Lovable Cloud requer `verify_jwt = false` no config.toml. A validação JWT já é feita manualmente via `getClaims()` no código. Mudar para `true` **quebraria todas as chamadas** às Edge Functions. Manter como está.

**5. `strict: true` no TypeScript** — Concordo em princípio, mas é uma mudança grande que vai gerar dezenas de erros de compilação. Recomendo fazer incrementalmente: primeiro `strictNullChecks`, depois o resto. Não vou incluir neste PR.

---

### Plano de Implementação

**Fase 1 — Segurança (3 alterações)**
- Adicionar secret `ALLOWED_ORIGIN` com o valor `https://item-story-forge.lovable.app`
- Atualizar CORS nas 4 Edge Functions para usar `Deno.env.get("ALLOWED_ORIGIN")`
- Corrigir mensagem de erro do Google login em `Auth.tsx`

**Fase 2 — Cleanup (4 alterações)**
- Apagar `src/components/ui/sonner.tsx`
- Remover pacotes: `sonner`, `next-themes`, `@hookform/resolvers`, `zod`
- Alterar ESLint: `no-unused-vars` de `"off"` para `"warn"`
- Corrigir eventuais warnings gerados pela nova regra

**Fase 3 — Backend (2 alterações)**
- Criar `supabase/functions/_shared/helpers.ts` com CORS, auth e error helpers
- Refatorar as 4 Edge Functions para usar os helpers compartilhados
- Migration SQL para criar índices em `listings(user_id)` e `listings(created_at DESC)`

### Não incluído (para PRs separados)
- `strict: true` no TypeScript (mudança grande, fazer incremental)
- `verify_jwt = true` (incompatível com a plataforma)

