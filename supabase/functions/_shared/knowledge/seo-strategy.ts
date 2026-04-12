/**
 * SEO strategy per marketplace. Injected when generating titles and descriptions.
 */

export const SEO_STRATEGY = `
## ESTRATÉGIA DE SEO POR MARKETPLACE

### Mercado Livre SEO
**Como o algoritmo indexa:**
- Título: cada palavra vira keyword — escolha com cuidado
- Ficha técnica: campos preenchidos ampliam o produto nos filtros de busca
- Perguntas e respostas: indexadas pelo Google, aumentam tráfego orgânico
- Palavras-chave na descrição: indexadas internamente, ranqueiam em buscas longas

**Pesquisa de palavras-chave ML:**
1. Digite o nome do produto na barra de busca do ML
2. Observe as sugestões de autocomplete = termos mais buscados pelos usuários
3. Coloque os 2-3 mais relevantes nos primeiros 30 chars do título
4. Use variações (USB-C, USB C, Tipo-C, tipo c) em descrição/ficha técnica

**Estrutura de título para máxima indexação (60 chars):**
[Tipo de produto] [Atributo diferenciador] [Especificação técnica] [Material/Cor]

**Exemplos de alta performance:**
- "Cabo USB-C 3A Carga Rápida 1m Nylon" (36 chars — adicione mais se couber)
- "Carregador Sem Fio 15W iPhone Samsung" (37 chars)
- "Hub USB-C 7 em 1 HDMI 4K MacBook" (33 chars)

### Shopee SEO
**Como o algoritmo indexa:**
- Título: keyword repetition é PERMITIDA e RECOMENDADA (vs. ML que penaliza)
- Hashtags no final da descrição: aumentam aparição em feeds temáticos
- Velocidade de resposta: <2h = boost de visibilidade
- Taxa de conversão recente: peso alto (últimos 7 dias)

**Estrutura de título para máxima indexação (120 chars):**
[Keyword 1] [Keyword 2] [Produto] [Especificação] | [Benefício] | [Compatibilidade]

**Exemplo:**
"Cabo USB-C Tipo C Carga Rápida 3A Fast Charge | 1 Metro Nylon | Compatível Samsung iPhone"

**Hashtags recomendadas (copie e cole na descrição):**
Para carga/cabos: #cargaRapida #caboUSBC #caboResistente #fastcharge #acessoriosCelular
Para carregadores: #carregadorRapido #65W #carregadorUSBC #carregadorWireless
Para hubs: #hubUSB #adaptador #notebookAcessorios #macbook

### Amazon BR SEO (Algoritmo A9)
**Fatores de ranking:**
1. Relevância: correspondência entre query do comprador e listing
2. Performance: CTR, CVR, velocidade de entrega
3. Disponibilidade: produto em estoque = aumento de visibilidade

**Backend Search Terms (250 chars, invisíveis ao comprador):**
- Inclua APENAS termos não presentes no título ou bullets
- Inclua sinônimos em inglês usados por brasileiros (fast charge, quick charge, braided cable)
- Inclua modelos específicos de dispositivos compatíveis
- Não use vírgulas — separe apenas por espaço
- Não repita palavras — A9 penaliza keyword stuffing

**Exemplo de backend search terms para cabo USB-C:**
android iphone macbook ipad pro charging cable type-c braided xiaomi motorola huawei g22 s23 ultra multiple devices compatible

### Magalu SEO
**Como o algoritmo indexa:**
- Busca interna: título + ficha técnica (igual ML)
- Filtros: alimentados pela ficha técnica — cada campo preenche um filtro de busca
- SEO orgânico externo: Magalu tem boa presença no Google Shopping

**Dica crítica:** Preencher "Marca", "Modelo", "Voltagem", "Potência", "Material" na ficha técnica faz o produto aparecer em filtros específicos (ex: "65W", "bivolt") que têm altíssima intenção de compra.
`;
