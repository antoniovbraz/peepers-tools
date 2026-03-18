import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "";

  const isAllowed =
    (allowedOrigin && origin === allowedOrigin) ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : (allowedOrigin || "*"),
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
  };
}

export function errorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function authenticate(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401, corsHeaders);
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseClient.auth.getClaims(token);

  if (error || !data?.claims) {
    return errorResponse("Unauthorized", 401, corsHeaders);
  }

  return { userId: data.claims.sub as string };
}

export function handleAIError(
  status: number,
  body: string,
  corsHeaders: Record<string, string>
): Response {
  if (status === 429) {
    return errorResponse("Rate limit exceeded. Tente novamente em alguns segundos.", 429, corsHeaders);
  }
  if (status === 402) {
    return errorResponse("Créditos de IA insuficientes.", 402, corsHeaders);
  }
  console.error("AI error:", status, body);
  throw new Error(`AI gateway error: ${status}`);
}
