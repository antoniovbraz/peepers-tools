import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, sanitizeForLLM, sanitizeArrayForLLM, LLM_SAFETY_INSTRUCTION, createRequestLogger, callAI, parseToolCallResult, checkRateLimit } from "../_shared/helpers.ts";
import { buildKnowledge } from "../_shared/knowledge/index.ts";
import { PROMPT_RULES_VERSION } from "../_shared/prompt-rules.ts";
import { IMAGE_ROLES_VERSION } from "../_shared/knowledge/image-roles.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;
    const { userId } = auth as { userId: string };
    const rateLimited = await checkRateLimit(userId, "generate-prompts", cors);
    if (rateLimited) return rateLimited;
    const log = createRequestLogger("generate-prompts", userId);
    log.info("start", { promptRulesVersion: PROMPT_RULES_VERSION, imageRolesVersion: IMAGE_ROLES_VERSION });

    const { productName, category, suggested_category, characteristics, extras, adTitle, marketplace, referencePhotos } = await req.json();
    if (!productName || typeof productName !== "string" || productName.length > 500) {
      return errorResponse("Nome do produto inválido", 400, cors, "VALIDATION_ERROR");
    }
    if (characteristics !== undefined && characteristics !== null) {
      if (!Array.isArray(characteristics) || characteristics.length > 50) {
        return errorResponse("Características inválidas (max 50 itens)", 400, cors, "VALIDATION_ERROR");
      }
      if (!characteristics.every((c: unknown) => typeof c === "string" && c.length <= 500)) {
        return errorResponse("Cada característica deve ser texto de até 500 caracteres", 400, cors, "VALIDATION_ERROR");
      }
    }
    if (adTitle && (typeof adTitle !== "string" || adTitle.length > 500)) {
      return errorResponse("Título do anúncio inválido (máx 500 caracteres)", 400, cors, "VALIDATION_ERROR");
    }
    if (category && (typeof category !== "string" || category.length > 200)) {
      return errorResponse("Categoria inválida (máx 200 caracteres)", 400, cors, "VALIDATION_ERROR");
    }
    if (characteristics && characteristics.length > 20) {
      log.warn("characteristics clipped", { original: characteristics.length, clipped: 20 });
    }

    // Validate reference photos (capped per-provider by callAI)
    const validatedPhotos: string[] = [];
    if (referencePhotos !== undefined && referencePhotos !== null) {
      if (!Array.isArray(referencePhotos) || referencePhotos.length > 10) {
        return errorResponse("Fotos de referência inválidas (max 10)", 400, cors, "VALIDATION_ERROR");
      }
      for (const url of referencePhotos) {
        if (typeof url !== "string" || (!url.startsWith("https://") && !url.startsWith("data:image/"))) {
          return errorResponse("Formato de foto de referência inválido", 400, cors, "VALIDATION_ERROR");
        }
        validatedPhotos.push(url);
      }
    }
    log.info("photos", { count: validatedPhotos.length });

    const productInfo = `Produto: ${sanitizeForLLM(productName, 500)}\nCategoria: ${sanitizeForLLM(category || "", 200)}\nCaracterísticas: ${sanitizeArrayForLLM(characteristics || [], 20, 200)}\nExtras: ${sanitizeForLLM(extras || "nenhuma", 1000)}\nTítulo do anúncio: ${sanitizeForLLM(adTitle || productName, 200)}`;

    const imageKnowledge = buildKnowledge({
      functionName: "prompts",
      marketplace: (["mercadoLivre", "shopee", "amazon", "magalu"].includes(marketplace)) ? marketplace : "mercadoLivre",
      category: suggested_category || category || "",
    });

    const hasPhotos = validatedPhotos.length > 0;

    const systemPrompt = `${LLM_SAFETY_INSTRUCTION}\n\n${imageKnowledge}\n\nYou are an expert e-commerce product photographer, prompt engineer, and visual campaign director.

You must generate EXACTLY 7 image prompts in ENGLISH for the product described below, PLUS a "visualDNA" object that defines the shared art direction for the entire campaign.

${hasPhotos ? `═══════════════════════════════════════
REFERENCE PHOTOS — PRODUCT ANALYSIS (CRITICAL)
═══════════════════════════════════════
The user has provided reference photos of the ACTUAL product. You MUST:
1. Visually analyse these photos before writing any prompt
2. Extract the product's EXACT visual characteristics: shape, dimensions, color(s), material finish (matte/glossy/brushed), texture, branding, logos, buttons, ports, labels
3. Incorporate these specific visual attributes into EVERY prompt — do NOT invent generic descriptions
4. Ensure the prompts will guide the image generator to reproduce this EXACT product, not a similar one
5. Fill productAppearance fields with what you observe in the photos

` : ""}═══════════════════════════════════════
VISUAL DNA — CAMPAIGN CONSISTENCY
═══════════════════════════════════════

BEFORE writing any prompt, you must define a "visualDNA" object that controls the entire campaign's look and feel. All 7 image prompts MUST inherit from this visual DNA to ensure the images look like they belong to the same product listing page.

The visualDNA must include:
- background: the shared background style (e.g. "soft white to light grey flowing gradient")
- lighting: the shared lighting setup (e.g. "soft studio key light upper-left, subtle rim light on edges, warm fill")
- style: the rendering approach (e.g. "ultra realistic commercial product photography")
- tone: the overall mood (e.g. "premium, clean, minimal")
- accentColor: a suggested accent color for overlays that complements the product (e.g. "warm gold #D4A853")
- headlineColor: a suggested headline text color (e.g. "dark navy #1A2332")
${hasPhotos ? `- productAppearance: precise description of the product's observed visual attributes (color, shape, material finish, key details) extracted from the reference photos` : ""}

Each image PROMPT must embed the product's specific visual characteristics (from the reference photos or from the product info) so that the image generator reproduces the correct product in every scene.

The 7 IMAGE ROLES, their scene requirements, and category-specific photography direction are defined
in the KNOWLEDGE BASE injected above. Follow them exactly — one prompt per role, in order.`;

    // Build the user message — multimodal if reference photos are provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any = hasPhotos
      ? [
          ...(validatedPhotos.map(url => ({ type: "image_url", image_url: { url } }))),
          {
            type: "text",
            text: `Analise as fotos de referência acima e crie o Visual DNA e 7 prompts de imagem para este produto. Cada prompt deve descrever o produto EXATO das fotos (cor, forma, material, detalhes), não uma versão genérica. Para cada prompt, inclua também um resumo curto em português brasileiro (summary_ptbr) descrevendo a cena para o vendedor:\n\n${productInfo}`,
          },
        ]
      : `Crie o Visual DNA e 7 prompts de imagem para este produto. Para cada prompt, inclua também um resumo curto em português brasileiro (summary_ptbr) descrevendo a cena para o vendedor:\n\n${productInfo}`;

    const response = await callAI({
      userId,
      functionName: "prompts",
      requestId: log.requestId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      maxOutputTokens: 3000,
      tools: [
        {
          type: "function",
          function: {
            name: "generate_campaign",
            description: "Retorna o Visual DNA da campanha e 7 prompts de imagem estruturados",
            parameters: {
              type: "object",
              properties: {
                visualDNA: {
                  type: "object",
                  properties: {
                    background: { type: "string", description: "Shared background style for all images" },
                    lighting: { type: "string", description: "Shared lighting setup" },
                    style: { type: "string", description: "Rendering approach" },
                    tone: { type: "string", description: "Overall mood/feel" },
                    accentColor: { type: "string", description: "Accent color hex for overlays (e.g. #D4A853)" },
                    headlineColor: { type: "string", description: "Headline text color hex (e.g. #1A2332)" },
                    productAppearance: { type: "string", description: "Precise description of the product's visual characteristics observed from reference photos (color, shape, material finish, key details). Used to ensure consistent product depiction across all 7 images." },
                  },
                  required: ["background", "lighting", "style", "tone", "accentColor", "headlineColor"],
                },
                prompts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      prompt: { type: "string", description: "Image prompt in English with scene direction" },
                      summary_ptbr: { type: "string", description: "Resumo curto em português brasileiro da cena (1-2 frases, ~30 palavras)" },
                    },
                    required: ["prompt", "summary_ptbr"],
                  },
                  description: "Lista de 7 prompts de imagem, cada um com prompt EN e resumo PT-BR",
                },
              },
              required: ["visualDNA", "prompts"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_campaign" } },
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
    console.error("generate-prompts error:", e);
    if (e instanceof Error && e.message.startsWith("API_KEY_MISSING:")) {
      const provider = e.message.split(":")[1];
      return errorResponse(`Configure sua chave de API do ${provider} em Configurações`, 403, cors, "API_KEY_MISSING");
    }
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors, "INTERNAL_ERROR");
  }
});
