

## Próximos Passos Naturais — Peepers Shop

Baseado na análise completa do código, organizei por impacto e dependência.

---

### Fase 1 — Infraestrutura de Imagens (maior gap atual)

**1.1 Upload de fotos para Storage em vez de base64**
- Criar bucket `product-photos` no Storage
- No `StepUpload`, após o usuário selecionar fotos, fazer upload para o bucket e guardar as URLs públicas
- Passar URLs (não base64) para as Edge Functions `identify-product` e `generate-image`
- Reduz payload de ~5MB por request para ~200 bytes (URLs)
- Elimina timeouts e erros de memória

**1.2 Persistir imagens geradas no Storage**
- Criar bucket `generated-images`
- Na Edge Function `generate-image`, após receber a imagem da IA, salvar no bucket e retornar URL pública (em vez de data URI)
- Permite que as imagens sobrevivam a recarregamentos de página

**1.3 Salvar imageUrls no banco**
- Alterar o `StepExport` para incluir `imageUrl` nos prompts salvos em `listings.prompts`
- Atualizar `History` para exibir imagens IA no dialog de detalhe

---

### Fase 2 — UX do Step Prompts

**2.1 Botão "Gerar Todas as Imagens"**
- Adicionar botão no topo do `StepPrompts` que gera as 7 imagens em sequência (não paralelo, para não sobrecarregar)
- Mostrar progresso: "Gerando 3/7..."
- Permitir cancelar no meio

**2.2 Auto-regenerar com feedback**
- Quando o usuário salva feedback e clica "Salvar feedback", já disparar a regeneração automaticamente em vez de exigir clique extra

---

### Fase 3 — Identidade Visual

**3.1 Paleta de cores Peepers Shop**
- Extrair verde e amarelo do logo
- Atualizar `tailwind.config.ts` e `index.css` com as cores primárias e de acento
- Aplicar nos botões, badges, header e tela de login

---

### Fase 4 — Melhorias opcionais

- **Amazon BR** como terceiro marketplace no `StepAds`
- **PWA manifest** para instalação como app no celular
- **Re-editar listing** do histórico (carregar dados de volta no wizard)

---

### Ordem recomendada de implementação
1. Storage para fotos (1.1) — elimina o maior risco técnico
2. Gerar todas (2.1) — maior ganho de UX
3. Persistir imagens (1.2 + 1.3) — completa o ciclo
4. Paleta de cores (3.1) — identidade visual
5. Opcionais conforme necessidade

### Ficheiros principais afetados
- `src/components/create/StepUpload.tsx` — upload para Storage
- `src/components/create/StepPrompts.tsx` — botão gerar todas
- `src/components/create/PromptCardItem.tsx` — auto-regenerar
- `supabase/functions/generate-image/index.ts` — salvar no Storage
- `src/pages/History.tsx` — exibir imagens
- `tailwind.config.ts` + `src/index.css` — paleta
- Migration SQL — buckets + políticas de Storage

