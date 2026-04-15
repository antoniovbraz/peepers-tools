/**
 * SEO strategy per marketplace. Injected when generating titles and descriptions.
 */

const SEO_ML = `
### Mercado Livre SEO
**Como o algoritmo indexa:**
- Título: cada palavra vira keyword — coloque os termos mais buscados nos primeiros 40 chars
- Ficha técnica: principal vetor de indexação de filtros (voltagem, material, dimensões etc.)
- Descrição (TEXTO PURO): keywords no corpo da descrição indexam para buscas longas internas e Google
  ⚠️ CRÍTICO: tags HTML na descrição NÃO são indexadas e causam erro "must be plain text" na API ML
- Perguntas e respostas: indexadas pelo Google — aumentam tráfego orgânico lateral

**Pesquisa de palavras-chave ML:**
1. Digite o nome do produto na barra de busca do ML
2. Observe as sugestões de autocomplete = termos mais buscados pelos usuários
3. Coloque os 2-3 mais relevantes nos primeiros 30 chars do título
4. Use variações no texto da descrição (USB-C, USB C, Tipo-C, tipo c)

**Estrutura de título para máxima indexação (60 chars):**
[Tipo de produto] [Atributo diferenciador] [Especificação técnica] [Material/Cor]

**Exemplos de alta performance:**
- "Cabo USB-C 3A Carga Rápida 1m Nylon Trançado" (45 chars — preencha até 60)
- "Carregador Sem Fio 15W Qi iPhone Samsung" (40 chars)
- "Hub USB-C 7 em 1 HDMI 4K Thunderbolt MacBook" (45 chars)
- "Tênis Corrida Masculino Amortecimento Gel N42" (45 chars)

**Dica crítica de ficha técnica:** Preencher "Potência: 65W" cria indexação automática no filtro "Potência > 65W" — compradores que filtram por potência vêem seu produto.
`;

const SEO_SHOPEE = `
### Shopee SEO
**Como o algoritmo indexa:**
- Título: keyword repetition é PERMITIDA e RECOMENDADA (vs. ML que penaliza)
- Hashtags no final da descrição: aparecem em feeds temáticos e buscas de categoria
- Velocidade de resposta do vendedor: <2h = boost de visibilidade no feed
- Taxa de conversão recente: peso alto (últimos 7 dias)

**Estrutura de título para máxima indexação (120 chars):**
[Keyword 1] [Keyword 2] [Produto] [Especificação] | [Benefício] | [Compatibilidade]

**Exemplo otimizado para 120 chars:**
"Cabo USB-C Tipo C Carga Rápida 3A Fast Charge | 1 Metro Nylon | Compatível Samsung iPhone Xiaomi"

**Hashtags recomendadas por categoria:**
- Cabos/carregadores: #cargaRapida #caboUSBC #caboResistente #fastcharge #acessoriosCelular
- Carregadores: #carregadorRapido #65W #carregadorUSBC #carregadorWireless #powerbank
- Hubs/adaptadores: #hubUSB #adaptador #notebookAcessorios #macbook #trabalhoRemoto
- Moda: #moda #tendencia #modafeminina #modamasculina #lookdodia #ootd
- Casa/cozinha: #casaEcozinha #decoracao #organizacao #utilidades #cozinhaOrganizada
- Beleza: #beleza #skincare #cuidadoPessoal #cosmeticos #makeup
- Infantil/brinquedos: #brinquedos #infantil #criancas #presente #educativo
- Esportes: #esportes #fitness #treino #academia #esportivo
- Saúde: #saude #saudavel #bemestar #vitaminasEsuplementos
`;

const SEO_AMAZON = `
### Amazon BR SEO (Algoritmo A9)
**Fatores de ranking — em ordem de peso:**
1. Relevância: correspondência entre query do comprador e título/bullets/descrição
2. Performance: CTR, CVR (conversão), velocidade de entrega Prime
3. Completude: título completo, 5 bullets, descrição, backend terms preenchidos
4. Disponibilidade: produto em estoque = boost imediato de visibilidade

**Backend Search Terms (250 chars, invisíveis ao comprador):**
- Inclua APENAS termos que NÃO aparecem no título ou bullets (evitar repetição)
- Inclua sinônimos em inglês usados por brasileiros (fast charge, quick charge, braided)
- Inclua modelos específicos de dispositivos compatíveis que não couberam no título
- Não use vírgulas — separe apenas por espaço
- Não repita palavras — A9 ignora keyword stuffing

**Exemplos de backend search terms por categoria:**
- Cabo USB-C: "android iphone macbook ipad pro charging cable type-c braided xiaomi motorola huawei s23 ultra n35"
- Carregador 65W: "wireless qi charger gan adapter fast charging plug wall travel multiport pd compatible multiple devices"
- Hub USB: "multiport adapter usb hub hdmi display port card reader microsd thunderbolt dock station laptop"
- Tênis corrida: "running shoe gym sneaker performance trail urban lightweight cross training breathable"
- Skincare: "moisturizer serum vitamin c hyaluronic acid anti-aging cream skin care natural organic vegan"

**Regra de ouro A9:** Título e bullets já indexam suas palavras. Use backend terms para cobrir sinônimos, variações ortográficas e termos em inglês que os compradores digitam.
`;

const SEO_MAGALU = `
### Magalu SEO
**Como o algoritmo indexa:**
- Busca interna Luiza: título + ficha técnica (principal vetor de filtragem)
- Filtros por atributo: cada campo da ficha técnica alimenta um filtro específico
- Google Shopping: Magalu tem altíssima presença — produtos aparecem diretamente no Google

**Dica crítica de ficha técnica Magalu:** "Voltagem", "Potência", "Material", "Cor" na ficha técnica habilitam filtros com alta intenção de compra. Comprador que filtra "bivolt 65W" está pronto para comprar.

**Dica de Google Shopping (exclusiva Magalu):** O título do produto é exatamente o texto do anúncio no Google Shopping. Inclua especificações técnicas numéricas (65W, USB-C, bivolt) no título — elas aparecem em buscas Google como "carregador 65W usb-c".

**Estrutura de título Magalu para Google Shopping (150 chars):**
[Produto] [Marca opcional] [Especificação técnica] [Diferencial] [Material/Cor/Quantidade]
`;

type SeoMarketplace = "mercadoLivre" | "shopee" | "amazon" | "magalu" | "all";

const SEO_HEADER = `## ESTRATÉGIA DE SEO POR MARKETPLACE\n`;

/**
 * Returns SEO strategy filtered to the specified marketplace.
 * Use instead of SEO_STRATEGY when marketplace is known — saves ~300–600 tokens per call.
 */
export function getSEOStrategy(marketplace: SeoMarketplace = "all"): string {
  const sections: string[] = [SEO_HEADER];
  if (marketplace === "all" || marketplace === "mercadoLivre") sections.push(SEO_ML);
  if (marketplace === "all" || marketplace === "shopee") sections.push(SEO_SHOPEE);
  if (marketplace === "all" || marketplace === "amazon") sections.push(SEO_AMAZON);
  if (marketplace === "all" || marketplace === "magalu") sections.push(SEO_MAGALU);
  return sections.join("\n");
}

/** @deprecated Use getSEOStrategy(marketplace) for filtered output */
export const SEO_STRATEGY = getSEOStrategy("all");

