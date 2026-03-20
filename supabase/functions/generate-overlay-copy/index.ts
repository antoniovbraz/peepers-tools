import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, sanitizeForLLM, sanitizeArrayForLLM, LLM_SAFETY_INSTRUCTION, createRequestLogger } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;
    const log = createRequestLogger("generate-overlay-copy", (auth as { userId: string }).userId);

    const { productName, characteristics, imageRole, imageIndex, previousCopies, targetElements } = await req.json();
    log.info("start", { imageIndex, targetElements, hasPrevious: !!previousCopies?.length });

    if (!productName || typeof productName !== "string") {
      return errorResponse("Nome do produto inválido", 400, cors);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const roleDescriptions: Record<string, string> = {
      benefits: "Image showing product benefits — needs a compelling headline and 3-5 short bullet points highlighting key benefits",
      features: "Image showing product features — needs 3-5 short feature labels (1-3 words each) for badge overlays",
      closeup: "Close-up detail image — needs 1-2 short labels pointing to specific details",
      lifestyle: "Lifestyle/usage context image — needs one short aspirational tagline",
      portability: "Size/portability image — needs one short phrase about size/portability",
      inbox: "What's included image — needs a header and labels for each included item",
    };

    const roleDesc = roleDescriptions[imageRole] || "Product image that needs marketing text";

    // Build anti-repetition context
    const previousContext = Array.isArray(previousCopies) && previousCopies.length > 0
      ? `\n\nALREADY USED (do NOT repeat, paraphrase, or use similar angles):\n${previousCopies.map((c: string) => `- ${c}`).join("\n")}`
      : "";

    // Build target elements instruction
    const targetInstruction = Array.isArray(targetElements) && targetElements.length > 0
      ? `\nOnly generate copy for these element types: ${targetElements.join(", ")}. Leave other fields empty or omit them.`
      : "";

    const systemPrompt = `${LLM_SAFETY_INSTRUCTION}\n\nYou are a high-conversion e-commerce copywriter specializing in Brazilian Portuguese marketplace listings (Mercado Livre, Shopee, Amazon).

Generate short, punchy, benefit-driven marketing copy for a product image overlay.

Rules:
- ALL text must be in Brazilian Portuguese
- Headlines: max 5 words, bold benefit-driven
- Bullets/labels: max 8 words each, clear and simple
- Use action words and emotional triggers
- Focus on what the customer GAINS, not technical specs
- Use ✓ prefix for bullet items
- CRITICAL: Each image MUST highlight a COMPLETELY DIFFERENT angle/benefit. NEVER repeat or paraphrase headlines or bullets from other images.
- If previous copies exist, find a FRESH angle not yet covered.${targetInstruction}`;

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
          {
            role: "user",
            content: `Produto: ${sanitizeForLLM(productName, 300)}\nCaracterísticas: ${sanitizeArrayForLLM(characteristics || [], 10, 200)}\n\nTipo de imagem (#${imageIndex}): ${roleDesc}${previousContext}\n\nGere o copy de marketing para este overlay.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_copy",
              description: "Retorna o copy de marketing para o overlay da imagem",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "Headline principal (max 5 palavras)" },
                  subheadline: { type: "string", description: "Subheadline de suporte (max 10 palavras)" },
                  bullets: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de bullets/labels (max 5 itens, max 8 palavras cada)",
                  },
                },
                required: ["headline", "bullets"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_copy" } },
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
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new Error("Resposta da IA inválida");
      }
    }

    log.info("done", { hasResult: !!result });
    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-overlay-copy error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors);
  }
});
