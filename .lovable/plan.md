

## Avaliação da Auditoria de Responsividade

### Diagnóstico: Correto

A auditoria acerta no ponto principal: a aplicação é mobile-only. Nenhum componente além do `ImageOverlayEditor` usa breakpoints. O `MobileLayout` é o shell único. Conteúdo estica 100% em telas grandes.

### Minha avaliação item a item

| Item | Veredito | Comentário |
|---|---|---|
| **Fase 1: AppLayout** | **ACEITO** | Fundação obrigatória. Opção A (sidebar customizada) é melhor — mais leve, sem overhead do `SidebarProvider`. |
| **Fase 1: App.tsx update** | **ACEITO** | Trivial após AppLayout. |
| **Fase 1: Container max-w** | **ACEITO** | `max-w-3xl mx-auto` no wizard, `max-w-7xl` no History. |
| **Fase 1: Remover MobileLayout** | **ACEITO** | Substituir, não manter como alias. |
| **Fase 2: CreateListing container** | **ACEITO** | Uma linha. |
| **Fase 2: StepperProgress** | **ACEITO** | `md:text-xs` + `md:px-8`. Trivial. |
| **Fase 2: StepUpload grid** | **ACEITO** | `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`. |
| **Fase 2: StepIdentify 2-col** | **ACEITO** | Nome + Categoria lado a lado no desktop. |
| **Fase 2: StepAds 2-col** | **ACEITO** | ML + Shopee lado a lado. |
| **Fase 2: StepPrompts 2-col** | **ACEITO** | Prompt cards em grid. |
| **Fase 2: StepExport 2-col** | **ACEITO** | Review cards em grid. |
| **Fase 3: History grid** | **ACEITO** | 1/2/3 colunas + dialog wider. |
| **Fase 3: Auth split-screen** | **ACEITO** | Branding panel à esquerda no desktop. Boa impressão visual. |
| **Fase 4: touchAction bug** | **JA CORRIGIDO** | Já implementamos `touchAction: "pan-y"` fixo + `e.preventDefault()` no sprint anterior. Verificar se está de fato aplicado. |
| **Fase 4: Undo debounce** | **JA CORRIGIDO** | Já implementamos `textDebounceRef` com 500ms no sprint anterior. Verificar. |
| **Fase 5: Padding responsivo** | **ACEITO** | `px-4 sm:px-6` em todos os steps. |
| **Fase 5: Tipografia** | **ACEITO** | `text-xl md:text-2xl` nos títulos. |
| **Fase 5: Botões desktop** | **ACEITO** | Auto-width + align-right no desktop. |
| **Fase 5: Hover states** | **ACEITO** | `hover:shadow-md` nos cards. |
| **Fase 5: Upload text** | **ACEITO** | "Clique" vs "Toque". |

### Plano de Implementação

**Fase 1 — Fundação (bloqueante, fazer primeiro)**

1. Criar `src/components/layout/AppLayout.tsx` com `useIsMobile()`:
   - Mobile: exatamente o layout atual do MobileLayout (header + bottom tabs)
   - Desktop: sidebar lateral (240px) + header com PageTitle + content area com `max-w`
   - Opção A (sidebar customizada, sem SidebarProvider)

2. Atualizar `App.tsx`: trocar `MobileLayout` por `AppLayout`

3. Deletar `MobileLayout.tsx`

**Fase 2 — Steps do Wizard (todas independentes)**

4. `CreateListing.tsx`: `max-w-3xl mx-auto`
5. `StepperProgress.tsx`: `md:text-xs`, `md:px-8`
6. `StepUpload.tsx`: grid responsivo + padding `sm:px-6` + "Clique" no desktop
7. `StepIdentify.tsx`: Nome/Categoria em `md:grid-cols-2`
8. `StepAds.tsx`: ML/Shopee em `lg:grid-cols-2`
9. `StepPrompts.tsx`: cards em `lg:grid-cols-2`
10. `StepExport.tsx`: review cards em `md:grid-cols-2`

**Fase 3 — Standalone pages**

11. `History.tsx`: grid 1/2/3 colunas + `max-w-7xl` + dialog wider
12. `Auth.tsx`: split-screen desktop com branding panel

**Fase 4 — Polish**

13. Padding responsivo global (`sm:px-6`)
14. Tipografia responsiva (`md:text-2xl`)
15. Botões desktop: auto-width, align-right
16. Hover states nos cards
17. Verificar que bugs do Overlay Editor (touchAction + undo) estao de fato corrigidos

### Arquivos alterados

| Arquivo | Acao |
|---|---|
| `src/components/layout/AppLayout.tsx` | CRIAR |
| `src/components/layout/MobileLayout.tsx` | DELETAR |
| `src/App.tsx` | Trocar import |
| `src/pages/CreateListing.tsx` | max-w-3xl |
| `src/components/create/StepperProgress.tsx` | breakpoints |
| `src/components/create/StepUpload.tsx` | grid + padding + texto |
| `src/components/create/StepIdentify.tsx` | grid 2-col |
| `src/components/create/StepAds.tsx` | grid 2-col |
| `src/components/create/StepPrompts.tsx` | grid 2-col |
| `src/components/create/StepExport.tsx` | grid 2-col |
| `src/pages/History.tsx` | grid + max-w + dialog |
| `src/pages/Auth.tsx` | split-screen desktop |

### Estimativa
- Fase 1: ~120 linhas (AppLayout novo)
- Fase 2: ~30 linhas total (maioria 1-2 linhas de Tailwind por arquivo)
- Fase 3: ~60 linhas (History grid + Auth split)
- Fase 4: ~20 linhas (polish CSS)

### O que descarto / ajusto
- **Fase 4 bugs do overlay**: ja implementados nos sprints anteriores, so verificar
- **Opção B (SidebarProvider)**: rejeitada — overhead desnecessario para 2 itens de nav
- **page-container utility CSS**: nao vale a pena, Tailwind inline e mais explicito

