import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { photoUrls } = await req.json();
    if (!Array.isArray(photoUrls) || photoUrls.length === 0 || photoUrls.length > 4) {
      return new Response(JSON.stringify({ error: "Envie de 1 a 4 fotos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    for (const url of photoUrls) {
      if (typeof url !== "string" || (!url.startsWith("data:image/") && !url.startsWith("https://"))) {
        return new Response(JSON.stringify({ error: "Formato de foto inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
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
    let result = null;
    if (toolCall) {
      try { result = JSON.parse(toolCall.function.arguments); } catch { throw new Error("Resposta da IA inválida"); }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
