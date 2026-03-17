import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, category, characteristics, extras, adTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const productInfo = `Produto: ${productName}\nCategoria: ${category}\nCaracterísticas: ${(characteristics || []).join(", ")}\nExtras: ${extras || "nenhuma"}\nTítulo do anúncio: ${adTitle || productName}`;

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
Crie exatamente 7 prompts em INGLÊS para gerar imagens profissionais do produto usando IA (como Midjourney ou DALL-E).
Cada prompt deve ser detalhado, incluindo:
- Estilo de fotografia (flat lay, lifestyle, close-up, etc)
- Iluminação
- Composição e props
- Qualidade (4K, professional product photography)
Os 7 prompts devem cobrir diferentes ângulos e estilos para um anúncio completo.`,
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
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
