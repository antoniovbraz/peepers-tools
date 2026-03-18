

## Plano de Implementação — Segurança, Cleanup e Backend

### Sobre o ALLOWED_ORIGIN

O valor que você deve inserir é simplesmente a URL publicada do seu app:

```
https://item-story-forge.lovable.app
```

Quando eu pedir, basta colar esse valor. O CORS dinâmico vai aceitar automaticamente tanto essa URL quanto os previews do Lovable (que terminam em `.lovable.app` ou `.lovableproject.com`).

---

### O que será feito

**1. Corrigir erros de build (imediato)**
- Deletar 8 ficheiros UI órfãos: `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `command.tsx`, `drawer.tsx`, `input-otp.tsx`, `resizable.tsx`, `sonner.tsx`
- Remover pacotes do `package.json`: `sonner`, `next-themes`, `@hookform/resolvers`, `zod`

**2. Adicionar secret ALLOWED_ORIGIN**
- Pedir para você inserir o valor `https://item-story-forge.lovable.app`

**3. Criar helpers compartilhados para Edge Functions**
- Novo ficheiro: `supabase/functions/_shared/helpers.ts`
  - `getCorsHeaders(req)` — CORS dinâmico baseado no origin (aceita produção + previews Lovable)
  - `authenticate(req)` — extrai e valida JWT via getClaims
  - `errorResponse(message, status, corsHeaders)` — resposta de erro padronizada

**4. Refatorar as 4 Edge Functions**
- `identify-product`, `generate-ads`, `generate-prompts`, `generate-image`
- Substituir código duplicado (CORS, auth, error handling) por imports do `_shared/helpers.ts`

**5. Corrigir Auth.tsx**
- Linha 60: trocar `String(error)` por mensagem genérica fixa

**6. ESLint config**
- Mudar `no-unused-vars` de `"off"` para `"warn"`

**7. Migration SQL — índices na tabela listings**
- `CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);`
- `CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);`

