

## Auditoria Mobile-First e Frontend — Resultados e Plano de Correção

### Problemas Encontrados

**1. Stepper usa classe CSS inexistente**
- `StepperProgress.tsx` linha 37: usa `animate-pulse-blue` mas essa classe nunca foi definida em `index.css`. Apenas `animate-pulse-green` existe.
- **Correção**: Trocar para `animate-pulse-green` ou criar a animação `pulse-blue` no CSS.

**2. Botão "Voltar" ausente nos Steps 1 e 2**
- `StepUpload` (Step 0) não tem botão voltar (aceitável, é o primeiro).
- `StepIdentify` (Step 1) não tem botão voltar — deveria ter para retornar ao upload.
- **Correção**: Adicionar botão `goBack` no `StepIdentify`, alinhado como em `StepAds`.

**3. Bottom nav overlap com conteúdo**
- `MobileLayout` tem `pb-20` no `<main>`, mas o nav tem `py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]`. Em devices com safe area grande (iPhones), o padding pode não ser suficiente.
- **Correção**: Aumentar `pb-20` para `pb-24` para dar margem segura.

**4. ImageOverlayEditor Dialog ocupa tela inteira mas não é mobile-otimizado**
- O Dialog usa `max-w-[95vw] max-h-[95vh]` que é bom, mas o canvas fica minúsculo em mobile (393px viewport). A toolbar com 6 botões + propriedades do elemento fica apertada.
- **Correção**: No mobile, usar Sheet (bottom sheet) em vez de Dialog centrado, e reorganizar toolbar em 2 linhas.

**5. Textarea e Input sem `autoComplete` e sem labels acessíveis**
- Inputs em `StepIdentify` e `StepAds` usam `<label>` como texto visual mas sem `htmlFor` ligando ao input.
- **Correção**: Adicionar `id` aos inputs e `htmlFor` nos labels.

**6. Botão "Confirmar" muito alto no StepAds e StepIdentify**
- `h-14` é bom para toque, mas o texto "Tá correto, próximo" + ícone Check + ícone ArrowRight é muito conteúdo para uma linha em tela estreita.
- **Correção**: Simplificar o texto para "Confirmar" em mobile.

**7. History Dialog sem max-width mobile**
- `DialogContent` padrão usa `max-w-lg` que pode ultrapassar a tela em viewports < 393px. O componente base já lida com `w-full`, mas imagens no grid `grid-cols-2` podem causar overflow horizontal.
- **Correção**: Adicionar `overflow-hidden` nas imagens do dialog.

**8. StepExport — Botão "Salvar" e "Baixar ZIP" sem feedback visual de sucesso**
- Após salvar com sucesso, a UI fica igual. Deveria mostrar estado de "salvo" ou desabilitar o botão.
- **Correção**: Adicionar estado `saved` e mudar botão para "Salvo ✓" após sucesso.

**9. Auth page — Sem tratamento de teclado virtual**
- Em mobile, quando o teclado abre, o formulário pode ficar coberto. Não há `scroll-into-view` automático.
- **Correção**: Usar `min-h-[100dvh]` no container Auth e garantir scroll.

**10. Canvas touch drag conflita com scroll da página**
- O canvas tem `touchAction: "none"` o que é correto para drag, mas pode travar o scroll se o usuário tocar no canvas sem querer arrastar.
- Aceitável como está, mas documentar comportamento.

---

### Plano de Implementação

| # | Correção | Arquivo | Prioridade |
|---|----------|---------|------------|
| 1 | Corrigir `animate-pulse-blue` → `animate-pulse-green` | StepperProgress.tsx | Alta |
| 2 | Adicionar botão Voltar no StepIdentify | StepIdentify.tsx | Média |
| 3 | Aumentar padding bottom do main para `pb-24` | MobileLayout.tsx | Média |
| 4 | Melhorar toolbar do overlay editor para mobile (2 linhas) | ImageOverlayEditor.tsx | Média |
| 5 | Adicionar `htmlFor`/`id` nos labels e inputs | StepIdentify, StepAds | Baixa |
| 6 | Simplificar texto do botão confirmar | StepIdentify.tsx | Baixa |
| 7 | Adicionar `overflow-hidden` no grid de imagens do History dialog | History.tsx | Baixa |
| 8 | Estado "Salvo" no botão de exportação | StepExport.tsx | Média |
| 9 | Usar `min-h-[100dvh]` na Auth page | Auth.tsx | Baixa |

