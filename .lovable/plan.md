

## Auditoria Completa do Editor de Overlay

### BUG CRÍTICO ENCONTRADO: Deseleção ao editar texto

**Causa raiz identificada** — ciclo de dependência no `useEffect` de carregamento (linha 267-278):

```text
1. Usuário digita no Input
2. updateElementText → setElements(new)
3. Persist effect (linha 281) → updateOverlayElements(imageIndex, elements)
4. Context atualiza data.overlayElements
5. getOverlayElements recebe NOVA referência (useCallback depende de data.overlayElements)
6. Load effect (linha 267) re-executa porque getOverlayElements está nas deps
7. setSelectedId(null) → DESELEÇÃO!
```

Isso explica exatamente o comportamento: cada keystroke no Input dispara o ciclo e reseta a seleção.

### Bug 2: Layout desktop mal distribuído

Na screenshot, a coluna direita de 320px tem os controles apertados. O `grid-cols-3` no toolbar cria botões muito comprimidos. O `elementEditor` com todos os controles (Bold, Align L/C/R, Normal/Sombra/Contorno) em `flex-wrap` fica caótico em 320px. Além disso, o `ScrollArea` com `max-h-[calc(95vh-120px)]` pode cortar conteúdo.

### Outros problemas encontrados na auditoria

| # | Problema | Severidade |
|---|----------|-----------|
| 3 | Slider de fontSize dispara `updateElement` (sem snapshot) a cada pixel arrastado — enche o undo stack e causa jank | Médio |
| 4 | `NumberStepper` para fontSize chama `pushStructuralSnapshot` a cada clique, mas Slider não — comportamento inconsistente | Baixo |
| 5 | `textInputRef` é um único ref compartilhado — se tiver 2+ campos de texto no futuro, falha | Baixo |
| 6 | Export limpa seleção para render limpo mas não restaura (`savedSelected` nunca é usado) | Baixo |

---

### Plano de Correção

**Fix 1 — Bug de deseleção (CRÍTICO)**

Quebrar o ciclo: o `useEffect` de carregamento (linha 267) só deve executar quando `open` muda de `false→true` ou `imageIndex` muda. Remover `getOverlayElements` das deps e usar um ref para evitar re-execuções espúrias.

```
// Usar ref para controlar quando recarregar
const prevOpenRef = useRef(false);

useEffect(() => {
  if (!open) { prevOpenRef.current = false; return; }
  if (prevOpenRef.current) return; // já carregou, não recarregar
  prevOpenRef.current = true;
  
  const saved = getOverlayElements(imageIndex);
  // ... resto igual
  setSelectedId(null);
}, [open, imageIndex]); // SEM getOverlayElements nas deps
```

**Fix 2 — Layout desktop**

- Coluna direita: `320px` → `340px` 
- Toolbar: `grid-cols-3` → `grid-cols-2` (6 botões = 3 rows, mais legível)
- Grupo Bold/Align/TextStyle: separar em rows distintas ao invés de `flex-wrap`
- Canvas: garantir que ocupa o máximo da coluna esquerda

**Fix 3 — Slider fontSize sem snapshot flood**

Usar `onValueCommit` do Radix Slider (dispara no mouseUp) para pushSnapshot, em vez de `onValueChange` para cada pixel.

**Fix 4 — Restaurar seleção após export**

Usar o `savedSelected` que já é declarado mas nunca restaurado.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `ImageOverlayEditor.tsx` | Todos os 4 fixes |

### Estimativa
- Fix 1: ~10 linhas (crítico, resolve o problema principal)
- Fix 2: ~20 linhas (layout adjustments)
- Fix 3: ~5 linhas
- Fix 4: ~3 linhas

