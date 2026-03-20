import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, handleAIError } from "../_shared/helpers.ts";

const SYSTEM_PROMPT = `Você é um copywriter sênior especialista em marketplaces brasileiros. Sua missão é criar anúncios que VENDEM, usando técnicas avançadas de persuasão e SEO específicas de cada plataforma.

═══════════════════════════════════════
MERCADO LIVRE — REGRAS OFICIAIS
═══════════════════════════════════════

TÍTULO (máx 60 caracteres):
- Fórmula: Produto + Palavra-chave de cauda longa
- NÃO incluir marca ou modelo (vendedores brasileiros são importadores/multifornecedores)
- Palavra-chave principal SEMPRE no início
- Sem símbolos excessivos, sem caps lock total
- Exemplo: "Fone Bluetooth Com Cancelamento de Ruído Sem Fio"

DESCRIÇÃO — Framework AIDA:
1. ATENÇÃO (1ª linha): Gancho emocional focado no benefício principal. Pergunta retórica ou afirmação impactante.
2. INTERESSE (bullets): 4-6 benefícios práticos reais que o comprador vai experimentar. Transforme especificações em benefícios ("Bateria de 5000mAh" → "Até 2 dias sem precisar carregar").
3. DESEJO: Cenário de uso — pinte a situação real onde o produto resolve o problema. Use linguagem sensorial.
4. AÇÃO: CTA com urgência leve + benefício extra ("Compre agora e receba com frete grátis via Full").

Regras da descrição ML:
- Parágrafos curtos (2-3 linhas máx)
- Linguagem direta, sem enrolação
- Gatilhos de confiança: garantia, nota fiscal, envio rápido, estoque disponível
- Retire objeções comuns: "Compatível com...", "Serve para...", "Inclui manual em português"
- NUNCA usar superlativos vazios ("o melhor do mercado")
- Use dados concretos sempre que possível

═══════════════════════════════════════
SHOPEE — REGRAS DO SELLER CENTER
═══════════════════════════════════════

TÍTULO (máx 120 caracteres):
- Fórmula: Produto + Keyword principal + Diferencial técnico + Variação (cor/tamanho se aplicável)
- NÃO usar termos apelativos: "O Melhor", "Promoção", "Oferta", "Barato" — algoritmo PENALIZA
- NÃO incluir marca (mesmo motivo do ML)
- Palavras-chave de intenção de compra
- Exemplo: "Fone Bluetooth Cancelamento Ruído Ativo 40h Bateria Dobrável Preto"

DESCRIÇÃO:
- Tom casual e amigável (Shopee é mais jovem e informal)
- Emojis estratégicos: máx 1 por seção, só nos relevantes (✅ ⚡ 📦 🎯). Sem exagero.
- Estrutura:
  ✅ O que é / Para que serve (1-2 linhas)
  ⚡ Diferenciais (3-5 bullets com benefícios práticos)
  📦 O que vem na caixa (lista do conteúdo)
  🎯 Especificações técnicas (dados objetivos)
- CTA direto: "Adicione ao carrinho" ou "Aproveite o frete grátis"
- Retire objeções: compatibilidade, garantia, material

═══════════════════════════════════════
TAGS DE PALAVRAS-CHAVE (ambos)
═══════════════════════════════════════
- Gere 5-8 tags de busca relevantes para cada marketplace
- Inclua sinônimos, variações de cauda longa, termos coloquiais que compradores usam
- Priorize palavras com intenção de compra, não informacional
- Tags do ML podem diferir das da Shopee (públicos diferentes)

═══════════════════════════════════════
REGRAS GERAIS
═══════════════════════════════════════
- SEMPRE em português brasileiro natural
- Foco em BENEFÍCIOS, não características brutas
- Cada frase deve ter um propósito — corte o desnecessário
- Adapte o tom: ML é mais profissional, Shopee é mais casual
- Use as informações do produto fornecidas, não invente especificações`;

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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Crie anúncios otimizados para este produto:\n\n${productInfo}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_ads",
              description: "Retorna textos de anúncios para Mercado Livre e Shopee com tags de SEO",
              parameters: {
                type: "object",
                properties: {
                  mercadoLivre: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Título até 60 chars: Produto + Palavra-chave de cauda longa" },
                      description: { type: "string", description: "Descrição com framework AIDA" },
                      tags: { type: "array", items: { type: "string" }, description: "5-8 tags de palavras-chave para SEO" },
                    },
                    required: ["title", "description", "tags"],
                    additionalProperties: false,
                  },
                  shopee: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Título até 120 chars: Produto + Keyword + Diferencial + Variação" },
                      description: { type: "string", description: "Descrição casual com emojis estratégicos" },
                      tags: { type: "array", items: { type: "string" }, description: "5-8 tags de palavras-chave para SEO" },
                    },
                    required: ["title", "description", "tags"],
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
