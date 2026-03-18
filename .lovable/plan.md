

## Plano: Arquitetura Híbrida Visual DNA + Editor de Overlay

### Conceito

O sistema atual gera 7 imagens limpas com IA. A proposta adiciona duas camadas:

1. **Visual DNA** — objeto de estilo compartilhado que garante consistência visual entre as 7 imagens (mesma iluminação, fundo, paleta, tom)
2. **Editor de Overlay** — componente frontend Canvas que aplica texto, ícones e efeitos visuais sobre as imagens limpas geradas pela IA

A imagem #1 (Cover) permanece limpa. As imagens #2–#7 passam pelo editor de overlay antes da exportação.

---

### Parte 1 — Visual DNA no Backend

**Arquivo:** `supabase/functions/generate-prompts/index.ts`

Antes de gerar os 7 prompts, a IA deve criar internamente um "Visual DNA" que define:
- Estilo de fundo (ex: soft white gradient)
- Direção de iluminação (ex: key light upper-left)
- Paleta de cores consistente
- Rendering style (ultra realistic commercial photography)

Adicionar ao system prompt uma instrução para que a IA retorne, além dos 7 prompts, um objeto `visualDNA` via tool call:

```json
{
  "visualDNA": {
    "background": "soft white to light grey gradient",
    "lighting": "soft studio, key light upper-left, rim light on edges",
    "style": "ultra realistic commercial photography",
    "tone": "premium, clean, minimal"
  },
  "prompts": ["...", "...", "..."]
}
```

Cada prompt já herda automaticamente o Visual DNA porque o system prompt força isso.

**Arquivo:** `src/context/CreateListingContext.tsx`

Adicionar campo `visualDNA` ao `ListingData` para persistir o estilo da campanha.

---

### Parte 2 — Editor de Overlay (Frontend)

**Novo componente:** `src/components/create/ImageOverlayEditor.tsx`

Um editor Canvas (usando HTML5 Canvas API) que permite ao usuário sobrepor elementos sobre a imagem limpa da IA:

**Elementos disponíveis:**
- **Texto** — headline (bold, grande), subheadline, bullets (3-5 itens)
- **Ícones** — ícones minimalistas de features (usando Lucide)
- **Efeitos** — setas indicativas, círculos de zoom/destaque, glow highlights

**Funcionalidades:**
- Drag & drop para posicionar elementos
- Presets por tipo de imagem (#2 Benefits = headline + bullets layout, #4 Close-up = zoom circles, etc.)
- Paleta de cores derivada do Visual DNA (headline: navy escuro, accent: dourado)
- Preview em tempo real
- Botão "Exportar como imagem final" (Canvas → PNG → Storage)

**Integração no fluxo:**
- No `PromptCardItem`, após aprovar uma imagem, mostrar botão "Adicionar texto/efeitos"
- Abre o `ImageOverlayEditor` como modal/sheet
- Resultado salvo como nova URL no Storage (imagem composta)

---

### Parte 3 — Templates por Tipo de Imagem

**Novo arquivo:** `src/lib/overlayTemplates.ts`

Templates pré-configurados para cada tipo de imagem:

| # | Tipo | Template padrão |
|---|------|----------------|
| 1 | Cover | Sem overlay (imagem limpa) |
| 2 | Benefícios | Headline + 3-5 bullets à esquerda |
| 3 | Features | Ícones + labels ao redor do produto |
| 4 | Close-up | Círculos de zoom + setas |
| 5 | Lifestyle | Badge de texto discreto |
| 6 | Portabilidade | Indicador de escala |
| 7 | Conteúdo | Labels nos itens inclusos |

O usuário pode usar o template como ponto de partida e ajustar.

---

### Parte 4 — Geração de Copy para Overlays

**Nova Edge Function:** `supabase/functions/generate-overlay-copy/index.ts`

Gera automaticamente o texto de marketing (em português) para cada overlay:
- Recebe: nome do produto, características, tipo de imagem (#2-#7)
- Retorna: headline, subheadline, bullets
- Usa o Visual DNA para manter tom consistente

O texto é pré-preenchido no editor, mas editável pelo usuário.

---

### Parte 5 — Export Atualizado

**Arquivo:** `src/components/create/StepExport.tsx`

O ZIP final inclui duas pastas:
- `imagens_limpas/` — as 7 imagens originais da IA
- `imagens_finais/` — as imagens com overlay aplicado (prontas para upload no marketplace)

---

### Resumo de Ficheiros

| Ação | Arquivo |
|------|---------|
| Editar | `supabase/functions/generate-prompts/index.ts` — adicionar Visual DNA |
| Editar | `src/context/CreateListingContext.tsx` — campo visualDNA + overlayUrls |
| Criar | `src/components/create/ImageOverlayEditor.tsx` — editor Canvas |
| Criar | `src/lib/overlayTemplates.ts` — templates por tipo |
| Criar | `supabase/functions/generate-overlay-copy/index.ts` — copy de marketing |
| Editar | `src/components/create/PromptCardItem.tsx` — botão "Adicionar texto" |
| Editar | `src/components/create/StepExport.tsx` — exportar imagens com overlay |

### Dependências
- Nenhuma lib externa necessária (Canvas API nativa)
- Lucide icons já disponível para ícones de features

### Ordem de implementação
1. Visual DNA no generate-prompts (backend)
2. Overlay templates (dados)
3. Generate overlay copy (edge function)
4. ImageOverlayEditor (componente principal)
5. Integração no PromptCardItem
6. Export atualizado

