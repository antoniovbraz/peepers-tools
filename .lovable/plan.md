

## Plano: Editor de Overlay Mobile-Friendly

### Problema
O editor de overlay usa um `Dialog` que no mobile (393px) fica com scroll quebrado, conteúdo fora da viewport e inputs numéricos impossíveis de usar (sem setas −/+).

### Solução em 2 partes

---

### Parte 1 — Layout fullscreen no mobile

**Arquivo:** `ImageOverlayEditor.tsx`

Substituir o `Dialog` por renderização condicional:
- **Mobile (< 640px):** `div` fixa `fixed inset-0 z-50 bg-background` com `overflow-y-auto`, header fixo (título + botão X), canvas limitado a `max-h-[50vh]`, e botão "Salvar" sticky no bottom
- **Desktop (≥ 640px):** manter o `Dialog` atual sem mudanças

Usar o hook `useIsMobile()` já existente em `src/hooks/use-mobile.tsx`.

Estrutura mobile:
```text
┌─────────────────────┐  ← header fixo (título + X)
│  Canvas (50vh max)   │  ← touch-action: none
├─────────────────────┤
│  Toolbar (3 cols)    │
│  AI Copy button      │  ← tudo scrollável
│  Element editor      │
│  [Salvar] sticky     │
└─────────────────────┘
```

### Parte 2 — Inputs touch-friendly

**Arquivo:** `ImageOverlayEditor.tsx` (seção "Selected element editor", linhas 509-573)

| Controle | Antes | Depois |
|----------|-------|--------|
| Tamanho fonte | `<Input type="number">` | Botões `[ − ]  valor  [ + ]` (44px touch) + `<Slider>` range 8–72 |
| Rotação | `<Input type="number">` | Botões `[ −15° ]  valor  [ +15° ]` + botão reset 0° |
| Largura | Não existia | `<Slider>` range 20–90% para headlines/bullets |
| Cor / Fundo | `<Input type="color">` | Mantém (color picker nativo funciona bem) |

Componente helper inline `NumberStepper`:
```text
[ − ]   28   [ + ]
  ████████░░░░░░░░
     Slider
```

- Botões `h-11 w-11` (touch target 44px)
- Valor exibido como texto centralizado entre os botões
- Slider abaixo para ajuste fino

### Resumo de mudanças

| Mudança | Detalhe |
|---------|---------|
| Import `useIsMobile` | De `@/hooks/use-mobile` |
| Import `Slider` | De `@/components/ui/slider` |
| Import `X` | De `lucide-react` (para fechar mobile) |
| Render condicional | `isMobile ? <FullscreenEditor> : <Dialog>` |
| Canvas mobile | `max-h-[50vh] w-full` |
| NumberStepper | Componente inline para fontSize e rotation |
| Slider fontSize | Range 8–72, step 1 |
| Slider width | Range 20–90%, step 5 (headlines/bullets) |
| Rotation stepper | Step ±15°, botão reset |

**Arquivo único afetado:** `src/components/create/ImageOverlayEditor.tsx`

