import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;

    const { productName, category, characteristics, extras, adTitle } = await req.json();
    if (!productName || typeof productName !== "string" || productName.length > 500) {
      return errorResponse("Nome do produto inválido", 400, cors);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const productInfo = `Produto: ${productName.slice(0, 500)}\nCategoria: ${(category || "").slice(0, 200)}\nCaracterísticas: ${(characteristics || []).slice(0, 20).join(", ").slice(0, 1000)}\nExtras: ${(extras || "nenhuma").slice(0, 1000)}\nTítulo do anúncio: ${(adTitle || productName).slice(0, 200)}`;

    const systemPrompt = `You are an expert e-commerce product photographer and prompt engineer.

You must generate EXACTLY 7 image prompts in ENGLISH for the product described below.

CRITICAL: The AI that will generate images will ALSO receive real reference photos of the product. Every prompt must assume reference photos are available and instruct strict fidelity to them.

EVERY prompt MUST contain these 3 MANDATORY BLOCKS in this exact order:

═══════════════════════════════════════
BLOCK 1 — FIDELITY (mandatory in ALL 7 prompts)
═══════════════════════════════════════
Every prompt must START with:

"Using the EXACT product from the reference photos.

FIDELITY RULES:
- Preserve exact shape, proportions, dimensions, and structure
- Do not change: materials, colors, textures, button placement, ports, logos, branding, text, labels
- Maintain all physical characteristics exactly as shown in the reference
- Do not add, remove, or modify any product feature"

═══════════════════════════════════════
BLOCK 2 — REALISM (mandatory in ALL 7 prompts)
═══════════════════════════════════════
Every prompt must include:

"REALISM RULES:
- Make the product look like a real photographed object, NOT a 3D render or CGI
- Use realistic reflections based on actual material (metal, plastic, glass, fabric, leather, etc.)
- Accurate shadows with natural light falloff
- Subtle micro imperfections for photorealism (minor surface variations, realistic edge quality)
- AVOID: plastic look, over-smoothing, fake edges, CGI sheen, unrealistic specular highlights"

═══════════════════════════════════════
BLOCK 3 — SCENE DIRECTION (specific per image type)
═══════════════════════════════════════
Each prompt must have detailed, specific scene direction with ALL of these sub-sections:
- Camera: angle, lens equivalent, perspective, distance
- Lighting: key light position, fill light, rim/edge light, shadow quality
- Background: specific color/environment, gradients
- Composition: product position, negative space, framing
- Props (if applicable): specific contextual objects

═══════════════════════════════════════
FINAL LINE (mandatory in ALL 7 prompts)
═══════════════════════════════════════
Every prompt must END with:
"Output: ultra high resolution, professional product photography, e-commerce ready, no text overlays, no watermarks. Ensure the product looks identical to the reference image and not reinterpreted."

═══════════════════════════════════════
THE 7 IMAGE TYPES (in this exact order)
═══════════════════════════════════════

#1 — HERO (Marketplace Cover)
Purpose: Main listing image for Mercado Livre / Shopee / Amazon
Scene direction:
- Camera: 3/4 angle, slightly elevated perspective, 85mm lens style compression
- Lighting: soft studio key light from upper-left, subtle rim light on edges for separation, soft diffused shadow under product
- Background: pure white (#FFFFFF), slight warm gradient near base for grounding
- Composition: product centered, floating slightly above surface, dominant in frame, balanced negative space on all sides

#2 — LIFESTYLE
Purpose: Product naturally placed in a real-life environment matching its category
Scene direction:
- Camera: 35-50mm natural perspective, eye-level or slightly above
- Lighting: natural window light or warm ambient lighting, soft shadows
- Background: contextual environment (desk, kitchen, bedroom, etc. — choose based on product category)
- Composition: product as focal point but integrated into scene, rule of thirds, lifestyle props that complement (NOT distract)

#3 — REAL USE
Purpose: Product being used by a person (hands visible or person interacting)
Scene direction:
- Camera: close-medium shot, 50mm lens, natural angle showing interaction
- Lighting: natural/ambient lighting matching usage context
- Background: blurred real environment (shallow depth of field, f/2.8 look)
- Composition: hands/person partially visible, product clearly identifiable, action moment captured

#4 — TECHNICAL CLOSE-UP
Purpose: Show material quality, texture, craftsmanship, ports, buttons, details
Scene direction:
- Camera: macro/close-up, 100mm macro lens style, very close to surface
- Lighting: directional light to reveal texture and surface detail, cross-lighting for dimension
- Background: clean, minimal, dark or neutral to contrast product detail
- Composition: tight crop on most interesting detail area, sharp focus on textures, shallow depth of field

#5 — SCALE REFERENCE
Purpose: Show product size relative to familiar everyday objects
Scene direction:
- Camera: straight-on or slight angle, 50mm, clear comparison view
- Lighting: even studio lighting, minimal shadows for clarity
- Background: clean white or light neutral
- Composition: product next to common reference object (hand, coin, pen, smartphone, ruler — choose most appropriate), both objects clearly visible and in focus
- Props: one familiar scale reference object only

#6 — BOX CONTENTS / UNBOXING
Purpose: Show everything included in the package
Scene direction:
- Camera: top-down (flat lay) or 45-degree elevated angle, 35mm wide
- Lighting: soft even overhead lighting, minimal shadows
- Background: clean surface (white, light wood, or neutral)
- Composition: product centered with all accessories and included items arranged neatly around it, organized layout showing complete package contents

#7 — EMOTIONAL CONTEXT
Purpose: Aspirational scene that creates desire and emotional connection
Scene direction:
- Camera: cinematic angle, 35mm wide or 85mm portrait style depending on mood
- Lighting: golden hour, warm tones, dramatic but natural lighting with lens flare or bokeh
- Background: aspirational environment that evokes the lifestyle the product enables
- Composition: product visible but scene tells a story, mood-driven, premium feel, could be used as a social media hero image

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
          { role: "user", content: `Crie 7 prompts de imagem para este produto:\n\n${productInfo}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_prompts",
              description: "Retorna 7 prompts de imagem estruturados para o produto",
              parameters: {
                type: "object",
                properties: {
                  prompts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de 7 prompts em inglês, cada um com os 3 blocos obrigatórios",
                  },
                },
                required: ["prompts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_prompts" } },
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
