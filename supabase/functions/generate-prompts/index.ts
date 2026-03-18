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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em fotografia de produtos e-commerce.
Crie exatamente 7 prompts em INGLÊS para gerar imagens profissionais do produto usando IA.

IMPORTANTE: As fotos reais do produto serão fornecidas à IA junto com cada prompt. Portanto, cada prompt deve INSTRUIR a IA a manter fidelidade total ao produto real mostrado nas fotos de referência.

REGRA OBRIGATÓRIA para o Prompt #1:
O primeiro prompt DEVE ser uma foto comercial premium para marketplaces com fundo branco puro. Siga este estilo:
- "Create a premium commercial photo of the EXACT product shown in the reference images: perfectly upright, three-quarter angle, fully visible, floating slightly above a pure white background. Preserve the exact colors, shape, logos, text, and branding from the reference photos. Composite studio lighting (soft fill + directional highlights), HDR tonal separation, flawless edges. Full depth of field on product. Clean, premium, retouched realism."

Prompts #2 a #7: devem cobrir diferentes estilos variados:
- Flat lay, lifestyle em uso, close-up de detalhes, escala com objetos de referência, embalagem, cena contextual
- CADA prompt deve começar com "Using the EXACT product from the reference photos," seguido do estilo desejado
- Cada prompt deve ser detalhado com estilo de fotografia, iluminação, composição, props e qualidade (4K, professional product photography)
- Cada prompt deve incluir: "Maintain exact product appearance, colors, shape, logos and branding as shown in the reference images."`,
          },
          {
            role: "user",
            content: `Crie 7 prompts de imagem para este produto:\n\n${productInfo}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_prompts",
              description: "Retorna 7 prompts de imagem para o produto",
              parameters: {
                type: "object",
                properties: {
                  prompts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de 7 prompts em inglês",
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
