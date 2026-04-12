/**
 * Category-specific guides: required attributes, sales angles, and buyer objections.
 * Each category maps to a key used by buildKnowledge().
 */

export type KnowledgeCategory =
  | "eletronicos"
  | "moda"
  | "casa_cozinha"
  | "beleza"
  | "papelaria"
  | "brinquedos"
  | "acessorios_celular"
  | "esportes"
  | "automotivo"
  | "saude";

/** Map free-text AI category to one of the 10 knowledge keys */
export const CATEGORY_ALIASES: Record<string, KnowledgeCategory> = {
  // acessorios_celular
  "acessórios para celulares": "acessorios_celular",
  "acessorios para celulares": "acessorios_celular",
  "acessórios celular": "acessorios_celular",
  "acessorios celular": "acessorios_celular",
  "carregador": "acessorios_celular",
  "carregadores": "acessorios_celular",
  "cabo": "acessorios_celular",
  "cabos": "acessorios_celular",
  "cabo usb": "acessorios_celular",
  "cabo usb-c": "acessorios_celular",
  "hub usb": "acessorios_celular",
  "adaptador": "acessorios_celular",
  "adaptadores": "acessorios_celular",
  "fone de ouvido": "acessorios_celular",
  "fones de ouvido": "acessorios_celular",
  "capinha": "acessorios_celular",
  "película": "acessorios_celular",
  "carregador sem fio": "acessorios_celular",
  "carregador wireless": "acessorios_celular",
  // eletronicos
  "eletrônicos": "eletronicos",
  "eletronicos": "eletronicos",
  "informática": "eletronicos",
  "informatica": "eletronicos",
  "computador": "eletronicos",
  "notebook": "eletronicos",
  "tablet": "eletronicos",
  "monitor": "eletronicos",
  "teclado": "eletronicos",
  "mouse": "eletronicos",
  // moda
  "moda": "moda",
  "roupas": "moda",
  "calçados": "moda",
  "calcados": "moda",
  "bolsas": "moda",
  "carteira": "moda",
  "carteiras": "moda",
  "porta-moedas": "moda",
  "acessórios de moda": "moda",
  // casa_cozinha
  "casa": "casa_cozinha",
  "cozinha": "casa_cozinha",
  "casa e cozinha": "casa_cozinha",
  "utilidades domésticas": "casa_cozinha",
  "decoração": "casa_cozinha",
  // beleza
  "beleza": "beleza",
  "cosméticos": "beleza",
  "cosmeticos": "beleza",
  "cuidados pessoais": "beleza",
  "perfumaria": "beleza",
  // papelaria
  "papelaria": "papelaria",
  "escritório": "papelaria",
  "material escolar": "papelaria",
  // brinquedos
  "brinquedos": "brinquedos",
  "jogos": "brinquedos",
  "walkie talkie": "brinquedos",
  "walkie talkies": "brinquedos",
  "rádio comunicador": "brinquedos",
  // esportes
  "esportes": "esportes",
  "esporte": "esportes",
  "fitness": "esportes",
  "academia": "esportes",
  // automotivo
  "automotivo": "automotivo",
  "carro": "automotivo",
  "automóvel": "automotivo",
  // saude
  "saúde": "saude",
  "saude": "saude",
  "farmácia": "saude",
  "suplementos": "saude",
};

const GUIDES: Record<KnowledgeCategory, string> = {
  acessorios_celular: `
## CATEGORIA: ACESSÓRIOS DE CELULAR

### Atributos Obrigatórios na Ficha Técnica
- Tipo de conector (USB-C, Lightning, Micro-USB, USB-A)
- Potência/corrente máxima (W e A)
- Comprimento do cabo (metros)
- Padrão de carga rápida (PD, QC, AFC, FCP, VOOC etc.)
- Material do revestimento externo
- Tensão de entrada do carregador (bivolt 100-240V é diferencial)
- Compatibilidade de modelos (pelo menos os top 10 mais vendidos no BR)
- Certificações (CE, FCC, anatel quando aplicável)

### Ângulos de Venda Prioritários
1. **Velocidade de carga**: X% em Y minutos → argumento número 1
2. **Durabilidade**: "dobras testadas", material resistente → rebate desconfiança
3. **Universalidade**: quantos dispositivos serve → amplia percepção de valor
4. **Segurança**: proteções contra sobrecarga/curto → tranquiliza pai/mãe
5. **Compatibilidade instantânea**: plug & play, sem configuração

### Objeções Específicas
- "Vai danificar a bateria?" → "Proteção inteligente contra sobrecarga — desliga automaticamente aos 100%"
- "Não é original?" → "Tecnologia compatível certificada — sem risco para o aparelho"
- "O cabo vai estragar rápido?" → "Nylon trançado suporta +10.000 dobras — testado em laboratório"
- "Serve no meu celular [modelo]?" → Liste modelos explicitamente

### Palavras-chave de Alta Conversão (ML e Shopee)
carregador rápido, carga rápida, fast charge, USB-C, tipo-c, cabo resistente, cabo reforçado,
compatível com [marca], 65W, 3A, bivolt, cabo nylon, hub USB, adaptador universal
`,

  eletronicos: `
## CATEGORIA: ELETRÔNICOS / INFORMÁTICA

### Atributos Obrigatórios na Ficha Técnica
- Processador / chipset (se aplicável)
- Memória RAM e armazenamento
- Conectividade (USB, HDMI, Wi-Fi, Bluetooth versão)
- Tensão (bivolt ou voltagem específica)
- Dimensões e peso
- Sistema operacional compatível (Windows/Mac/Linux)
- Certificações e normas

### Ângulos de Venda
1. Compatibilidade com setup existente do comprador
2. Plug & play vs. setup complexo
3. Custo-benefício vs. concorrentes

### Objeções
- "Vai funcionar no meu sistema?" → Liste compatibilidades explicitamente
- "É de qualidade?" → Mencione certificações e garantia
`,

  moda: `
## CATEGORIA: MODA (Roupas, Calçados, Bolsas, Carteiras)

### Atributos Obrigatórios
- Tabela de medidas COMPLETA (BR e internacional)
- Material/composição (% de cada fibra)
- Instruções de lavagem
- Cor exata (não apenas "azul" — "azul marinho", "azul royal")
- País de origem / marca/fabricante
- Para calçados: numeração disponível + tabela de medidas do pé (cm)

### Ângulos de Venda
1. **Caimento e conforto**: Como fica no corpo, para qual tipo físico
2. **Ocasião de uso**: Casual, work, festa, academia — contexto importa
3. **Qualidade do material**: Detalhes justificam preço
4. **Versatilidade**: "Combine com X, Y ou Z"

### Regras Críticas para ML/Shopee
- Fotos em manequim ou modelo humano convertem 3x mais que produto sem contexto
- SEMPRE inclua tabela de medidas no anúncio — evita devolução
- Descreva o caimento honestamente ("veste justo", "modelo grande")

### Objeções
- "Vai servir em mim?" → Tabela de medidas + indicação de tipo de corpo
- "A cor é igual à foto?" → Descreva condição de iluminação da foto
- "O material é de qualidade?" → % composição + como lavar
`,

  casa_cozinha: `
## CATEGORIA: CASA E COZINHA

### Atributos Obrigatórios
- Dimensões (L x A x P em cm)
- Material (aço inox, plástico ABS, vidro temperado etc.)
- Capacidade (litros, kg, unidades)
- Voltagem (se elétrico) — bivolt é diferencial
- Cor(es) disponíveis
- Conteúdo da embalagem
- Marca e modelo do fabricante

### Ângulos de Venda
1. Solução para problema doméstico específico
2. Economia de tempo/espaço
3. Durabilidade e facilidade de limpeza
4. Design que combina com cozinha/sala

### Objeções
- "Cabe no meu espaço?" → Dimensões detalhadas + foto com objeto de referência
- "É fácil de limpar?" → Materiais laváveis, se vai à máquina de lavar louça
`,

  beleza: `
## CATEGORIA: BELEZA E CUIDADOS PESSOAIS

### Atributos Obrigatórios
- Composição/ingredientes ativos (INCI name ou nome popular)
- Volume / quantidade (ml, g, unidades)
- Tipo de pele/cabelo/uso indicado
- Instruções de uso
- Registro ANVISA (obrigatório para cosméticos no Brasil)
- Validade / prazo de validade após abertura

### Ângulos de Venda
1. Resultado visível em X dias/usos
2. Para tipo de pele/cabelo específico
3. Ingredientes naturais / sem parabenos / vegano (quando aplicável)
4. Custo por uso vs. concorrentes

### Regras Críticas
- OBRIGATÓRIO mencionar registro ANVISA no anúncio
- Proibido fazer afirmações terapêuticas em cosméticos (ANVISA)
- Antes/depois podem ser usados com disclaimers adequados

### Objeções
- "Funciona mesmo?" → Ingredientes ativos com respaldo científico
- "Serve para meu tipo de pele?" → Especifique exatamente
`,

  papelaria: `
## CATEGORIA: PAPELARIA E ESCRITÓRIO

### Atributos Obrigatórios
- Quantidade por embalagem / pacote
- Dimensões (para papel: A4, A5, etc.)
- Gramatura (papel, cartão)
- Material / composição
- Compatibilidade (impressoras, sistemas)

### Ângulos de Venda
1. Custo por unidade vs. compra avulsa
2. Qualidade de impressão / escrita
3. Compatibilidade garantida
4. Embalagem econômica para uso contínuo
`,

  brinquedos: `
## CATEGORIA: BRINQUEDOS E JOGOS

### Atributos Obrigatórios
- Faixa etária recomendada (OBRIGATÓRIO — ABNT NBR 15236)
- Certificação INMETRO (OBRIGATÓRIO para brinquedos no Brasil)
- Material — classificação de segurança
- Dimensões e peso
- Conteúdo da embalagem (peças)
- Pilhas necessárias (tipo/quantidade)
- Marca e modelo

### Ângulos de Venda
1. **Segurança e certificação**: Argumento de compra número 1 para pais
2. **Desenvolvimento**: Habilidades que o brinquedo estimula
3. **Durabilidade**: Material resistente para criança usar e abusar
4. **Diversão**: Descreva como a criança vai se divertir

### Regras Críticas
- OBRIGATÓRIO citar INMETRO e faixa etária no título ou primeiras linhas
- Avisos de segurança são legalmente obrigatórios na descrição
- Para walkie-talkies: mencione alcance real (não o do fabricante — reduza 30-40%)

### Objeções
- "É seguro para criança?" → INMETRO + faixa etária + materiais não tóxicos
- "Funciona bem?" → Alcance real, bateria, descrição de funcionamento
- "É resistente?" → Material, garantia, revisões de clientes
`,

  esportes: `
## CATEGORIA: ESPORTES E FITNESS

### Atributos Obrigatórios
- Tamanho / numeração
- Material e composição
- Peso (para equipamentos)
- Carga máxima suportada (para equipamentos de peso/estrutura)
- Certificações (se aplicável)

### Ângulos de Venda
1. Performance e resultado esperado
2. Conforto durante uso prolongado
3. Custo vs. academia
4. Durabilidade para uso intenso

### Objeções
- "Aguenta meu peso?" → Carga máxima explícita
- "É de qualidade profissional?" → Materiais, uso sugerido
`,

  automotivo: `
## CATEGORIA: AUTOMOTIVO

### Atributos Obrigatórios
- Compatibilidade com modelos de veículo (marca/modelo/ano)
- Material
- Dimensões de instalação
- Voltagem (12V / 24V)
- Certificações (DENATRAN, INMETRO quando aplicável)

### Ângulos de Venda
1. Compatibilidade garantida com o veículo do comprador
2. Facilidade de instalação (plug & play vs. precisa de mecânico)
3. Durabilidade (exposição a calor, vibração)

### Objeções
- "Serve no meu carro?" → Liste makes/models/anos explicitamente
- "É fácil instalar?" → Descreva o processo de instalação
`,

  saude: `
## CATEGORIA: SAÚDE E SUPLEMENTOS

### Atributos Obrigatórios
- Composição / informação nutricional (para suplementos)
- Registro ANVISA (obrigatório)
- Quantidade / dosagem por embalagem
- Modo de uso / posologia
- Contraindicações principais
- Data de validade (indicar lote/validade disponível)

### Regras Críticas
- NUNCA faça afirmações de cura, tratamento ou prevenção de doenças (ANVISA)
- OBRIGATÓRIO: "Consulte um médico antes de usar" para produtos com restrições
- Suplementos alimentares: seguir regulamentação RDC 243/2018

### Ângulos de Venda
1. Composição de qualidade / pureza
2. Resultado esperado com disclaimer
3. Custo por dose vs. concorrentes
`,
};

export function getCategoryGuide(category: KnowledgeCategory): string {
  return GUIDES[category] || GUIDES["eletronicos"];
}

/** Normalize a free-text category string to a KnowledgeCategory key */
export function normalizeCategory(raw: string): KnowledgeCategory {
  if (!raw) return "eletronicos";
  const lower = raw.toLowerCase().trim();
  // Direct match
  if (lower in CATEGORY_ALIASES) return CATEGORY_ALIASES[lower];
  // Substring match
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) return cat;
  }
  return "eletronicos";
}
