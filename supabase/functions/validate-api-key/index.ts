import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticate, errorResponse, createRequestLogger, fetchWithRetry, checkRateLimit } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, cors);
  }

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;
    const { userId } = auth as { userId: string };
    const rateLimited = await checkRateLimit(userId, "validate-api-key", cors, 10);
    if (rateLimited) return rateLimited;
    const log = createRequestLogger("validate-api-key", userId);

    const { provider_id, api_key } = await req.json();

    if (!provider_id || typeof provider_id !== "string") {
      return errorResponse("provider_id inválido", 400, cors, "VALIDATION_ERROR");
    }
    if (!api_key || typeof api_key !== "string" || api_key.length < 10 || api_key.length > 500) {
      return errorResponse("API key inválida", 400, cors, "VALIDATION_ERROR");
    }

    log.info("validating", { provider_id });

    let valid = false;
    let errorMsg: string | undefined;

    try {
      switch (provider_id) {
        case "google": {
          // Lightweight call: list models
          const res = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${api_key}&pageSize=1`,
            { method: "GET" },
            { maxRetries: 1, timeoutMs: 10_000 },
          );
          valid = res.ok;
          if (!valid) errorMsg = `HTTP ${res.status}: ${await res.text().catch(() => "unknown")}`;
          break;
        }

        case "openai": {
          const res = await fetchWithRetry(
            "https://api.openai.com/v1/models?limit=1",
            {
              method: "GET",
              headers: { Authorization: `Bearer ${api_key}` },
            },
            { maxRetries: 1, timeoutMs: 10_000 },
          );
          valid = res.ok;
          if (!valid) errorMsg = `HTTP ${res.status}: ${await res.text().catch(() => "unknown")}`;
          break;
        }

        case "anthropic": {
          // Anthropic doesn't have a /models list endpoint; use a minimal message
          const res = await fetchWithRetry(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-haiku-3.5",
                max_tokens: 1,
                messages: [{ role: "user", content: "hi" }],
              }),
            },
            { maxRetries: 1, timeoutMs: 15_000 },
          );
          // 200 = valid, 401 = invalid key, other errors may be quota but key is valid
          valid = res.status !== 401 && res.status !== 403;
          if (!valid) errorMsg = `HTTP ${res.status}: chave inválida`;
          break;
        }

        case "replicate": {
          const res = await fetchWithRetry(
            "https://api.replicate.com/v1/account",
            {
              method: "GET",
              headers: { Authorization: `Bearer ${api_key}` },
            },
            { maxRetries: 1, timeoutMs: 10_000 },
          );
          valid = res.ok;
          if (!valid) errorMsg = `HTTP ${res.status}: ${await res.text().catch(() => "unknown")}`;
          break;
        }

        default:
          return errorResponse("Provedor não suportado", 400, cors, "VALIDATION_ERROR");
      }
    } catch (err) {
      errorMsg = (err as Error).message;
      valid = false;
    }

    log.info("validated", { provider_id, valid });

    return new Response(
      JSON.stringify({ valid, error: valid ? undefined : (errorMsg || "Erro desconhecido") }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("validate-api-key error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors, "INTERNAL_ERROR");
  }
});
