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
- Use cada caractere: 60 chars é o teto, não o ideal — preencha com specs relevantes
- Palavras proibidas no título: "melhor", "top", "ótimo", "barato", "promoção", "oferta"
- Primeira palavra = termo mais buscado (ex: "Carregador", não "Fonte")
- Capitalize apenas a primeira letra e nomes próprios

### Descrição (HTML permitido)
- Estrutura obrigatória:
  1. Parágrafo de abertura (benefício principal, 2-3 frases)
  2. Lista de especificações técnicas com marcadores (•)
  3. Seção de compatibilidade (se aplicável)
  4. Instruções de uso / observações importantes
  5. Informações de garantia
- Extensão ideal: 300-600 palavras
- Evite blocos de texto denso — use listas e subtítulos
- Inclua termos de busca naturalmente no texto (não keyword stuffing)

### Ficha Técnica (campos indexados pelo algoritmo)
- Preencha TODOS os campos disponíveis para a categoria
- Campos não preenchidos = produto não aparece em filtros de busca
- Voltagem, potência, dimensões, peso, material: sempre em unidades padrão BR

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
- Comprador típico pesquisa antes de comprar — forneça dados, não elogios
- Evite superlativas sem prova ("o melhor do mercado")
- Use garantia como argumento de fechamento
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

### Descrição
- Tom casual, próximo, entusiasmado — diferente do ML formal
- Use emojis com moderação: ✅ para benefícios, ⚡ para velocidade, 🎁 para brindes
- Inclua FAQ informal ao final (Pergunta frequente: "Serve no meu celular?")
- Hashtags no final da descrição aumentam visibilidade: #cargaRapida #caborobusto
- Mencione compatibilidade de modelos específicos (iPhone 15, Samsung S24, etc.)

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
`;

export const AMAZON_BR_RULES = `
## AMAZON BRASIL — REGRAS DE LISTAGEM

### Título (máx. 200 caracteres)
- Formato padrão (SEM MARCA): [Produto] - [Feature 1] - [Feature 2] - [Especificação técnica] - [Tamanho/Cor/Pack]
  Exemplo: "Cabo USB-C - Carga Rápida 3A - Nylon Trançado - 1 Metro - Compatível Android e iOS"
- Amazon prefere títulos descritivos e completos
- Primeira palavra = categoria ou produto principal
- Inclua atributos de variação no título quando relevante (Pack com 2, Preto/Branco)

### Bullet Points (5 obrigatórios)
- Cada bullet começa com BENEFÍCIO EM MAIÚSCULAS seguido de detalhe técnico
- Estrutura: "CARGA ULTRA-RÁPIDA: Tecnologia 3A entrega 0-50% em apenas 30 minutos..."
- Bullet 1: Benefício mais importante / USP
- Bullet 2: Compatibilidade / alcance de uso
- Bullet 3: Qualidade / materiais / durabilidade
- Bullet 4: Especificações técnicas detalhadas
- Bullet 5: Garantia / suporte / o que está incluso
- Máx. 200 chars por bullet

### Descrição (A+ Content quando disponível)
- Para sellers sem A+: texto corrido 2000 chars máx.
- Reitere benefícios com mais detalhes
- Inclua casos de uso, compatibilidade expandida

### Backend Search Terms (250 chars, não visíveis)
- Inclua termos que não couberam no título
- Variações ortográficas, sinônimos, termos em inglês usados por brasileiros
- Não repita palavras do título — o algoritmo A9 já as considera

### EAN/GTIN
- Obrigatório para categorias regulamentadas
- Aumenta chance de aparecer no "Comparar com similar"

### Tom e Estilo
- Informativo, técnico, objetivo
- Comprador Amazon pesquisa muito — seja completo, não prolixo
- Garantia e suporte são argumentos fortes
`;

export const MAGALU_RULES = `
## MAGAZINE LUIZA — REGRAS DE LISTAGEM

### Título (máx. 150 caracteres)
- Formato padrão (SEM MARCA): [Produto] [Especificação técnica] [Diferencial] [Material]
  Exemplo: "Cabo USB-C 3A Carga Rápida Nylon Trançado 1 Metro"
- Magalu indexa título + ficha técnica para busca interna
- Seja preciso — compradores Magalu são mais funcionais que aspiracionais

### Descrição
- Foco em informação técnica e utilitária
- Inclua tabela de especificações técnicas
- Liste compatibilidade de modelos quando relevante
- Use linguagem acessível — base de usuários diversa em termos de escolaridade

### Ficha Técnica (crítica para filtros)
- Magalu usa ficha técnica para alimentar os filtros de busca
- Campos incompletos = produto invisível em refinamentos de busca
- Atributos de destaque (aparecem na listagem): Voltagem, Potência, Dimensões, Peso

### Algoritmo de Ranking
1. Relevância ficha técnica para filtros de busca
2. B2W Fulfillment (envio rápido = boost)
3. Avaliações de clientes (nota média e volume)
4. Preço em relação à categoria
5. Completude do cadastro

### Tom e Estilo
- Equilibrado entre formal e acessível
- Magalu é "Lu da Magalu" — tem personalidade simpática mas respeitosa
- Destaque condições de parcelamento quando relevante
- Garantia do fabricante é importante argumento
`;
