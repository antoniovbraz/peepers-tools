

## Plano Consolidado — Todos os Fixes Pendentes do Editor de Overlay

### Contexto

6 issues pendentes identificados nas auditorias anteriores + os novos pedidos de alinhamento/distribuição.

---

### Fix 1 — Sheet abre ao arrastar (mobile)

**Problema**: `startDrag()` (linha 622) chama `setSheetOpen(true)` imediatamente no touchStart, antes de saber se o gesto é tap ou drag.

**Solução**: Introduzir `dragMovedRef` setado `true` no `moveDrag`. Mover `setSheetOpen(true)` para `endDrag` — só abre se `!dragMovedRef.current`. No `startDrag`, remover a linha `if (isMobile) setSheetOpen(true)`.

---

### Fix 2 — Edição em grupo de propriedades

**Problema**: Multi-seleção (checkboxes) só permite gerar texto IA, sem editar propriedades em batch.

**Solução**: Quando `checkedIds.size >= 2`, mostrar painel "Edição em grupo" com:
- Cor (swatches) — aplica a todos os checked
- Tamanho de fonte (stepper) — aplica a todos
- Bold on/off — aplica a todos
- Opacidade (slider) — aplica a todos
- Botão "Deletar selecionados"

Cada ação chama `pushStructuralSnapshot()` e faz `setElements(prev => prev.map(...))` filtrando por `checkedIds`.

---

### Fix 3 — IA não atualiza badges

**Problema**: O schema da edge function só tem `headline`, `subheadline`, `bullets`. Badges não recebem texto da IA. O client mapeia `subheadline` para badges (1 texto para todos) e cria bullets novos quando não existem.

**Solução**:
- **Edge function** (`generate-overlay-copy/index.ts`): Adicionar campo `badges` (array de strings, "Labels curtos para badges, 1-3 palavras cada") ao schema da tool. Adicionar a `required`.
- **Client** (linhas 829-869): Adicionar bloco de mapeamento `data.badges` → elementos tipo `badge`, similar ao de bullets. Remover o fallback de `subheadline` para badges. Não criar bullets novos quando o template só tem badges.

---

### Fix 4 — Snap com âncoras inteligentes

**Problema**: `getSnappedPos` (linha 185) compara apenas `el.x` (top-left) com snap lines. Centralizar coloca a borda esquerda no centro; alinhar a 95% empurra fora do canvas.

**Solução**: Criar helper `getElementSizePercent(el, ctx, W, H)` que retorna `{w, h}` em %. Refatorar `getSnappedPos` para receber `{elW, elH}` e testar 3 pontos por eixo:
- Eixo X: borda esquerda (x), centro (x + w/2), borda direita (x + w)
- Eixo Y: borda top (y), centro (y + h/2), borda bottom (y + h)

O snap escolhe o ponto mais próximo e ajusta `x` correspondentemente (ex: se centro snapa a 50%, x = 50 - w/2).

Adaptar `dragLoop` e `endDrag` para calcular o tamanho do elemento antes do snap.

---

### Fix 5 — Toolbar de alinhamento e distribuição

**Solução**: Novo componente inline com 8 botões, exibido abaixo do layer list:

**1 elemento selecionado → alinha ao canvas:**
- Esquerda: x = 2%
- Centro H: x = 50% - w/2
- Direita: x = 98% - w
- Topo: y = 2%
- Centro V: y = 50% - h/2
- Embaixo: y = 98% - h

**2+ elementos checked → alinha entre si + distribui:**
- Mesmos 6 botões usam o bounding box do grupo como referência
- Distribuir H: ordena por x, espaça igualmente
- Distribuir V: ordena por y, espaça igualmente

Todas as funções chamam `getElementSizePercent` para bounds corretos e `pushStructuralSnapshot()` antes de aplicar.

---

### Fix 6 — Clamp geral (nunca sair do canvas)

Em `moveDrag`, `endDrag`, e todas as funções de alinhamento: clampar `x` entre `0` e `100-w`, `y` entre `0` e `100-h`.

---

### Arquivos alterados

| Arquivo | Mudanças |
|---------|----------|
| `ImageOverlayEditor.tsx` | Fix 1 (drag gate), Fix 2 (group edit), Fix 3 (badge mapping), Fix 4 (smart snap), Fix 5 (alignment toolbar), Fix 6 (clamp) |
| `generate-overlay-copy/index.ts` | Fix 3 (adicionar `badges` ao schema da tool) |

### Estimativa
- Fix 1: ~10 linhas
- Fix 2: ~50 linhas (painel de grupo)
- Fix 3: ~15 linhas client + ~10 linhas edge
- Fix 4: ~30 linhas (refatorar snap + helper)
- Fix 5: ~60 linhas (toolbar + lógica de align/distribute)
- Fix 6: ~5 linhas (clamp em moveDrag/endDrag)

