

## Plano Revisado: Copywriting Profissional para ML e Shopee

### Correções baseadas no seu feedback

1. **Mercado Livre — Título SEM marca/modelo**: Fórmula passa a ser `Produto + Palavra-chave de cauda longa` (conforme orientação oficial do evento ML). Marcas e modelos ficam de fora porque são importadores/multifornecedores.
2. **Fontes**: Descarto os blogs de SEO genéricos. As regras seguem a orientação direta do Mercado Livre (evento oficial) + documentação da Central do Vendedor ML e Shopee Seller Center.

### Novo system prompt (resumo das regras)

**Mercado Livre:**
- Título: `Produto + Palavra-chave de cauda longa` (até 60 chars)
- NÃO incluir marca ou modelo no título
- Palavra-chave principal no início
- Descrição: Framework AIDA — gancho de benefício, bullets com vantagens práticas, CTA com urgência leve
- Parágrafos curtos, linguagem direta, sem blocos densos
- Gatilhos: garantia, nota fiscal, envio rápido

**Shopee:**
- Título: `Produto + Keyword principal + Diferencial técnico + Variação` (até 120 chars)
- SEM termos apelativos ("O Melhor", "Promoção") — algoritmo penaliza
- Descrição casual com emojis estratégicos, bullets claros, especificações + uso prático
- CTA direto

**Ambos:**
- Tags de palavras-chave sugeridas (array) para SEO adicional
- Foco em benefícios reais, não características técnicas brutas

### Mudança técnica

Arquivo único: `supabase/functions/generate-ads/index.ts`
- Reescrever o system prompt (linhas 36-40) com as regras acima
- Expandir o schema do tool call para incluir `tags: string[]` em cada marketplace
- Adicionar campo `tags` ao tipo `AdData` em `CreateListingContext.tsx`
- Exibir tags como badges editáveis em `StepAds.tsx`

### Ficheiros afetados
| Ação | Arquivo |
|------|---------|
| Editar | `supabase/functions/generate-ads/index.ts` — system prompt + schema |
| Editar | `src/context/CreateListingContext.tsx` — tipo AdData com tags |
| Editar | `src/components/create/StepAds.tsx` — exibir tags sugeridas |

