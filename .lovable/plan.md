

## Plano Consolidado: Bugs + UX Mobile/Desktop

Confrontei a auditoria externa com o código atual e meu plano. Dois bugs confirmados como reais e bloqueantes. Várias sugestões de UX mobile são superiores ao que temos.

### O que incorporo da auditoria externa

| # | Item | Veredito | Razão |
|---|------|----------|-------|
| 1.1 | touchActionRef bug | **ACEITO — BUG REAL** | Linha 722: `style={{ touchAction: touchActionRef.current }}` — ref não causa re-render. O fix de scroll vs. drag está efetivamente quebrado. |
| 1.2 | Undo a cada tecla | **ACEITO — BUG REAL** | Linha 237-242: `useEffect` em `elements` chama `pushSnapshot` em toda mudança, incluindo cada caractere digitado. |
| 2.1 | Bottom Sheet mobile | **ACEITO** | Substituir o `elementEditor` inline por um `Sheet` (bottom) ao selecionar elemento. Canvas fica visível acima. Melhor que scroll. |
| 2.2 | Toolbar sticky | **ACEITO** | Mover toolbar para fora da `overflow-y-auto` div (linha 1054). Canvas + toolbar fixos, só layers rola. |
| 2.3 | Layer list colapsável | **ACEITO** | Usar `Collapsible` existente. Default colapsado com badge de count. |
| 3.1 | Hover state canvas | **ACEITO** | `hoveredId` state + outline sutil no `renderCanvas`. Baixo esforço, bom feedback visual desktop. |
| 4.1 | Simplificar layer mobile | **ACEITO** | Mobile: só checkbox + nome + delete inline. Z-index e AI vão para dentro do Sheet de propriedades. |
| 4.2 | Badge fade-out | **ACEITO** | "Arraste para mover" some após 3s. `setTimeout` + `opacity-0 transition-opacity`. |

| # | Item | Veredito | Razão |
|---|------|----------|-------|
| 3.2 | Export separado sidebar | **REJEITADO** | Já está no bottom da ScrollArea desktop (linha 1090). Separar não melhora significativamente. |
| 2.1 layout | O layout fixo proposto | **PARCIAL** | Concordo com a estrutura, mas uso Sheet em vez de redesenhar todo o mobile layout. |

### O que já estava no meu plano (mantido)

- Snap & alignment guides
- Duplicar elemento
- Text alignment (left/center/right)
- Color presets (swatches)
- Opacidade por elemento
- Double-click para foco no input
- Text styles (shadow, stroke)

---

### Plano Final de Implementação

**Sprint 1 — Bug fixes (bloqueante)**
1. **Fix touchAction**: Remover `touchActionRef`, usar `e.preventDefault()` no `handleTouchStart` (já feito parcialmente). Manter `touchAction: "pan-y"` sempre no CSS.
2. **Fix undo por tecla**: Debounce de 500ms para mudanças de texto. Snapshot imediato para add/delete/drag-end. Usar `useRef` com `setTimeout` para agrupar edições de texto.

**Sprint 2 — Mobile UX (maior impacto)**
3. **Bottom Sheet**: Ao selecionar elemento no canvas mobile → `Sheet` sobe de baixo com `elementEditor`. Ao deselecionar → Sheet fecha.
4. **Toolbar sticky**: Canvas + toolbar em `shrink-0`, só layers + AI button na área scrollável.
5. **Layer list colapsável**: `Collapsible` com badge count. Default colapsado mobile.
6. **Layer list simplificada mobile**: Só checkbox + nome + delete. Z-index e AI movidos para Sheet.
7. **Badge fade-out**: "Arraste para mover" some após 3s.

**Sprint 3 — Desktop + Cross-platform**
8. **Hover state canvas**: `hoveredId` + outline pontilhado sutil (cor diferente da seleção).
9. **Snap guides**: Linhas magnéticas em 50% (centro) e 5%/95% (margens).
10. **Duplicar elemento**: Botão na layer list + dentro do Sheet. Copia com offset +5%.
11. **Text alignment**: `textAlign` property + 3 botões (L/C/R) no elementEditor.
12. **Opacidade**: Slider 0-100% por elemento. `ctx.globalAlpha`.
13. **Color presets**: 5 swatches rápidos (headlineColor, accentColor, preto, branco, cinza).

**Sprint 4 — Polish**
14. **Double-click/tap → foco input**: Double-click no canvas foca o input de texto no Sheet/painel.
15. **Text styles**: Shadow e stroke como opções no elementEditor.

### Arquivos alterados

| Arquivo | Mudanças |
|---------|----------|
| `ImageOverlayEditor.tsx` | Todos os sprints |
| `overlayTemplates.ts` | Adicionar `opacity`, `textAlign`, `textStyle` ao tipo `OverlayElement` |

### Estimativa
- Sprint 1: ~40 linhas (bugs pontuais)
- Sprint 2: ~200 linhas (reestruturação mobile)
- Sprint 3: ~250 linhas (features novas)
- Sprint 4: ~100 linhas (polish)

