/**
 * Overlay copy rules: tone and character limits per marketplace.
 * Used by generate-overlay-copy to produce compliant copy.
 */

export const OVERLAY_COPY_RULES = `
## REGRAS DE COPY PARA OVERLAYS DE IMAGEM

### Princípios Gerais
- Copy de overlay tem meia vida de 2 segundos — seja ultra-direto
- Benefício primeiro, spec depois (não "3A de potência", mas "Carrega em minutos, não horas")
- Cada imagem deve ter UMA mensagem central — não tente dizer tudo
- Use números quando possível: "65W" > "potência máxima"; "30 min" > "muito rápido"
- Action words abrem melhor que substantivos: "Carregue Tudo", "Conecte Qualquer"

### Limites de Caracteres por Elemento
| Elemento | Máx. chars | Estilo |
|---|---|---|
| Headline | 30 chars / 4-5 palavras | Negrito, impacto, benefit |
| Subheadline | 50 chars / 6-8 palavras | Suporte, detalhe técnico |
| Bullet point | 40 chars / 5-7 palavras | Ícone + benefício direto |
| Badge | 15 chars / 2-3 palavras | Label curtíssimo |
| CTA | 20 chars / 2-3 palavras | Verbo de ação |

### Tom por Marketplace

**Mercado Livre — Overlay:**
- Tom sóbrio, técnico, confiável
- Cores recomendadas: azul (confiança), preto/branco (premium), amarelo-ML (urgência)
- Evite: cores berrantes, múltiplas fontes, excesso de exclamações
- Exemplos de headline ML: "Carga Ultra-Rápida", "Durabilidade Garantida", "3A de Potência"

**Shopee — Overlay:**
- Tom vibrante, entusiasmado, jovem
- Cores recomendadas: laranja-Shopee, vermelho, amarelo brilhante (CTR alto)
- Badges de desconto performam bem: "TOP VENDIDO", "-30%", "FRETE GRÁTIS"
- Emojis funcionam em overlay Shopee: ⚡, ✅, 🔥
- Exemplos: "⚡ Carrega Super Rápido!", "✅ Compatível com Tudo"

**Amazon — Overlay:**
- Tom informativo, neutro, premium
- Preto e branco sobre fundo limpo
- Foco em specs e compatibilidade
- Exemplos: "Compatível com 500+ Modelos", "Tecnologia PD 3.0", "Garantia 12 Meses"

**Magazine Luiza — Overlay:**
- Tom acessível, simples, direto
- Cores: magenta/rosa Magalu, branco
- Foque em custo-benefício e facilidade
- Exemplos: "Plug & Play", "Bivolt", "Sem Fio"

### Regras de Novidade entre Imagens
- Imagem 1 (capa): NUNCA ter overlay de texto
- Imagem 2 (benefícios): Headline + 3-5 bullets de benefícios emocionais
- Imagem 3 (features): Labels técnicos curtos, specs como callouts
- Imagem 4 (close-up): 1-2 labels apontando detalhe de qualidade
- Imagem 5 (lifestyle): Tagline aspiracional, 1 frase
- Imagem 6 (portabilidade): Dado de tamanho/peso de forma visual
- Imagem 7 (inbox): Headline "O que está incluso" + label por item

### Exemplos para Acessórios de Celular
**Headline para carregador:**
- "Carrega em Minutos" / "65W de Potência" / "0→100% em 1h"

**Headline para cabo:**
- "Não Quebra Mais" / "Resistente de Verdade" / "1 Cabo, Tudo Conectado"

**Bullets para carregador:**
- "✓ Carga rápida 65W"
- "✓ Protege a bateria"
- "✓ Bivolt universal"
- "✓ Funciona com qualquer marca"

**Bullets para cabo:**
- "✓ 10.000 dobras testadas"
- "✓ Nylon trançado reforçado"
- "✓ Transmite dados + carga"
- "✓ USB-C universal"
`;
