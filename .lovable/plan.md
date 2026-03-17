

# Plano de Implementação — Paper Shop Criador de Anúncio

## Fase 1: Estrutura Base Mobile-First

### Design System
- Atualizar `index.css` com cores Paper Shop: Paper White (#F8FAFC), Deep Ink (#0F172A), Classic Pen Blue (#3B82F6), Highlighter Yellow (#FACC15), check green (#22C55E)
- Adicionar fontes Space Grotesk (títulos) e Inter (corpo)

### Layout e Navegação
- Criar `src/components/layout/MobileLayout.tsx` — wrapper com header compacto (logo Paper Shop) + bottom tab bar
- Bottom tab bar com 2 abas: "Criar" (ícone +) e "Histórico" (ícone lista)
- Criar páginas: `src/pages/CreateListing.tsx`, `src/pages/History.tsx`
- Atualizar `App.tsx` com rotas `/create` e `/history`, redirect `/` para `/create`

### Stepper Visual
- Criar `src/components/create/StepperProgress.tsx` — barra no topo com 5 círculos
  - Concluída: check verde com animação (scale + fade in)
  - Atual: círculo azul pulsante
  - Futura: círculo cinza
  - Linha conectora entre círculos com preenchimento progressivo
- Labels curtos abaixo: Fotos, ID, Anúncios, Prompts, Export

## Fase 2: As 5 Etapas do Criador

### Etapa 1 — Upload de Fotos (`src/components/create/StepUpload.tsx`)
- Mensagem de boas-vindas: "Envie as fotos do produto e da caixa"
- Área de upload grande (drag & drop + botão) usando input file com accept="image/*"
- Grid 2 colunas com previews e botão remover
- Botão "Próximo" habilitado quando >= 1 foto

### Etapa 2 — Identificação IA (`src/components/create/StepIdentify.tsx`)
- Estado de loading com animação (Highlighter Yellow)
- Card mostrando resultado da IA: nome, categoria, características
- Campos editáveis para corrigir
- Campo opcional para especificações extras
- Botões: "Tá correto, próximo" / "Adicionar informações"
- (IA simulada inicialmente com dados mock, integração real depois)

### Etapa 3 — Anúncios (`src/components/create/StepAds.tsx`)
- Cards swipeable: Mercado Livre e Shopee
- Cada card: badge do marketplace, título editável, descrição editável
- Botão "Regenerar" por campo e "Regenerar tudo"
- Botão confirmar quando satisfeito

### Etapa 4 — Prompts + Imagens (`src/components/create/StepPrompts.tsx`)
- 7 cards de prompt, cada um com:
  - Texto do prompt copiável (botão copiar)
  - Área de upload para imagem gerada
  - Após upload: "Ficou boa" ✅ / "Refinar" 🔄 (com campo de feedback + upload da foto ruim)
- Progresso: "X/7 aprovadas"
- Botão "Copiar todos os prompts"
- Avança quando 7/7 aprovadas

### Etapa 5 — Revisão + Export (`src/components/create/StepExport.tsx`)
- Resumo visual: fotos originais, textos, imagens geradas
- Preview do conteúdo do ZIP
- Botão grande "Exportar ZIP" (usando JSZip)
- Check verde final + animação de conclusão

## Fase 3: Estado e Dados

- Criar `src/hooks/useCreateListing.ts` — hook com estado global do fluxo (etapa atual, dados de cada etapa)
- Context provider `src/context/CreateListingContext.tsx` para compartilhar estado entre etapas
- Dados mock para IA inicialmente (integração Supabase + Gemini virá depois)

## Ordem de Implementação

1. Design system + fontes + cores
2. MobileLayout + bottom tab bar + rotas
3. StepperProgress component
4. CreateListing page com stepper + navegação entre etapas
5. Etapas 1-5 sequencialmente
6. History page (lista placeholder)

Tudo responsivo mobile-first (393px como base), com animações suaves via Tailwind + CSS transitions.

