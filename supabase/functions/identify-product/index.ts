import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, LLM_SAFETY_INSTRUCTION, createRequestLogger, callAI, parseToolCallResult, checkRateLimit } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;
    const { userId } = auth as { userId: string };
    const rateLimited = await checkRateLimit(userId, "identify-product", cors);
    if (rateLimited) return rateLimited;
    const log = createRequestLogger("identify-product", userId);
    log.info("start", { photos: 0 });

    const { photoUrls } = await req.json();
    if (!Array.isArray(photoUrls) || photoUrls.length === 0 || photoUrls.length > 4) {
      return errorResponse("Envie de 1 a 4 fotos", 400, cors, "VALIDATION_ERROR");
    }
    for (const url of photoUrls) {
      if (typeof url !== "string" || (!url.startsWith("data:image/") && !url.startsWith("https://"))) {
        return errorResponse("Formato de foto inválido", 400, cors, "VALIDATION_ERROR");
      }
    }

    const imageContent = photoUrls.slice(0, 4).map((url: string) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    const response = await callAI({
      userId,
      functionName: "identify",
      requestId: log.requestId,
      messages: [
        {
          role: "system",
          content: `${LLM_SAFETY_INSTRUCTION}\n\nVocê é um especialista em identificação de produtos para e-commerce brasileiro.
Analise as fotos do produto e retorne informações detalhadas.
Responda APENAS em português brasileiro.
Se visível na embalagem, extraia o código de barras/EAN/GTIN (13 dígitos) e o SKU do fabricante. Se não visíveis, retorne null para esses campos.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identifique este produto com base nas fotos. Retorne: nome do produto, categoria, lista de características principais, e se visível na embalagem, o código EAN/GTIN e o SKU do fabricante." },
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
                ean: {
                  type: ["string", "null"],
                  description: "Código EAN/GTIN de 13 dígitos visível na embalagem. Null se não visível.",
                },
                original_sku: {
                  type: ["string", "null"],
                  description: "SKU ou código do fabricante impresso na embalagem. Null se não visível.",
                },
              },
              required: ["name", "category", "characteristics"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "identify_product" } },
    });

    if (!response.ok) {
      const t = await response.text();
      return handleAIError(response.status, t, cors);
    }

    const data = await response.json();
    const parsed = parseToolCallResult(data, cors);
    if (parsed instanceof Response) return parsed;
    const result = parsed.result;

    log.info("done", { product: (result as any)?.name });
    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-product error:", e);
    if (e instanceof Error && e.message.startsWith("API_KEY_MISSING:")) {
      const provider = e.message.split(":")[1];
      return errorResponse(`Configure sua chave de API do ${provider} em Configurações`, 403, cors, "API_KEY_MISSING");
    }
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors, "INTERNAL_ERROR");
  }
});
