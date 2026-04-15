/**
 * Marketplace-specific listing rules for Brazil.
 * Each section fits ~800 tokens to stay within budget when composed.
 */

export const MERCADO_LIVRE_RULES = `
## MERCADO LIVRE — REGRAS DE LISTAGEM

### Título (máx. 60 caracteres)
- Formato padrão (SEM MARCA): [Produto] [Especificação-chave] [Diferencial] [Material/Cor]
  Exemplo: "Cabo USB-C 3A Carga Rápida 1m Nylon Trançado"
- Formato COM MARCA (quando solicitado): [Produto] [Marca] [Especificação] [Diferencial]
  Exemplo: "Cabo USB-C Anker 3A Carga Rápida Nylon"
- Use cada caractere: 60 chars é o teto — preencha com specs relevantes
- Palavras proibidas no título: "melhor", "top", "ótimo", "barato", "promoção", "oferta", "estoque"
- Primeira palavra = termo mais buscado (ex: "Carregador", não "Fonte")
- Capitalize apenas a primeira letra e nomes próprios
- Sem pontuação ou símbolos especiais — separe termos com espaços

### Descrição — TEXTO PURO OBRIGATÓRIO (máx. 50.000 chars)
⚠️ REGRA CRÍTICA: O Mercado Livre REJEITA qualquer formatação HTML, emojis e bullets (•).
A API retorna erro "The description must be in plain text" para qualquer tag HTML ou emoji.
Não use: <br>, <b>, <ul>, <li>, &amp;, bullets (•), emojis, asteriscos, negrito.

FORMATO CORRETO — use APENAS:
- Letras, números, espaços e pontuação comum (vírgulas, pontos, hifens, reticências)
- MAIÚSCULAS para destacar nomes de seções e cabeçalhos
- Hifens (-) para marcar itens de lista
- Quebras de linha simples para separar parágrafos e seções

ESTRUTURA OBRIGATÓRIA (copie e adapte):
SOBRE O PRODUTO
[2-3 frases com benefício principal e diferencial do produto]

ESPECIFICAÇÕES TÉCNICAS
- Potência: [X]W / [X]A
- Comprimento: [X]m
- Material: [material externo]
- Conector: [tipo A] para [tipo B]
- Padrão de carga: [PD/QC/etc.]
- Tensão: [bivolt 100-240V]

COMPATIBILIDADE
[Lista de modelos separados por hifens ou vírgulas — inclua os top 10 no Brasil]

PROTEÇÕES INTEGRADAS
- Proteção contra sobrecarga
- Proteção contra curto-circuito

GARANTIA E NOTA FISCAL
[Prazo de garantia + como acionar + informação sobre nota fiscal]

- Extensão ideal: 300-600 palavras
- Inclua termos de busca naturalmente no texto (não keyword stuffing)
- A descrição indexa para buscas longas — inclua variações: USB-C, tipo-c, type-c

### Ficha Técnica (principal vetor de indexação no ML)
- Preencha TODOS os campos disponíveis para a categoria
- Campos não preenchidos = produto não aparece em filtros de busca
- Voltagem, potência, dimensões, peso, material: sempre em unidades padrão BR
- A ficha técnica é mais importante que a descrição para ranqueamento

### Algoritmo de Ranking (por prioridade)
1. Reputação do vendedor (termômetro verde)
2. Velocidade de envio (Full ML = boost significativo)
3. Taxa de conversão (cliques → vendas)
4. Completude da ficha técnica
5. Relevância do título para a busca
6. Preço competitivo vs. concorrentes na mesma categoria
7. Número e qualidade das perguntas respondidas

### Tom e Estilo
- Profissional, técnico, confiável
- Comprador pesquisa antes de comprar — forneça dados, não elogios
- Evite superlativas sem prova ("o melhor do mercado")
- Use garantia e nota fiscal como argumentos de fechamento
`;

export const SHOPEE_RULES = `
## SHOPEE — REGRAS DE LISTAGEM

### Título (máx. 120 caracteres)
- Formato padrão (SEM MARCA): [Keyword principal] [Keyword secundária] Produto Especificação | Benefício | Diferencial
  Exemplo: "Cabo USB-C Tipo C Carga Rápida 3A 1 Metro Nylon Entrelaçado | Compatível iPhone | Resistente"
- Repetição intencional de keywords é aceita e recomendada pelo algoritmo
- Inclua variações de busca: "USB-C", "Tipo C", "Type-C" na mesma listagem
- Separe blocos com "|" para facilitar leitura
- Números e especificações aumentam CTR (3A, 65W, 1m, 2m)

### Descrição (máx. ~3.000 caracteres recomendado)
- Tom casual, próximo, entusiasmado — diferente do ML formal
- Emojis são permitidos e aumentam engajamento:
  ✅ para benefícios, ⚡ para velocidade, 🎁 para brindes, 🔥 para destaques, 📦 para embalagem
- Use bullets com emojis para listar benefícios (ex: "✅ Carga rápida 3A — do 0% ao 50% em 30min")
- Inclua FAQ informal ao final:
  "❓ Serve no meu celular? Sim! Compatível com [lista de modelos]."
- Hashtags NO FINAL da descrição aumentam visibilidade em feeds temáticos:
  Para cabos/carregadores: #cargaRapida #caboUSBC #fastcharge #acessoriosCelular #caboResistente
  Para eletrônicos: #eletronicos #gadgets #tecnologia
  Para moda: #moda #tendencia #modafeminina
  Para casa/cozinha: #casaEcozinha #decoracao #organizacao
  Para beleza: #beleza #skincare #cuidadoPessoal
- Mencione compatibilidade de modelos específicos (iPhone 15, Samsung S24, Xiaomi 14...)

### Algoritmo de Ranking
1. Taxa de clique (CTR) — thumbnail e título decidem isso
2. Taxa de conversão (CVR)
3. Avaliações e volume de vendas recentes
4. Tempo de resposta do vendedor (<2 horas = boost)
5. Uso de Shopee Ads (imprescindível para os primeiros 30 dias)
6. Completude do formulário de produto

### Tom e Estilo
- Jovem, dinâmico, próximo do cliente
- Mostre entusiasmo pelo produto
- Destaque custo-benefício explicitamente ("Pelo preço de 1 café, você leva qualidade premium")
- Use prova social: "Mais de X unidades vendidas" quando disponível
- Crie urgência leve: "Aproveite enquanto temos estoque!"
`;

export const AMAZON_BR_RULES = `
## AMAZON BRASIL — REGRAS DE LISTAGEM

### Título (máx. 200 caracteres)
- Formato padrão (SEM MARCA): [Produto] - [Feature 1] - [Feature 2] - [Especificação técnica] - [Tamanho/Cor/Pack]
  Exemplo: "Cabo USB-C - Carga Rápida 3A - Nylon Trançado - 1 Metro - Compatível Android e iOS"
- Amazon prefere títulos descritivos e completos — use os 200 chars disponíveis
- Primeira palavra = categoria ou produto principal
- Inclua atributos de variação no título quando relevante (Pack com 2, Preto/Branco)
- Sem emojis ou símbolos especiais no título

### Bullet Points — 5 OBRIGATÓRIOS (máx. 200 caracteres cada)
- Cada bullet começa com BENEFÍCIO EM MAIÚSCULAS seguido de ":" e detalhe técnico
- Estrutura: "CARGA ULTRA-RÁPIDA: Tecnologia 3A entrega 0-50% em apenas 30 minutos..."
- Bullet 1: Benefício mais importante / USP principal
- Bullet 2: Compatibilidade / alcance de uso (modelos específicos)
- Bullet 3: Qualidade / materiais / durabilidade / certificações
- Bullet 4: Especificações técnicas detalhadas (W, A, dimensões, etc.)
- Bullet 5: Garantia / suporte / conteúdo da embalagem / nota fiscal
- Máx. 200 caracteres por bullet — seja conciso e direto
- NÃO use emojis nos bullets para Amazon

### Descrição (máx. 2.000 caracteres — texto corrido)
- Para sellers sem A+ Content: texto corrido, sem formatação HTML
- Reitere benefícios com mais detalhes do que nos bullets
- Inclua casos de uso expandidos e compatibilidade detalhada
- Tom informativo e técnico — sem superlativas sem prova
- Não repita literalmente o que já está nos bullets

### Backend Search Terms (250 chars, invisíveis ao comprador)
- Inclua APENAS termos que NÃO aparecem no título ou bullets
- Variações ortográficas, sinônimos, termos em inglês usados por brasileiros
- Modelos específicos de dispositivos compatíveis
- Não use vírgulas — separe apenas por espaço
- Não repita palavras — o algoritmo A9 ignora e penaliza keyword stuffing
- Exemplo para cabo USB-C: "android iphone macbook ipad charging type-c braided xiaomi motorola huawei s23 ultra"

### Tom e Estilo
- Informativo, técnico, objetivo — sem emojis em NENHUM campo
- Comprador Amazon pesquisa muito — seja completo, não prolixo
- Garantia, suporte e nota fiscal são argumentos fortes de fechamento
`;

export const MAGALU_RULES = `
## MAGAZINE LUIZA — REGRAS DE LISTAGEM

### Título (máx. 150 caracteres)
- Formato padrão (SEM MARCA): [Produto] [Especificação técnica] [Diferencial] [Material]
  Exemplo: "Cabo USB-C 3A Carga Rápida Nylon Trançado 1 Metro"
- Magalu indexa título + ficha técnica para busca interna E Google Shopping
- Seja preciso — compradores Magalu são mais funcionais que aspiracionais
- Inclua especificações técnicas que aparecem nos filtros de busca

### Descrição (máx. ~2.000-3.000 caracteres recomendado)
- Foco em informação técnica e utilitária
- Linguagem acessível — base de usuários diversa em termos de escolaridade
- Use esta estrutura de especificações:

ESPECIFICAÇÕES TÉCNICAS:
- [Atributo]: [Valor]
- [Atributo]: [Valor]

COMPATIBILIDADE:
[Modelos e dispositivos compatíveis]

O QUE VEM NA EMBALAGEM:
[Lista de itens inclusos]

GARANTIA:
[Prazo e condições]

- Evite jargão técnico sem explicação
- Destaque condições de parcelamento se relevante ("até 10x sem juros")

### Ficha Técnica (MAIS IMPORTANTE QUE A DESCRIÇÃO para filtros)
- Magalu usa ficha técnica para alimentar filtros de busca e Google Shopping
- Campos incompletos = produto invisível em refinamentos de busca
- Atributos de destaque visíveis na listagem: Voltagem, Potência, Dimensões, Peso
- Preencha obrigatoriamente: Marca, Modelo, Voltagem, Potência, Material, Cor, Dimensões, Peso, Compatibilidade

### Algoritmo de Ranking
1. Relevância da ficha técnica para filtros de busca
2. Envio rápido (fulfillment Magalu = boost)
3. Avaliações de clientes (nota média e volume)
4. Preço em relação à categoria
5. Completude do cadastro do produto

### Tom e Estilo
- Equilibrado entre formal e acessível — "Lu da Magalu": simpática mas respeitosa
- Garantia do fabricante é importante argumento de compra
- Evite jargão técnico sem explicação para o público leigo
`;
