/**
 * Category-specific photography guidance for AI image prompt generation.
 * Complements category-guides.ts (text/SEO) with VISUAL direction:
 * backgrounds, lighting moods, hero angles, and style per category.
 * Injected into generate-prompts via buildKnowledge().
 */

import { type KnowledgeCategory } from "./category-guides.ts";

const CATEGORY_IMAGE_GUIDES: Record<KnowledgeCategory, string> = {

  acessorios_celular: `
## DIREÇÃO FOTOGRÁFICA — ACESSÓRIOS DE CELULAR

**Background:** Branco puro (capa obrigatória) ou preto fosco/grafite (fotos adicionais tech).
**Iluminação:** Clean studio — luz key suave, small softbox, nenhuma sombra dura.
**Ângulo hero:** 3/4 frontal mostrando conector principal + comprimento de cabo simultaneamente (se aplicável).
**Detalhes prioritários:** Conector visível e nítido; material do revestimento (nylon trançado, silicone); LED de indicação se houver.
**Lifestyle:** Mão segurando smartphone com cabo conectado OU mão humana segurando o produto para escala.
**Evitar:** Background bagunçado; render plástico/CGI; reflexos exagerados no conector.
`,

  eletronicos: `
## DIREÇÃO FOTOGRÁFICA — ELETRÔNICOS / INFORMÁTICA

**Background:** Branco puro (capa) ou cinza escuro/preto (fotos complementares — look premium tech).
**Iluminação:** Dramática e direcional para destacar acabamento — luz key 45° com fill suave.
**Ângulo hero:** 3/4 frontal mostrando painel principal + portas/conectores; ângulo levemente elevado.
**Detalhes prioritários:** Portas e conectores nítidos; LED e indicadores; acabamento da superfície (alumínio, plástico matte).
**Lifestyle:** Produto em uso em mesa de trabalho contemporânea (notebook aberto, monitor ligado).
**Escala:** Mão humana ao lado ou produto sobre mesa para escala natural.
**Evitar:** Reflexos metálicos exagerados; plasticidade CGI; background muito texturizado.
`,

  moda: `
## DIREÇÃO FOTOGRÁFICA — MODA (ROUPAS, CALÇADOS, BOLSAS)

**Background:** Branco neutro para capa (ML/Amazon obrigatório); lifestyle em ambiente clean para fotos adicionais.
**Iluminação:** Natural difusa (janela lateral) ou strobe suave para renderizar textura do tecido fielmente.
**Ângulo hero:** Frontal plano (flat lay) para peças sem manequim; ou modelo/manequim em pé, ângulo ligeiramente abaixo da linha dos olhos.
**Detalhes prioritários:** Textura do tecido; costuras; detalhes (botões, zíper, fivela); cor exata.
**Lifestyle:** Modelo usando a peça em contexto aspiracional (café, rua urbana, academia) — luz natural sempre que possível.
**Calçados:** 45° mostrando sola + perfil + frontal; close-up de sola e acabamento.
**Bolsas/carteiras:** Aberta mostrando interior + fechada mostrando exterior.
**Evitar:** Cores distorcidas; tecido amassado desnecessariamente; modelo em poses artificiais.
`,

  casa_cozinha: `
## DIREÇÃO FOTOGRÁFICA — CASA E COZINHA

**Background:** Branco ou superfície neutra (mármore, granito claro, madeira clara) para capa.
**Iluminação:** Luz de janela lateral (natural) para fotos lifestyle; studio suave para capa.
**Ângulo hero:** Ligeiramente elevado (45°) para utensílios e panelas para mostrar interior; 3/4 frontal para eletrodomésticos.
**Detalhes prioritários:** Interior do produto (panelas, bowls) se relevante; acabamento; encaixes e travas.
**Lifestyle:** Produto em uso na cozinha/mesa — mão humana segurando ou produto no contexto funcional.
**Flat lay:** Produto + ingredientes/complementos sobre superfície texturizada para contexto.
**Escala:** Produto ao lado de item comum (maçã, garrafa, faca de cozinha) para comunicar tamanho.
**Evitar:** Background muito ocupado; props que distraem; iluminação amarelada.
`,

  beleza: `
## DIREÇÃO FOTOGRÁFICA — BELEZA E CUIDADOS PESSOAIS

**Background:** Branco puro ou tom neutro muito suave (creme, blush pálido, lavanda clara) — nunca cores fortes.
**Iluminação:** Luz extremamente suave e difusa (sem sombras duras); luz de anel (ring light) flatters produtos cosméticos.
**Ângulo hero:** Frontal ou levemente 3/4; produto na vertical se embalagem alta (sérum, frasco).
**Detalhes prioritários:** Rótulo legível; textura do produto (se gel, creme, pó); acabamento da embalagem.
**Lifestyle:** Produto em mesa de banheiro clean OU em mão feminina com skin tone neutro.
**Flat lay:** Produto + ingredientes naturais key (flores, frutas, folhas) que remetem à fórmula.
**Evitar:** Background saturado; sombras que cruzam o rótulo; reflexos no frasco que impedem leitura.
`,

  papelaria: `
## DIREÇÃO FOTOGRÁFICA — PAPELARIA E ESCRITÓRIO

**Background:** Branco puro (capa) ou mesa de escritório clean (madeira clara ou branca).
**Iluminação:** Studio suave, overhead flat ou light box para flat lay; luz natural de janela para lifestyle.
**Ângulo hero:** Flat lay ligeiramente diagonal (45°) para conjuntos; frontal para itens únicos.
**Detalhes prioritários:** Ponta do produto (canetas, lápis); mecanismo (clique, rosca); cores disponíveis.
**Lifestyle:** Produto em uso — mão escrevendo em caderno; planner aberto; mesa organizada.
**Flat lay:** Conjunto de produtos organizados com caderno e planner — vibe produtividade.
**Evitar:** Fundo muito ocupado; papel rabiscado; iluminação amarelada.
`,

  brinquedos: `
## DIREÇÃO FOTOGRÁFICA — BRINQUEDOS E JOGOS

**Background:** Branco puro obrigatório para capa (seg. marketplace); fundo colorido vivo para fotos complementares.
**Iluminação:** Luz bright e alegre — sem sombras pesadas; vibe divertida e segura.
**Ângulo hero:** Frontal mostrando toda a extensão do brinquedo; levemente elevado para jogos de tabuleiro.
**Detalhes prioritários:** Tamanho real (criança ou mão para escala); botões e funcionalidades; cores vibrantes.
**Lifestyle:** Criança brincando com o produto em ambiente doméstico seguro — natural, autêntico.
**Flat lay:** Todos os itens incluídos (peças, baterias, manual) organizados para mostrar completude.
**Evitar:** Cenários artificiais; sombras que escurecem o produto; ausência de escala.
`,

  esportes: `
## DIREÇÃO FOTOGRÁFICA — ESPORTES E FITNESS

**Background:** Branco puro (capa); fundo neutro escuro ou concreto para fotos complementares — look performance.
**Iluminação:** Direcional com contraste moderado para transmitir energia e durabilidade.
**Ângulo hero:** 3/4 diagonal com leve elevação — dinâmico sem exagero.
**Detalhes prioritários:** Material e textura (borracha, neoprene, malha); logotipo da marca se relevante; mecanismos de ajuste.
**Lifestyle:** Produto em uso por atleta/persona em ambiente de prática (academia, parque, campo).
**Escala:** Produto com item de treino familiar (garrafa d'água, haltere, tênis) para contexto e proporção.
**Evitar:** Background excessivamente fake; modelo em pose artificial; falta de energia.
`,

  automotivo: `
## DIREÇÃO FOTOGRÁFICA — AUTOMOTIVO

**Background:** Branco técnico (capa); ambiente de garagem/carro para fotos complementares.
**Iluminação:** Dramática e metálica — luz direcional revelando reflexos de superfícies metálicas ou plástico técnico.
**Ângulo hero:** 3/4 frontal mostrando conectores, encaixes e design geral do produto.
**Detalhes prioritários:** Conectores (OBD, USB, adaptador de isqueiro); material (borracha, metal, plástico ABS); indicadores luminosos.
**Lifestyle:** Produto instalado no interior do carro — painel real, porta USB do veículo, encosto de cabeça.
**Escala:** Produto ao lado de chave de carro ou smartphone para referência de tamanho.
**Evitar:** Background genérico sem contexto automotivo; reflexos que escondem detalhes.
`,

  saude: `
## DIREÇÃO FOTOGRÁFICA — SAÚDE E SUPLEMENTOS

**Background:** Branco limpo e clínico (capa obrigatória); fundo neutro claro para fotos adicionais.
**Iluminação:** Studio suave e plano — clean, higienizado, confiável.
**Ângulo hero:** Frontal direto (pote, frasco, caixa) mostrando rótulo completo; ou 3/4 para embalagens com profundidade.
**Detalhes prioritários:** Rótulo legível (registro ANVISA se visível é um positivo); lacre de segurança; consistência do produto se cápsula/pó.
**Lifestyle:** Produto ao lado de ingredientes naturais (fruta, erva, mel) OU em contexto de uso (sobre mesa de jantar saudável, mão adulta segurando).
**Flat lay:** Produto + ingredientes principais + copo d'água — vibe "protocolo de saúde diário".
**Evitar:** Background hospitalar exagerado; sombras pesadas no rótulo; produtos abertos sem necessidade.
`,

};

/**
 * Returns photography guidance for the given category, or a generic guide if unknown.
 */
export function getCategoryImageGuide(category: KnowledgeCategory | string | undefined): string {
  if (!category || !(category in CATEGORY_IMAGE_GUIDES)) return GENERIC_IMAGE_GUIDE;
  return CATEGORY_IMAGE_GUIDES[category as KnowledgeCategory];
}

const GENERIC_IMAGE_GUIDE = `
## DIREÇÃO FOTOGRÁFICA — PRODUTO GERAL

**Background:** Branco puro (capa obrigatória marketplaces BR).
**Iluminação:** Studio suave, key light lateral, fill suave oposto.
**Ângulo hero:** 3/4 frontal levemente elevado — mostra frente + lateral.
**Detalhes:** Close-up do detalhe de maior diferencial do produto.
**Lifestyle:** Produto em uso com mão humana ou contexto de uso relevante.
**Escala:** Objeto de referência familiar ao lado para comunicar tamanho.
`;
