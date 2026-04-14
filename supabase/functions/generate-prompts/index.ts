import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, sanitizeForLLM, sanitizeArrayForLLM, LLM_SAFETY_INSTRUCTION, createRequestLogger, callAI, parseToolCallResult, checkRateLimit } from "../_shared/helpers.ts";
import { buildKnowledge } from "../_shared/knowledge/index.ts";

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
    log.info("start");

    const { productName, category, suggested_category, characteristics, extras, adTitle, marketplace } = await req.json();
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

    const productInfo = `Produto: ${sanitizeForLLM(productName, 500)}\nCategoria: ${sanitizeForLLM(category || "", 200)}\nCaracterísticas: ${sanitizeArrayForLLM(characteristics || [], 20, 200)}\nExtras: ${sanitizeForLLM(extras || "nenhuma", 1000)}\nTítulo do anúncio: ${sanitizeForLLM(adTitle || productName, 200)}`;

    const imageKnowledge = buildKnowledge({
      functionName: "prompts",
      marketplace: (["mercadoLivre", "shopee", "amazon", "magalu"].includes(marketplace)) ? marketplace : "mercadoLivre",
      category: suggested_category || category || "",
    });

    const systemPrompt = `${LLM_SAFETY_INSTRUCTION}\n\n${imageKnowledge}\n\nYou are an expert e-commerce product photographer, prompt engineer, and visual campaign director.

You must generate EXACTLY 7 image prompts in ENGLISH for the product described below, PLUS a "visualDNA" object that defines the shared art direction for the entire campaign.

═══════════════════════════════════════
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

═══════════════════════════════════════
IMAGE ROLES
═══════════════════════════════════════

Each of the 7 images has a specific role. The prompt for each must be a CLEAN image prompt (NO text overlays, NO typography, NO arrows or graphics — those will be added programmatically later).

#1 — COVER (Hero / Marketplace main image)
- Clean white background, product centered, no text, no effects
- 3/4 angle, slightly elevated, 85mm lens compression
- Soft studio key light, rim light for separation

#2 — BENEFITS (will receive text overlay later)
- Product prominently displayed with generous negative space on the LEFT side for text placement
- Same lighting and background as campaign DNA
- Leave ~40% of frame as clean space for headline + bullets overlay

#3 — FEATURES (will receive icons overlay later)
- Product at slight angle showing key feature areas
- Even lighting revealing all details
- Generous margins around product for icon placement

#4 — CLOSE-UP DETAIL
- Macro/close-up of the most interesting product detail
- Directional cross-lighting to reveal texture
- Shallow depth of field, tight crop

#5 — LIFESTYLE / USAGE CONTEXT
- Product in realistic usage environment
- Natural/ambient lighting, contextual props
- Rule of thirds, product as focal point

#6 — PORTABILITY / SCALE
- Product next to familiar reference object (hand, coin, phone)
- Clean background, even lighting
- Both objects clearly visible for size comparison

#7 — IN-BOX / WHAT'S INCLUDED
- Flat lay or 45° angle showing all included items
- Clean surface, soft overhead lighting
- Organized layout with product centered

CRITICAL: The AI that will generate images will ALSO receive real reference photos of the product. Fidelity and realism rules will be injected at image generation time — do NOT repeat them in the prompts.

Each prompt must focus on SCENE DIRECTION with ALL of these sub-sections:
- Camera: angle, lens equivalent, perspective, distance
- Lighting: must be CONSISTENT with the visualDNA lighting
- Background: must be CONSISTENT with the visualDNA background
- Composition: product position, negative space, framing

Each prompt should be 80-150 words of pure scene direction. Do NOT include fidelity rules, realism rules, or output format instructions — those are handled separately. Do NOT use vague instructions.`;

    const response = await callAI({
      userId,
      functionName: "prompts",
      requestId: log.requestId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Crie o Visual DNA e 7 prompts de imagem para este produto. Para cada prompt, inclua também um resumo curto em português brasileiro (summary_ptbr) descrevendo a cena para o vendedor:\n\n${productInfo}` },
      ],
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
