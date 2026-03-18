

## Plano: Enviar fotos originais do produto junto com o prompt para geração fiel de imagens

### Problema atual
A edge function `generate-image` recebe apenas o texto do prompt. A IA não vê o produto real, então gera um produto inventado. Precisamos enviar as fotos originais do produto como referência visual.

### Mudanças necessárias

#### 1. Converter fotos para base64 no frontend
As fotos do produto estão como `File` objects no contexto (`data.photos`) e como blob URLs (`data.photoUrls`). Para enviar à edge function, precisamos converter para base64 data URLs. Isso será feito no `PromptCardItem` ao chamar `generateImage`.

**Arquivo:** `src/components/create/PromptCardItem.tsx`
- Adicionar prop `photoUrls: string[]` (as URLs das fotos originais do contexto)
- No `generateImage`, enviar `photoUrls` junto com o `prompt` no body da requisição

**Arquivo:** `src/components/create/StepPrompts.tsx`
- Passar `data.photoUrls` como prop para cada `PromptCardItem`

#### 2. Atualizar a edge function `generate-image` para receber fotos de referência
**Arquivo:** `supabase/functions/generate-image/index.ts`
- Receber `photoUrls` (array de data URLs ou URLs públicas) além do `prompt`
- Construir o conteúdo da mensagem como multimodal: imagens de referência + texto do prompt
- Adicionar instrução explícita ao prompt: "Use these reference photos of the actual product. Generate an image that faithfully represents THIS EXACT product."

#### 3. Refinar o system prompt dos prompts gerados
**Arquivo:** `supabase/functions/generate-prompts/index.ts`  
- Ajustar os prompts gerados para incluírem instruções de fidelidade ao produto original (ex: "based on the reference photos provided, maintain exact product appearance, colors, shape, branding")

#### 4. Converter blob URLs para base64 antes de enviar
Como as `photoUrls` são blob URLs locais (criadas com `URL.createObjectURL`), precisamos converter os `File` objects para base64 data URLs. Vamos:
- Passar `photos: File[]` do contexto para o `PromptCardItem`
- Criar uma função utilitária `fileToBase64` que converte `File` → `data:image/...;base64,...`
- Enviar no máximo 2-3 fotos (para não estourar limites de payload)

### Fluxo final
1. Usuário clica "Gerar com IA" em um prompt card
2. Frontend converte até 3 fotos originais para base64
3. Envia para `generate-image` com `{ prompt, photoUrls: [base64...] }`
4. Edge function monta mensagem multimodal: fotos de referência + prompt textual com instrução de fidelidade
5. IA gera imagem baseada no produto real

### Detalhes técnicos
- Modelo: `google/gemini-3.1-flash-image-preview` (já suporta input multimodal + geração de imagem)
- Limite: enviar no máximo 3 fotos de referência para manter payload razoável
- O prompt será prefixado com: "Reference photos of the actual product are attached. Generate an image that faithfully represents THIS EXACT product with its real appearance, colors, shape and branding."

