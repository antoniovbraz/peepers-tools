import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, sanitizeForLLM, sanitizeArrayForLLM, LLM_SAFETY_INSTRUCTION, createRequestLogger, callAI, parseToolCallResult, checkRateLimit } from "../_shared/helpers.ts";
import { buildKnowledge, type Marketplace } from "../_shared/knowledge/index.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;
    const { userId } = auth as { userId: string };
    const rateLimited = await checkRateLimit(userId, "generate-ads", cors);
    if (rateLimited) return rateLimited;
    const log = createRequestLogger("generate-ads", userId);
    log.info("start");

    const { productName, category, suggested_category, characteristics, extras, marketplace, includeBrand } = await req.json();
    if (!productName || typeof productName !== "string" || productName.length > 500) {
      return errorResponse("Nome do produto inválido", 400, cors, "VALIDATION_ERROR");
    }
    if (category && (typeof category !== "string" || category.length > 200)) {
      return errorResponse("Categoria inválida (máx 200 caracteres)", 400, cors, "VALIDATION_ERROR");
    }
    const targetMarketplace: Marketplace = (["mercadoLivre", "shopee", "amazon", "magalu", "all"].includes(marketplace))
      ? marketplace as Marketplace
      : "all";
    const brandEnabled = includeBrand === true;

    const knowledge = buildKnowledge({
      functionName: "ads",
      marketplace: targetMarketplace,
      category: suggested_category || category || "",
      includeBrand: brandEnabled,
    });

    const productInfo = `Produto: ${sanitizeForLLM(productName, 500)}\nCategoria: ${sanitizeForLLM(category || "", 200)}\nCaracterísticas: ${sanitizeArrayForLLM(characteristics || [], 20, 200)}\nInformações extras: ${sanitizeForLLM(extras || "nenhuma", 1000)}`;

    const response = await callAI({
      userId,
      functionName: "ads",
      requestId: log.requestId,
      messages: [
        {
          role: "system",
          content: `${LLM_SAFETY_INSTRUCTION}\n\n${knowledge}\n\nVocê é um copywriter especialista em marketplaces brasileiros.
Crie títulos e descrições otimizados para os marketplaces solicitados seguindo rigorosamente as regras da base de conhecimento acima.
Responda APENAS em português brasileiro.

REGRA CRÍTICA MERCADO LIVRE: a descrição DEVE ser texto puro. Nunca use HTML, bullets (•), emojis ou negrito (**texto**) na descrição do Mercado Livre. Use MAIÚSCULAS para seções e hifens (-) para listas.`,
        },
        {
          role: "user",
          content: `Crie anúncios para este produto:\n\n${productInfo}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_ads",
            description: "Retorna textos de anúncios para os marketplaces",
            parameters: {
              type: "object",
              properties: {
                mercadoLivre: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título até 60 caracteres" },
                    description: { type: "string", description: "TEXTO PURO OBRIGATÓRIO — sem HTML, sem bullets (•), sem emojis, sem negrito. Use MAIÚSCULAS para seções, hifens (-) para listas e \\n para quebras de linha. Exemplo: 'ESPECIFICAÇÕES\\n- Potência: 65W'" },
                  },
                  required: ["title", "description"],
                  additionalProperties: false,
                },
                shopee: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título até 120 caracteres" },
                    description: { type: "string", description: "Descrição casual com emojis e hashtags" },
                  },
                  required: ["title", "description"],
                  additionalProperties: false,
                },
                amazon: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título até 200 caracteres" },
                    bullets: {
                      type: "array",
                      items: { type: "string" },
                      description: "5 bullet points começando com benefício em maiúsculas",
                    },
                    description: { type: "string", description: "Descrição informativa e completa" },
                    backend_search_terms: { type: "string", description: "Termos de busca para backend Amazon (250 chars, sem vírgula)" },
                  },
                  required: ["title", "bullets", "description"],
                  additionalProperties: false,
                },
                magalu: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título até 150 caracteres" },
                    description: { type: "string", description: "Descrição clara e acessível com tabela de especificações" },
                  },
                  required: ["title", "description"],
                  additionalProperties: false,
                },
              },
              required: ["mercadoLivre", "shopee"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_ads" } },
    });

    if (!response.ok) {
      const t = await response.text();
      return handleAIError(response.status, t, cors);
    }

    const data = await response.json();
    const parsed = parseToolCallResult(data, cors);
    if (parsed instanceof Response) return parsed;

    return new Response(JSON.stringify(parsed.result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ads error:", e);
    if (e instanceof Error && e.message.startsWith("API_KEY_MISSING:")) {
      const provider = e.message.split(":")[1];
      return errorResponse(`Configure sua chave de API do ${provider} em Configurações`, 403, cors, "API_KEY_MISSING");
    }
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors, "INTERNAL_ERROR");
  }
});
