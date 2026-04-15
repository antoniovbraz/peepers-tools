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
    const rateLimited = await checkRateLimit(userId, "generate-overlay-copy", cors);
    if (rateLimited) return rateLimited;
    const log = createRequestLogger("generate-overlay-copy", userId);

    const { productName, characteristics, imageRole, imageIndex, previousCopies, targetElements, category, suggested_category, marketplace } = await req.json();
    log.info("start", { imageIndex, targetElements, hasPrevious: !!previousCopies?.length });

    if (!productName || typeof productName !== "string" || productName.length > 500) {
      return errorResponse("Nome do produto inválido", 400, cors);
    }
    if (imageIndex !== undefined && (typeof imageIndex !== "number" || imageIndex < 0 || imageIndex > 6)) {
      return errorResponse("imageIndex inválido", 400, cors);
    }
    if (previousCopies !== undefined && previousCopies !== null) {
      if (!Array.isArray(previousCopies) || previousCopies.length > 50) {
        return errorResponse("previousCopies inválido (max 50 itens)", 400, cors);
      }
    }
    if (targetElements !== undefined && targetElements !== null) {
      if (!Array.isArray(targetElements) || targetElements.length > 10) {
        return errorResponse("targetElements inválido (max 10 itens)", 400, cors);
      }
      if (!targetElements.every((e: unknown) => typeof e === "string" && e.length <= 50)) {
        return errorResponse("Cada targetElement deve ser texto de até 50 caracteres", 400, cors);
      }
    }



    const roleDescriptions: Record<string, string> = {
      benefits: "Image showing product benefits — needs a compelling headline and 3-5 short bullet points highlighting key benefits",
      features: "Image showing product features — needs 3-5 short feature labels (1-3 words each) for badge overlays",
      closeup: "Close-up detail image — needs 1-2 short labels pointing to specific details",
      lifestyle: "Lifestyle/usage context image — needs one short aspirational tagline",
      portability: "Size/portability image — needs one short phrase about size/portability",
      inbox: "What's included image — needs a header and labels for each included item",
    };

    const roleDesc = roleDescriptions[imageRole] || "Product image that needs marketing text";

    const previousContext = Array.isArray(previousCopies) && previousCopies.length > 0
      ? `\n\nALREADY USED (do NOT repeat, paraphrase, or use similar angles):\n${(previousCopies as string[]).slice(0, 10).map((c) => `- ${sanitizeForLLM(String(c), 60).split(/\s+/).slice(0, 5).join(" ")}`).join("\n")}`
      : "";

    const targetInstruction = Array.isArray(targetElements) && targetElements.length > 0
      ? `\nOnly generate copy for these element types: ${targetElements.join(", ")}. Leave other fields empty or omit them.`
      : "";

    const knowledge = buildKnowledge({
      functionName: "overlay_copy",
      marketplace: (["mercadoLivre", "shopee", "amazon", "magalu"].includes(marketplace)) ? marketplace : "all",
      category: suggested_category || category || "",
    });

    const systemPrompt = `${LLM_SAFETY_INSTRUCTION}\n\n${knowledge}\n\nYou are a high-conversion e-commerce copywriter specializing in Brazilian Portuguese marketplace listings (Mercado Livre, Shopee, Amazon).

Generate short, punchy, benefit-driven marketing copy for a product image overlay following the rules in the knowledge base above.

Additional rules:
- ALL text must be in Brazilian Portuguese
- Focus on what the customer GAINS, not technical specs
- Use ✓ prefix for bullet items
- CRITICAL: Each image MUST highlight a COMPLETELY DIFFERENT angle/benefit. NEVER repeat or paraphrase headlines or bullets from other images.
- If previous copies exist, find a FRESH angle not yet covered.${targetInstruction}`;

    const response = await callAI({
      userId,
      functionName: "overlay_copy",
      requestId: log.requestId,
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
                badges: {
                  type: "array",
                  items: { type: "string" },
                  description: "Labels curtos para badges (max 5 itens, max 3 palavras cada)",
                },
              },
              required: ["headline", "bullets", "badges"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_copy" } },
      maxOutputTokens: 300,
    });

    if (!response.ok) {
      const t = await response.text();
      return handleAIError(response.status, t, cors);
    }

    const data = await response.json();
    const parsed = parseToolCallResult(data, cors);
    if (parsed instanceof Response) return parsed;

    log.info("done", { hasResult: true });
    return new Response(JSON.stringify(parsed.result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-overlay-copy error:", e);
    if (e instanceof Error && e.message.startsWith("API_KEY_MISSING:")) {
      const provider = e.message.split(":")[1];
      return errorResponse(`Configure sua chave de API do ${provider} em Configurações`, 403, cors, "API_KEY_MISSING");
    }
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors, "INTERNAL_ERROR");
  }
});
