

## Plano: Overlay Editor Inteligente

### Problemas Atuais

1. **IA gera copy genérico** — sem contexto das outras imagens, resulta em textos repetidos entre overlays
2. **Tudo ou nada** — o botão "Gerar texto com IA" sobrescreve TODOS os elementos de uma vez, sem controle granular
3. **UX do editor limitada** — lista de elementos não visível, seleção só por clique no canvas (hit area de 50px), sem undo, sem layer list
4. **Reset ao reabrir** — `useEffect` no `open` reseta `elements` para o template default, perdendo edições anteriores
5. **Canvas sem rAF** — drag causa setState a cada pixel (já diagnosticado no Sprint 2 mas não implementado)

---

### Arquitetura das Mudanças

#### 1. IA Contextual e Não-Repetitiva (Edge Function)

**Arquivo:** `supabase/functions/generate-overlay-copy/index.ts`

- Aceitar novo campo `previousCopies: string[]` no body — array com headlines/bullets já gerados nas outras imagens
- Adicionar instrução no system prompt: "NEVER repeat or paraphrase headlines/bullets already used. Each image must highlight a DIFFERENT angle."
- Incluir a lista de copies anteriores no user prompt como contexto negativo

#### 2. Geração Seletiva por Elemento (Frontend)

**Arquivo:** `ImageOverlayEditor.tsx`

- Adicionar checkbox de seleção em cada elemento da layer list
- Botão "Gerar texto com IA" agora gera APENAS para elementos selecionados (ou todos se nenhum selecionado)
- Cada elemento de texto ganha um mini botão de IA inline (ícone Sparkles) para regenerar individualmente
- O `generateCopy` recebe `targetElementIds: string[]` e só sobrescreve esses

#### 3. Layer List Visual

**Arquivo:** `ImageOverlayEditor.tsx`

- Criar painel de layers abaixo do toolbar com lista dos elementos atuais
- Cada item mostra: ícone do tipo, preview do texto (truncado), checkbox de seleção para IA, botão delete
- Click na layer seleciona o elemento no canvas (highlight visual)
- Drag-to-reorder (opcional, futuro)

#### 4. Persistir Estado do Editor

**Arquivo:** `ImageOverlayEditor.tsx` + `CreateListingContext.tsx`

- Guardar `elements[]` por imageIndex no context (novo campo `overlayElements: Record<number, OverlayElement[]>`)
- Ao reabrir o editor, restaurar elementos salvos em vez de resetar para template default
- Template default só é usado na primeira abertura

#### 5. Canvas Performance (rAF)

**Arquivo:** `ImageOverlayEditor.tsx`

- Usar `useRef` para posição de drag em vez de `setState` a cada pixel
- `requestAnimationFrame` para throttle do redraw
- Commit final no `mouseUp`/`touchEnd`

---

### Mudanças por Arquivo

| Arquivo | Mudanças |
|---------|----------|
| `supabase/functions/generate-overlay-copy/index.ts` | Aceitar `previousCopies`, `targetElements`, instrução anti-repetição |
| `src/components/create/ImageOverlayEditor.tsx` | Layer list, geração seletiva, mini botão IA por elemento, rAF drag, persistência de estado |
| `src/context/CreateListingContext.tsx` | Novo campo `overlayElements: Record<number, OverlayElement[]>`, métodos `updateOverlayElements` |
| `src/lib/overlayTemplates.ts` | Sem mudanças |

### UX do Editor Melhorado

```text
┌─────────────────────────────────────────┐
│ Editor de Overlay — Benefícios      [X] │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │         [Canvas 1080x1080]          │ │
│ │     arraste elementos no canvas     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Título] [+ Bullet] [+ Badge] ...    │
│                                         │
│ ── Elementos ──────────────────────────│
│ ☑ 📝 "Conforto Garantido"    [✨][🗑] │
│ ☑ 📝 "✓ Benefício 1"         [✨][🗑] │
│ ☐ 📝 "✓ Benefício 2"         [✨][🗑] │
│ ☑ 🏷️ "Badge texto"           [✨][🗑] │
│                                         │
│ [✨ Gerar IA p/ selecionados (2)]       │
│                                         │
│ ── Propriedades (se selecionado) ──    │
│ Texto: [________________]               │
│ Tamanho: [- 28 +] ══════○══            │
│ Cor: [██]                               │
│                                         │
│ [💾 Salvar imagem com overlay]          │
└─────────────────────────────────────────┘
```

### Opinião Técnica — O que torna o editor "perfeito"

1. **Layer list é obrigatória** — clicar em canvas de 50px de hit area é frustrante; lista de layers resolve discovery e seleção
2. **IA seletiva é diferencial** — competidores fazem tudo-ou-nada; deixar o usuário escolher quais textos regenerar dá controle sem tirar automação
3. **Contexto entre imagens é crítico** — passar `previousCopies` evita o problema #1 (textos repetidos) que é o maior irritante do editor atual
4. **Persistir estado elimina retrabalho** — usuário que ajustou posições e textos não pode perder ao fechar/reabrir
5. **rAF no drag** — sem isso, arrastar elementos em mobile é inutilizável (jank visível)

### O que NÃO fazer agora
- Undo/redo (complexidade alta, baixo ROI neste estágio)
- Drag-to-reorder layers (nice-to-have futuro)
- Templates prontos de layout (feature separada, P2)
- Fontes customizadas (Inter é suficiente para marketplaces)

