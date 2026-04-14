# Auditoria: Sistema de Geração de Imagens — Peepers Tools

> Prompt para auditoria técnica e de produto do pipeline de geração de imagens.
> Use com um modelo de raciocínio avançado (Claude Opus, GPT-4o, Gemini 2.5 Pro).
> Forneça junto com este prompt os arquivos-fonte listados em [Anexos obrigatórios](#anexos-obrigatórios).

---

## Papel do auditor

Atue como **principal architect de IA multimodal** com competências simultâneas em:

- Prompt engineering para modelos de geração de imagem
- Avaliação comparativa de modelos/provedores de IA de imagem
- Arquitetura de integrações multi-provider
- UX de produtos SaaS B2B voltados para sellers de e-commerce
- Operação e custos de sistemas de IA em produção

Sua função é auditar profundamente o sistema de geração de prompts de imagem **e** os provedores/modelos de IA que geram essas imagens, propondo uma arquitetura de próxima geração.

---

## Contexto do produto

**Peepers Tools** é um SaaS de criação automatizada de anúncios visuais para marketplaces brasileiros (Mercado Livre, Shopee, Amazon BR, Magalu). O público-alvo são sellers brasileiros, não técnicos.

### Wizard de 5 etapas

| Etapa | O que acontece |
|-------|----------------|
| 1. Upload | Seller envia fotos reais do produto |
| 2. Identificação | IA identifica produto, categoria e características a partir das fotos |
| 3. Prompts + Geração | IA gera 7 prompts de imagem + Visual DNA → cada prompt gera uma imagem usando fotos de referência |
| 4. Overlay | Editor visual de canvas aplica textos, badges e ícones sobre as imagens geradas |
| 5. Exportação | Pacote ZIP com todas as imagens + copy |

### Stack relevante para esta auditoria

| Camada | Tecnologia |
|--------|-----------|
| Edge Functions | Deno (Supabase Edge Functions) |
| IA texto/visão | Google Gemini 2.5 Flash (function-calling, vision) |
| IA imagem | Gemini 2.5 Flash Image (geração), DALL-E 3, Flux 1.1 Pro/Schnell (via BYOK) |
| Storage | Supabase Storage (`product-photos/`, `generated-images/`) |
| Knowledge Base | 7 módulos montados por `buildKnowledge()` (~6 000 tokens por chamada) |

### Pipeline atual de geração de imagem

```
fotos do seller
    ↓
identify-product (Gemini vision) → nome, categoria, características
    ↓
generate-prompts → system prompt monolítico (~2 500 tokens)
                    + knowledge base (~6 000 tokens)
                    + dados do produto
                    → 7 prompts em inglês + Visual DNA (JSON)
    ↓
generate-image (por prompt) → fotos de referência (até 3) 
                              + regras de FIDELITY/REALISM pré-fixadas no código
                              + prompt gerado
                              + feedback opcional (loop de refinamento)
                              → imagem gerada (base64 → Storage)
```

### Modelo BYOK (Bring Your Own Key)

O sistema suporta múltiplos provedores via chave do próprio usuário:
- **Google**: Gemini 2.5 Flash (texto), Gemini 2.5 Flash Image (imagem)
- **OpenAI**: GPT-4o/Mini (texto), DALL-E 3 (imagem)
- **Anthropic**: Claude Sonnet/Haiku (texto, sem geração de imagem)
- **Replicate**: Flux 1.1 Pro, Flux Schnell (imagem)

O roteamento acontece em `callAI()` que resolve provider/modelo do user config.

---

## Problemas identificados

### P1 — Prompts monolíticos e longos demais
O system prompt de `generate-prompts` mistura em um único bloco:
- Regras permanentes do sistema (FIDELITY, REALISM)
- Definição dos 7 image roles (COVER, BENEFITS, FEATURES, etc.)
- Instruções de Visual DNA
- Regras de composição por tipo de imagem
- Restrições de output

Depois, `generate-image` *duplica* as regras de FIDELITY e REALISM em código hardcoded, pré-fixando ao prompt que já as contém. Isso cria redundância, risco de conflito e dificulta manutenção.

### P2 — Regras globais × regras específicas misturadas
Não há separação entre:
- Regras que se aplicam a **toda** imagem (fidelidade, realismo, qualidade)
- Regras que se aplicam a uma **categoria** de imagem (lifestyle vs packshot)
- Regras que se aplicam a um **marketplace** (Amazon exige fundo branco puro, Shopee permite badges)
- Regras que vêm do **contexto do produto** (categoria, características)

Tudo está inline em um único template string.

### P3 — Prompts finais em inglês, mas interface em português
Os prompts são gerados em inglês e exibidos ao seller brasileiro no `PromptCardItem`. O seller vê um texto técnico em inglês que não entende, não consegue avaliar, e no entanto precisa "aprovar". Isso quebra a experiência.

### P4 — Sem suporte arquitetural a multi-provider
Cada provedor tem capacidades diferentes (image-to-image, inpainting, múltiplas referências), mas o pipeline assume um formato único. As regras de FIDELITY/REALISM são escritas em linguagem natural genérica sem adaptação ao modelo que vai executar.

### P5 — Sem versionamento de prompts
Mudanças no system prompt de `generate-prompts` afetam todos os usuários instantaneamente. Não há como comparar resultados entre versões, fazer A/B, ou rastrear regressões.

---

## Escopo da auditoria

### 1. Diagnóstico técnico do sistema atual

Analise os arquivos fonte (anexos) e identifique:

- **Redundância**: onde regras são duplicadas entre `generate-prompts` e `generate-image`
- **Conflito**: onde instruções no system prompt podem contradizer instruções pré-fixadas
- **Ambiguidade**: instruções vagas que o modelo pode interpretar de formas inconsistentes
- **Excesso**: instruções que aumentam custo/latência sem melhorar resultado
- **Hierarquia ruim**: instruções mal ordenadas (o modelo prioriza o início e o fim do prompt)
- Impacto concreto em: custo (tokens), latência, qualidade visual, consistência entre as 7 imagens, debug

### 2. Arquitetura de prompts

Proponha uma arquitetura modular que separe claramente:

| Camada | Conteúdo | Persistência |
|--------|----------|-------------|
| **Base global** | FIDELITY, REALISM, qualidade mínima | Versionada em código |
| **Regras por marketplace** | Fundo branco, resoluções, limites | `knowledge/image-rules.ts` |
| **Regras por categoria** | Estilo fotográfico, props, iluminação | `knowledge/category-guides.ts` |
| **Regras por image role** | Composição, negative space, ângulo | Nova camada a criar |
| **Contexto do produto** | Nome, características, Visual DNA | Dinâmico por request |
| **Parâmetros por modelo** | Formato, aspect ratio, strength, guidance | Config por provider |
| **Prompt final compilado** | Montagem ordenada das camadas acima | Gerado em runtime |

Avalie se o ideal é:
- Template modular com placeholders
- JSON intermediário compilado em texto para o modelo
- Builder pattern por blocos com priorização
- Taxonomia de intents visuais (packshot, lifestyle, detail, etc.)
- Camadas de fallback por provedor

### 3. Pipeline de geração de prompts

Proponha um pipeline completo:

```
input do seller (PT-BR)
  → normalização e sanitização
  → classificação da intenção visual (packshot, lifestyle, etc.)
  → extração de atributos do produto
  → resolução de regras: global + marketplace + categoria + role
  → escolha do modelo (com base em capacidade e custo)
  → compilação do prompt final (idioma e formato do modelo alvo)
  → geração da imagem
  → logging estruturado (request → prompt compilado → resultado)
  → avaliação de conformidade com o brief (opcional, modelo auditor)
```

Para cada etapa, indique: quem executa (edge function, frontend, modelo de IA), formato de entrada/saída, e se é síncrono ou assíncrono.

### 4. Problema do idioma: inglês × português

O seller é brasileiro. Considere estes cenários e recomende **uma** estratégia clara:

| Alternativa | O seller vê | O modelo recebe | Trade-off |
|-------------|------------|-----------------|-----------|
| A. Prompt oculto | Brief em PT-BR dele + prévia da imagem gerada | Prompt compilado em EN internamente | Seller não avalia prompt, só resultado |
| B. Resumo interpretado | "Entendemos: foto macro do produto com iluminação lateral" em PT-BR | Prompt técnico em EN | Seller valida a intenção, não o texto técnico |
| C. Visão dupla | Toggle PT-BR / EN no card do prompt | Ambas versões mantidas | Mais complexo, útil para power users |
| D. Prompt canônico neutro | JSON estruturado com campos nomeados em PT-BR | JSON compilado para EN na hora do envio | Máxima rastreabilidade |
| E. Tudo em PT-BR | Prompt em PT-BR | Mesmo texto em PT-BR | Simples, mas pode degradar resultado em alguns modelos |

Considere: experiência do seller, capacidade de debug interno, custo de manutenção de tradução, qualidade do resultado por modelo.

### 5. Auditoria de modelos e provedores

Monte uma **matriz comparativa real** dos modelos viáveis para este produto. Considere **apenas** modelos com API disponível em produção que aceitem imagem de referência e/ou edição.

Avalie cada modelo/provedor em:

| Critério | Descrição |
|----------|-----------|
| Text-to-image | Gera imagem a partir de texto |
| Image-to-image | Usa imagem de referência para gerar variação |
| Edição / Inpainting | Edita região específica de imagem existente |
| Múltiplas referências | Aceita 2+ imagens de referência simultâneas |
| Fidelidade de produto | Mantém forma, cor, textura, logo do produto referência |
| Consistência entre gerações | Mesma seed/prompt → resultados similares |
| Qualidade fotográfica | Realismo, iluminação, resolução |
| Prompts estruturados | Segue instruções complexas com múltiplas restrições |
| Velocidade | Tempo médio de geração |
| Custo por imagem | USD estimado em resolução de produção |
| Texto na imagem | Qualidade de tipografia renderizada na imagem |
| API / DX | Qualidade da documentação, SDK, estabilidade |
| Maturidade produção | Uptime, rate limits, SLA |

Recomende por caso de uso concreto do Peepers:
- **Packshot** (capa do anúncio, fundo branco, fidelidade máxima)
- **Lifestyle** (produto em contexto de uso)
- **Close-up** (macro de detalhe técnico)
- **Infográfico base** (espaço para overlay de texto)
- **Troca de fundo** (remover fundo e colocar cenário)
- **Composição com referências** (produto + props + cenário)

### 6. Roles diferentes para modelos diferentes

Avalie se a arquitetura ideal deve separar:

| Role | O que faz | Modelo candidato |
|------|-----------|-----------------|
| **Classificador** | Normaliza o brief do seller em intent + atributos | Gemini Flash / GPT-4o-mini |
| **Compilador de prompt** | Monta o prompt final a partir do JSON intermediário | Determinístico (código, não IA) ou Flash |
| **Gerador de imagem** | Executa a geração visual | Gemini Image / DALL-E 3 / Flux / outro |
| **Auditor de qualidade** | Verifica se a imagem gerada respeita o brief | Gemini Vision / GPT-4o Vision |
| **Fallback** | Modelo alternativo se o primário falhar | Segundo provider |

Recomende se vale o custo/complexidade de cada role separada versus um pipeline mais simples.

### 7. Imagens de referência e edição

O Peepers envia até 3 fotos de referência do seller ao modelo de geração. Analise:

- **Quando usar como inspiração** vs **referência rígida** vs **imagem base para edição**
- **Como marcar o papel de cada imagem** no pipeline (foto de produto, foto de estilo, foto de ambiente)
- **Como representar na arquitetura de dados**:

```typescript
// Proposta de payload — critique e melhore
interface ImageReference {
  url: string;
  role: "product" | "style" | "background" | "detail" | "packaging";
  fidelity: "strict" | "inspired" | "edit-base";
  weight?: number; // 0-1, influência relativa
}
```

- **Diferenças de API por provedor**: como adaptar o payload para cada um (Gemini aceita inline images, DALL-E usa edit endpoint, Flux usa image_url + strength)
- **Cenários cruciais**: manter fidelidade de embalagem/logotipo/cor ao usar referência

### 8. Refatoração dos prompts atuais

Proponha um método concreto para refatorar o sistema existente:

1. **Inventário**: listar todas as instruções distintas nos prompts atuais (`generate-prompts/index.ts` + `generate-image/index.ts`)
2. **Classificação**: para cada instrução, classificar como: global permanente, por marketplace, por categoria, por role, por produto, ou redundante/conflitante
3. **Deduplicação**: eliminar duplicações entre `generate-prompts` e `generate-image`
4. **Modularização**: criar módulos importáveis (análogo ao que já existe em `_shared/knowledge/`)
5. **Medição**: como comparar qualidade antes/depois (métricas visuais, consistência, satisfação do seller)

### 9. UX da geração de imagens

Proponha melhorias concretas para a interface (Steps 3-4 do wizard), considerando seller brasileiro não técnico:

- **Briefing guiado**: campos estruturados em vez de prompt livre (estilo, ângulo, fundo, iluminação)
- **Feedback interpretado**: "Entendemos que você quer: [X]" em PT-BR antes de gerar
- **Exibição de referências**: mostrar as fotos do seller com tags do papel de cada uma
- **Slider fidelidade × criatividade**: controle visual que mapeia para `guidance_scale`/`strength`
- **Prompt oculto vs visível**: toggle para power users, escondido por padrão
- **Regeneração com feedback**: manter funcionalidade atual mas com UI mais clara
- **Aprovação**: o seller aprova a **imagem**, não o prompt
- **Logs internos**: área admin com prompt compilado, modelo usado, tokens, latência, custo estimado

### 10. Segurança, custo e operação

Analise decisões operacionais específicas do Peepers:

| Área | O que avaliar |
|------|--------------|
| **Custo** | Estimativa por listing completa (7 imagens + possíveis regenerações); oportunidades de batch/cache |
| **Observabilidade** | O `createRequestLogger` atual é suficiente? Precisa de tracing distribuído? |
| **Prompt injection** | Já usamos `sanitizeForLLM()` + `<user_input>` tags — é suficiente para prompts de imagem? |
| **Storage** | Lifecycle de imagens órfãs (geradas mas não usadas); custo de storage acumulado |
| **Rate limits** | Os limites atuais (generate-image: 50/h, generate-prompts: 20/h) são adequados? |
| **Multi-provider** | Fallback automático se o provider primário falhar ou estiver lento |
| **Versionamento** | Como versionar templates de prompt em produção sem deploy |
| **A/B testing** | Como testar nova versão de prompt com subset de usuários |
| **Lock-in** | Risco de dependência excessiva de um provedor; estratégia de abstração |

---

## Entregáveis obrigatórios

Sua resposta deve conter estes blocos, nesta ordem:

| # | Bloco | Conteúdo |
|---|-------|----------|
| A | **Resumo executivo** | 5-10 linhas com diagnóstico e direção |
| B | **Diagnóstico detalhado** | Problemas encontrados com referência a arquivo/linha |
| C | **Arquitetura de prompts recomendada** | Diagrama de camadas + schema intermediário |
| D | **Pipeline de geração** | Fluxo etapa por etapa com responsáveis |
| E | **Estratégia de idioma** | Recomendação final PT-BR × EN com justificativa |
| F | **Matriz de modelos/provedores** | Tabela comparativa + recomendação por caso de uso |
| G | **Recomendação de stack** | Quais modelos usar para cada role no Peepers |
| H | **Plano de refatoração** | Passos concretos com ordem de execução |
| I | **Proposta de UX** | Wireframes textuais ou descrição detalhada da interface |
| J | **Operação e custos** | Estimativas, alertas, decisões de infra |
| K | **Roadmap em fases** | Fase 1 (quick wins) → Fase 2 (arquitetura) → Fase 3 (escala) |
| L | **Checklist de implementação** | Lista acionável com prioridade e dependências |

---

## Modo de resposta

- Seja extremamente crítico — aponte erros de premissa se existirem
- Referencie arquivos e funções reais do codebase (estão nos anexos)
- Diferencie claramente: **recomendação ideal**, **alternativa mais simples**, e **riscos**
- Proponha schemas, tabelas, fluxos e exemplos concretos — não seja genérico
- Considere que o projeto tem 1 desenvolvedor e precisa de soluções incrementais
- Explique trade-offs de custo, complexidade e qualidade para cada decisão
- Se uma seção exigir muito mais contexto que o fornecido, indique exatamente o que falta

---

## Anexos obrigatórios

Forneça estes arquivos junto com o prompt:

| Arquivo | Conteúdo relevante |
|---------|-------------------|
| `supabase/functions/generate-prompts/index.ts` | System prompt completo + tool schema |
| `supabase/functions/generate-image/index.ts` | Pipeline de geração + regras hardcoded |
| `supabase/functions/_shared/helpers.ts` | `callAI()`, `callGoogleAI()`, provider routing, BYOK |
| `supabase/functions/_shared/knowledge/image-rules.ts` | Regras de imagem por marketplace |
| `supabase/functions/_shared/knowledge/index.ts` | `buildKnowledge()` assembler |
| `supabase/functions/_shared/knowledge/category-guides.ts` | Regras por categoria |
| `src/components/create/StepPrompts.tsx` | UI de geração e aprovação de prompts |
| `src/components/create/PromptCardItem.tsx` | Card individual do prompt + geração de imagem |
| `src/context/CreateListingContext.tsx` | `ListingData`, `PromptCard`, Visual DNA |
| `src/lib/overlayTemplates.ts` | IMAGE_ROLES e templates de overlay |
