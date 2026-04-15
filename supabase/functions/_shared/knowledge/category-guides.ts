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
- Quantidade por embalagem / pacote (fundamental para calcular custo por unidade)
- Dimensões (para papel: A4, A5, Carta; para pastas: cm)
- Gramatura (papel, cartão — g/m²)
- Material / composição (sulfite, couchê, kraft, plástico PP etc.)
- Compatibilidade (impressoras laser/jato de tinta, tipo de arquivo)
- Cor e acabamento (fosco, brilhoso, laminado)

### Ângulos de Venda
1. **Custo por unidade**: Calcule e mostre (ex: "R$0,08 por folha — metade do preço de papelaria")
2. **Qualidade de impressão / escrita**: Para papel, gramatura alta = impressão sem transparência
3. **Compatibilidade garantida**: Para cartuchos e toners es — liste modelos de impressora
4. **Embalagem econômica** para uso contínuo e corporativo
5. **Produtividade**: Item que facilita o dia a dia do profissional ou estudante

### Keywords de Alta Conversão
- papel sulfite, resma a4, folha A4, papel para impressora, caderno universitário
- caneta esferográfica, caneta gel, marca texto, post-it, bloco de notas
- pasta arquivo, fichário, organizador, porta-retrato, moldura
- cartucho, toner, compatível, original, impressora [marca]

### Objeções
- "Vai manchar/borrar?" → Gramatura alta, tinta/pigmento de qualidade
- "Serve na minha impressora?" → Liste modelos de impressora explicitamente
- "Vai durar quanto tempo?" → Quantidade total de unidades, estimativa de uso
- "É compatível ou original?" → Seja claro sobre original vs. compatível e qualidade
- "Qual a diferença de gramatura?" → Explique: 75g normal, 90g premium, 120g+ premium/foto
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
- Tamanho / numeração (PP/P/M/G/GG ou numérico exato — fundamental para evitar troca)
- Material e composição (100% poliéster, nylon, algodão, borracha EVA etc.)
- Peso do produto (para equipamentos e pesos)
- Carga máxima suportada (para halteres, bancadas, elásticos de resistência)
- Dimensões dobrado e aberto (colchonetes, tapetes, redes etc.)
- Nível de nível (iniciante / intermediário / profissional)

### Ângulos de Venda
1. **Resultado prático concreto**: "Queima até X kcal em 30 min" — dados específicos
2. **Conforto e ergonomia**: Tecido tecnológico, caimento, amortecimento — detalhe o benefício
3. **Custo vs. academia**: "Economize até R$150/mês com treino em casa"
4. **Durabilidade para uso intenso**: Costuras reforçadas, material resistente a suor e lavagens
5. **Versatilidade**: "Serve para corrida, cross training e caminhada"

### Keywords de Alta Conversão
- kit halteres, elástico resistência, colchonete yoga, tapete pilates, corda pular
- bermuda academia, legging feminina, camiseta dry fit, tênis corrida
- bicicleta ergométrica, esteira, kettlebell, barra fixa, prancha abdominal
- suplemento pré-treino, proteína whey, creatina, BCAA, coqueteleira

### Objeções
- "Aguenta meu peso?" → Carga máxima explícita (ex: "suporta até 120kg")
- "O tamanho vai servir?" → Tabela de medidas com cintura/quadril/ombro em cm
- "É de qualidade profissional ou iniciante?" → Nível de uso e material
- "Vai durar lavagens?" → Material antimicrobiano, resistência ao cloro, instruções de lavagem
- "O colchonete tem espessura suficiente?" → Espessura em cm + indicação (yoga: 6mm, pilates: 15mm)
- "O elástico vai arrebentar logo?" → Material (latex/látex natural), carga em kg, número de dobras
`,

  automotivo: `
## CATEGORIA: AUTOMOTIVO

### Atributos Obrigatórios
- Compatibilidade com modelos de veículo: marca / modelo / ano (ESSENCIAL — primeiro campo que o comprador confere)
- Material e acabamento (ABS, couro sintético, alumínio, borracha SBR)
- Dimensões de instalação (largura, profundidade, diâmetro)
- Tensão de operação (12V / 24V — carro / caminhão)
- Certificações quando aplicáveis (DENATRAN para rastreadores, INMETRO para capacetes)
- Inclui kit de instalação? Quais peças vêm na embalagem?

### Ângulos de Venda
1. **Compatibilidade garantida**: Liste explicitamente marcas/modelos/anos — é o argumento #1 para fechar
2. **Instalação sem mecânico**: "Plug & play, sem furos — instale em 5 minutos" aumenta conversão
3. **Durabilidade sob calor e vibração**: Interior de carro chega a 80°C — materiais que aguentam
4. **Segurança e proteção**: Para câmeras de ré, alertas de ponto cego, airbags etc.
5. **Valorização do veículo**: Acessórios de acabamento aumentam percepção de valor

### Keywords de Alta Conversão
- câmera de ré, suporte celular carro, carregador veicular, tapete automotivo
- capa banco, protetor capo, localizador GPS veicular, película protetora
- sensor estacionamento, alarme, central multimídia, som automotivo
- compatível [Gol/Civic/HB20/Onix/Strada/Corolla/Tracker] [ano]

### Objeções
- "Serve no meu carro [modelo/ano]?" → Liste 10+ modelos populares explicitamente (Gol, Onix, Tracker, HB20, Creta, Strada, SW4)
- "É fácil instalar?" → Descreva o processo passo a passo + tempo estimado
- "Precisa de instalador/mecânico?" → Seja claro: plug & play ou instalação profissional
- "O suporte vai cair com o calor?" → Material resistente a temperatura, teste de aderência
- "Vai arranhar o painel?" → Base protetora de silicone, fixação sem adesivo permanente
- "É original ou genérico?" → Mencione se é peça original da montadora ou acessório aftermarket
`,

  saude: `
## CATEGORIA: SAÚDE E SUPLEMENTOS

### Atributos Obrigatórios
- Composição / tabela nutricional (para suplementos: proteínas, carboidratos, calorias por porção)
- Registro ANVISA (obrigatório para cosméticos, suplementos e dispositivos médicos)
- Quantidade total / porções por embalagem (calcule custo por dose!)
- Modo de uso / posologia recomendada
- Contraindicações principais (grávidas, lactantes, menores de 18 anos)
- Sabor / forma (cápsulas, pó, comprimido, líquido)

### Regras Críticas — AVISO LEGAL
- NUNCA faça afirmações de cura, tratamento, diagnóstico ou prevenção de doenças (proibido ANVISA/CFM)
- NUNCA use palavras: "cura", "trata", "previne [doença]", "medicamento"
- Use linguagem permitida: "contribui para", "auxilia na manutenção de", "apoia a função"
- OBRIGATÓRIO em suplementos: "Este produto não substitui uma alimentação equilibrada."
- Para dispositivos médicos: Certificado ANVISA + número de registro

### Ângulos de Venda
1. **Custo por dose**: Calcule e mostre (ex: "Apenas R$2,50 por dia de suplementação")
2. **Qualidade e pureza**: Origem dos ingredientes, ausência de aditivos desnecessários
3. **Resultado esperado com disclaimer** (ex: "associado a exercícios e dieta")
4. **Praticidade**: Formato, facilidade de consumo, sabor (para suplementos)
5. **Credibilidade**: Certificações, origem importada/nacional, marca reconhecida

### Keywords de Alta Conversão
- whey protein, proteína concentrada isolada, creatina monohidratada, BCAA aminoácido
- termogênico, pré-treino, hipercalórico, albumina, colágeno hidrolisado
- vitamina D3 K2, ômega 3, multivitamínico, complexo B, magnésio dimalato
- aparelho pressão, oxímetro, termômetro digital, medidor glicose, nebulizador
- melatonina, própolis, vitamina C, zinco, probiótico, fibra alimentar

### Objeções
- "Realmente funciona?" → Ingredientes ativos com mecanismo de ação explicado (sem claims proibidos)
- "Tem algum efeito colateral?" → Contraindicações claras + "consulte um médico antes de usar"
- "Serve para quem não malha?" → Deixe claro o público-alvo e casos de uso
- "Qual a concentração por cápsula/dose?" → Lista todas as quantidades (mg/mcg) por porção
- "É de boa qualidade?" → Certificações, origem, marca, registro ANVISA
- "Quando vou sentir o resultado?" → Expectativa realista + disclaimer de resultados variáveis
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
