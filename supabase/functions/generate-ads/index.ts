import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;

    const { productName, category, characteristics, extras } = await req.json();
    if (!productName || typeof productName !== "string" || productName.length > 500) {
      return errorResponse("Nome do produto inválido", 400, cors);
    }
    if (category && typeof category !== "string") {
      return errorResponse("Categoria inválida", 400, cors);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const productInfo = `Produto: ${productName.slice(0, 500)}\nCategoria: ${(category || "").slice(0, 200)}\nCaracterísticas: ${(characteristics || []).slice(0, 20).join(", ").slice(0, 1000)}\nInformações extras: ${(extras || "nenhuma").slice(0, 1000)}`;

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
            content: `Você é um copywriter especialista em marketplaces brasileiros.
Crie títulos e descrições otimizados para Mercado Livre e Shopee.
- Mercado Livre: título até 60 caracteres, descrição detalhada e profissional
- Shopee: título até 120 caracteres com palavras-chave, descrição mais casual e com emojis
Responda APENAS em português brasileiro.`,
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
              description: "Retorna textos de anúncios para Mercado Livre e Shopee",
              parameters: {
                type: "object",
                properties: {
                  mercadoLivre: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["title", "description"],
                    additionalProperties: false,
                  },
                  shopee: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
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
    console.error("generate-ads error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors);
  }
});
