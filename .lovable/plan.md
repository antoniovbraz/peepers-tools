

## Auditoria do Overlay Editor — Minha Avaliação

Concordo com a maioria dos pontos. Vou categorizar cada item com minha opinião e ajustes:

### Concordo totalmente (implementar)

| # | Item | Justificativa |
|---|------|---------------|
| 1.1 | Aspect ratio canvas mobile | `max-h-[50vh]` + `w-full` realmente quebra 1:1. Container `aspect-square` com `min(width, 50vh)` resolve. |
| 1.2 | Hit target maior | Raio 50px em 1080-space = ~17px mobile. Escalar para `isMobile ? 120 : 50` é correto. |
| 1.3 | Scroll vs drag | `touchAction: "none"` trava scroll. O código já faz `preventDefault` condicional no `touchStart`, mas `touchAction: "none"` no CSS bloqueia antes. Fix: `pan-y` default, `none` só durante drag ativo. |
| 1.5 | Seleção invisível | `strokeRect(px-6, py-6, 12, 12)` é um quadradinho fixo de 12px em 1080-space. Precisa bounding box real por tipo. |
| 2.1 | Layout 2 colunas desktop | `max-w-2xl` empilhado desperdiça espaço. `max-w-5xl` + `grid-cols-[1fr_320px]` é o layout correto. |
| 2.2 | Atalhos de teclado | Delete, Escape, Arrows — essenciais para editor visual. Baixo esforço, alto impacto. |
| 2.3 | X/Y numérico | Já temos `NumberStepper` no código. Adicionar para posição é trivial. |
| 3.1 | Hit test por bounding box | Ponto-a-ponto é impreciso. `measureText` para texto, raio para círculo, box para badge. |
| 3.2 | Toggle bold | `bold` existe no modelo, falta UI. Trivial. |
| 3.4 | Font loading | `document.fonts.ready` antes do render é uma linha. |
| 4.1 | Touch targets layer list | Botões `h-7 w-7` são 28px, abaixo do mínimo 44px. Aumentar para `h-9 w-9`. |

### Concordo parcialmente (ajustar escopo)

| # | Item | Minha posição |
|---|------|---------------|
| 1.4 | Teclado virtual | `scrollIntoView` ajuda, mas `visualViewport API` é over-engineering. Implementar só o `scrollIntoView` + mover input para fora do canvas area. |
| 3.3 | Undo/Redo | Concordo que é importante, mas a auditoria já marca como "pode ser diferido". Implementar versão simples: array de snapshots com `Ctrl+Z` / `Ctrl+Shift+Z`, limite 20. |
| 4.2 | Reordenação z-index | Útil mas baixa prioridade. Botões up/down na layer list, implementar se sobrar tempo. |

### Plano de Implementação (4 fases como proposto)

**Fase 1 — Mobile Critical** (prioridade máxima)
- Canvas em container `aspect-square` com dimensão dinâmica
- Hit target escalado por viewport (`isMobile ? 120 : 50`)
- `touchAction: "pan-y"` default, `"none"` só durante drag
- `scrollIntoView` no foco de inputs
- Bounding box real para indicador de seleção

**Fase 2 — Desktop UX**
- Dialog `max-w-5xl` com `grid grid-cols-[1fr_320px]` (canvas | controles)
- Atalhos: Delete, Escape, Arrow keys (1%/5% com Shift)
- NumberStepper para X/Y no painel de propriedades

**Fase 3 — Qualidade Cross-platform**
- Hit test por bounding box real (measureText, radius, padded box)
- Toggle Bold na UI
- Undo/Redo simples (snapshot stack, Ctrl+Z)
- `document.fonts.ready` antes do primeiro render

**Fase 4 — Polimento**
- Layer list touch targets `h-9 w-9` + `py-2.5`
- Botões up/down para z-index na layer list

### Arquivos alterados
- `src/components/create/ImageOverlayEditor.tsx` — todas as fases
- Nenhum outro arquivo precisa mudar

### Estimativa
- Fase 1: ~300 linhas de mudança
- Fase 2: ~150 linhas
- Fase 3: ~200 linhas
- Fase 4: ~50 linhas

