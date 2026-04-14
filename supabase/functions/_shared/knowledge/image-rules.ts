/**
 * Image requirements and photo strategy per marketplace.
 * Used by generate-prompts to produce compliant AI image prompts.
 */

const IMAGE_RULES_ML = `
### Mercado Livre — Imagens
**Regras obrigatórias:**
- Foto principal (capa): fundo BRANCO PURO (RGB 255,255,255) — obrigatório
- Sem texto, marcas d'água, bordas ou overlays na foto principal
- Produto deve ocupar mínimo 75% do frame
- Resolução mínima: 500x500px; recomendado: 1200x1200px (zoom habilitado)
- Máximo: 12 fotos por anúncio
- Formato: JPG, PNG (JPG preferido para tamanho menor)

**Fotos adicionais — sequência recomendada:**
1. Capa: produto no centro, fundo branco, ângulo 3/4
2. Todos os lados do produto (frontal, lateral, traseira)
3. Detalhe da qualidade (material, conector, acabamento)
4. Foto em uso / contexto (mão segurando, conectado ao celular)
5. Conteúdo da embalagem (unboxing)
6. Infográfico de especificações (texto permitido em fotos não-capa)

**Fotos que aumentam conversão no ML:**
- Escala com objeto de referência (mão humana, wallet para tamanho)
- Antes/depois quando aplicável
- Diagrama de compatibilidade com logos de dispositivos
`;

const IMAGE_RULES_SHOPEE = `
### Shopee — Imagens
**Regras:**
- Foto principal: fundo branco recomendado, mas pode ter elementos visuais simples
- **Diferença do ML**: badges e textos são PERMITIDOS na foto principal da Shopee
- Máximo: 9 fotos + 1 vídeo de 60s (vídeo aumenta conversão ~25%)
- Resolução: mínimo 500x500px; recomendado: 1:1 (quadrado) 800x800px
- Infográficos performam bem: comparação com concorrente, specs destacadas

**Estratégia de thumbnails Shopee:**
- Adicione um badge de desconto ou "MAIS VENDIDO" na thumbnail
- Use cor de fundo diferente do branco para se destacar nos feeds (ex: azul claro, gradiente suave)
- Produto em contexto de uso real converte bem no feed
`;

const IMAGE_RULES_AMAZON = `
### Amazon Brasil — Imagens
**Regras obrigatórias (mais rígidas):**
- Foto principal: fundo BRANCO PURO obrigatório, sem exceção
- Produto deve ocupar 85% ou mais do frame
- Sem texto, logos, bordas, overlays na foto principal
- Mínimo 1000px no lado menor (zoom obrigatório)
- Máximo: 7 imagens
- Formatos aceitos: JPEG, TIFF, GIF, PNG

**Fotos adicionais recomendadas:**
1. Múltiplos ângulos do produto
2. Close-up de detalhes técnicos relevantes
3. Produto em uso com modelo humano (aumenta conversão)
4. Infográfico de especificações (imagem 2-7 pode ter texto)
5. Conteúdo da embalagem
6. Comparativo de tamanhos / variações
`;

const IMAGE_RULES_MAGALU = `
### Magazine Luiza — Imagens
**Regras:**
- Foto principal: fundo branco recomendado
- Mínimo: 500x500px; recomendado: 1000x1000px
- Sem texto na foto principal
- Máximo: 6 imagens por SKU

**Dica Magalu:** Fotos de infográfico com especificações destacadas (imagens 2-6) ajudam compradores que não leem a descrição. Magalu tem público mais diverso — imagem com callouts de specs simples converte bem.
`;

const IMAGE_QUALITY_GUIDELINES = `
## DIRETRIZES DE QUALIDADE PARA AI IMAGE GENERATION

### Para gerar prompts de imagem de produto:
- **Background de capa (todos marketplaces)**: "pure white background, seamless, no shadows except very subtle ground shadow"
- **Iluminação profissional**: "soft studio lighting, key light upper left, subtle rim light, no harsh shadows"
- **Enquadramento**: produto centralizado, ocupa 75-85% do frame, 3/4 angle
- **Qualidade**: "ultra realistic, commercial product photography, 8K, sharp focus, high dynamic range"

### Para imagens de contexto/lifestyle:
- Ambiente limpo e contemporâneo
- Modelo ou mão segurando o produto (aumenta escala e contexto de uso)
- Cores neutras no background do lifestyle para não competir com o produto
- Iluminação natural quando lifestyle, studio quando foco no produto

### Estilos por categoria:
| Categoria | Estilo recomendado |
|---|---|
| Acessórios celular | Clean tech, white/dark background, product hero |
| Moda | Model wearing, lifestyle context, natural light |
| Casa/Cozinha | Kitchen/home context, warm lighting, lifestyle |
| Brinquedos | Bright, colorful, child context, safe & fun vibe |
| Beleza | Soft light, pastel tones, luxury feel |
`;

type ImageMarketplace = "mercadoLivre" | "shopee" | "amazon" | "magalu" | "all";

const MARKETPLACE_IMAGE_RULES: Record<string, string> = {
  mercadoLivre: IMAGE_RULES_ML,
  shopee: IMAGE_RULES_SHOPEE,
  amazon: IMAGE_RULES_AMAZON,
  magalu: IMAGE_RULES_MAGALU,
};

/**
 * Get image rules filtered by marketplace.
 * Includes quality guidelines always, marketplace rules only for the active marketplace.
 */
export function getImageRules(marketplace: ImageMarketplace = "all"): string {
  const sections = ["## REGRAS DE IMAGENS POR MARKETPLACE\n"];

  if (marketplace === "all") {
    sections.push(IMAGE_RULES_ML, IMAGE_RULES_SHOPEE, IMAGE_RULES_AMAZON, IMAGE_RULES_MAGALU);
  } else {
    const rules = MARKETPLACE_IMAGE_RULES[marketplace];
    if (rules) sections.push(rules);
  }

  sections.push(IMAGE_QUALITY_GUIDELINES);
  return sections.join("\n");
}

/** @deprecated Use getImageRules(marketplace) instead for filtered rules */
export const IMAGE_RULES = getImageRules("all");
