

## Próximos Passos Naturais

O projeto já tem o fluxo core funcionando (upload → identificação IA → anúncios IA → prompts IA → exportar). Aqui estão os próximos passos lógicos, em ordem de impacto:

### 1. Corrigir o erro de build atual
O projeto não compila por dependências ausentes (`rollup`, `@tanstack/react-query`, etc.). Precisa reinstalar `node_modules` corretamente antes de qualquer outra coisa.

### 2. Histórico funcional com ações
A página History já lista anúncios salvos, mas falta:
- Visualizar detalhes completos de um anúncio salvo
- Deletar anúncios
- Re-abrir/duplicar um anúncio para edição

### 3. Geração de imagens real na etapa de Prompts
Hoje os prompts são gerados mas as imagens não — o usuário precisa copiar e colar em ferramentas externas. Integrar geração de imagens direto na app usando o modelo `google/gemini-3-pro-image-preview` ou `google/gemini-3.1-flash-image-preview` via Lovable AI.

### 4. Download/Export real
Criar um ZIP com:
- Fotos originais do produto
- Imagens geradas pela IA
- Textos dos anúncios (ML + Shopee) em TXT/PDF

### 5. Melhorias de UX
- Animações de transição entre etapas (framer-motion)
- Feedback visual melhor nos estados de loading da IA
- Validação e mensagens de erro mais claras

### Ordem recomendada
1 → 3 → 2 → 4 → 5

A geração de imagens (passo 3) é o maior salto de valor para o usuário, pois elimina a necessidade de ferramentas externas.

