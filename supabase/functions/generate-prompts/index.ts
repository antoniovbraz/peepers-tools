import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, sanitizeForLLM, sanitizeArrayForLLM, LLM_SAFETY_INSTRUCTION, createRequestLogger } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;
    const log = createRequestLogger("generate-prompts", (auth as { userId: string }).userId);
    log.info("start");

    const { productName, category, characteristics, extras, adTitle } = await req.json();
    if (!productName || typeof productName !== "string" || productName.length > 500) {
      return errorResponse("Nome do produto inválido", 400, cors);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const productInfo = `Produto: ${sanitizeForLLM(productName, 500)}\nCategoria: ${sanitizeForLLM(category || "", 200)}\nCaracterísticas: ${sanitizeArrayForLLM(characteristics || [], 20, 200)}\nExtras: ${sanitizeForLLM(extras || "nenhuma", 1000)}\nTítulo do anúncio: ${sanitizeForLLM(adTitle || productName, 200)}`;

    const systemPrompt = `${LLM_SAFETY_INSTRUCTION}\n\nYou are an expert e-commerce product photographer, prompt engineer, and visual campaign director.

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

CRITICAL: The AI that will generate images will ALSO receive real reference photos of the product. Every prompt must assume reference photos are available and instruct strict fidelity to them.

EVERY prompt MUST contain these 3 MANDATORY BLOCKS in this exact order:

BLOCK 1 — FIDELITY (mandatory in ALL 7 prompts)
Every prompt must START with:

"Using the EXACT product from the reference photos.

FIDELITY RULES:
- Preserve exact shape, proportions, dimensions, and structure
- Do not change: materials, colors, textures, button placement, ports, logos, branding, text, labels
- Maintain all physical characteristics exactly as shown in the reference
- Do not add, remove, or modify any product feature"

BLOCK 2 — REALISM (mandatory in ALL 7 prompts)
Every prompt must include:

"REALISM RULES:
- Make the product look like a real photographed object, NOT a 3D render or CGI
- Use realistic reflections based on actual material (metal, plastic, glass, fabric, leather, etc.)
- Accurate shadows with natural light falloff
- Subtle micro imperfections for photorealism (minor surface variations, realistic edge quality)
- AVOID: plastic look, over-smoothing, fake edges, CGI sheen, unrealistic specular highlights"

BLOCK 3 — SCENE DIRECTION (specific per image type)
Each prompt must have detailed, specific scene direction with ALL of these sub-sections:
- Camera: angle, lens equivalent, perspective, distance
- Lighting: must be CONSISTENT with the visualDNA lighting
- Background: must be CONSISTENT with the visualDNA background
- Composition: product position, negative space, framing

FINAL LINE (mandatory in ALL 7 prompts)
Every prompt must END with:
"Output: ultra high resolution, professional product photography, e-commerce ready, no text overlays, no watermarks, no arrows, no graphics, no typography. Clean product image only. Ensure the product looks identical to the reference image and not reinterpreted."

Each prompt should be 150-250 words, highly detailed and specific. Do NOT use vague instructions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crie o Visual DNA e 7 prompts de imagem para este produto:\n\n${productInfo}` },
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
                    items: { type: "string" },
                    description: "Lista de 7 prompts em inglês, cada um com os 3 blocos obrigatórios",
                  },
                },
                required: ["visualDNA", "prompts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_campaign" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      return handleAIError(response.status, t, cors);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result = null;
    if (toolCall) {
      try { result = JSON.parse(toolCall.function.arguments); } catch { throw new Error("Resposta da IA inválida"); }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompts error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors);
  }
});
