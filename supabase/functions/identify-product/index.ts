import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, LLM_SAFETY_INSTRUCTION } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;

    const { photoUrls } = await req.json();
    if (!Array.isArray(photoUrls) || photoUrls.length === 0 || photoUrls.length > 4) {
      return errorResponse("Envie de 1 a 4 fotos", 400, cors);
    }
    for (const url of photoUrls) {
      if (typeof url !== "string" || (!url.startsWith("data:image/") && !url.startsWith("https://"))) {
        return errorResponse("Formato de foto inválido", 400, cors);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const imageContent = photoUrls.slice(0, 4).map((url: string) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

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
            content: `Você é um especialista em identificação de produtos para e-commerce brasileiro.
Analise as fotos do produto e retorne informações detalhadas.
Responda APENAS em português brasileiro.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identifique este produto com base nas fotos. Retorne: nome do produto, categoria, e uma lista de características principais." },
              ...imageContent,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_product",
              description: "Retorna a identificação do produto",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nome do produto" },
                  category: { type: "string", description: "Categoria do produto (ex: Papelaria, Eletrônicos)" },
                  characteristics: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de características do produto",
                  },
                },
                required: ["name", "category", "characteristics"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_product" } },
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
    console.error("identify-product error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors);
  }
});
