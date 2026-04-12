import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, authenticate, errorResponse, createRequestLogger, checkRateLimit, encryptApiKey } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;
    const { userId } = auth as { userId: string };
    const log = createRequestLogger("manage-api-keys", userId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── GET: List user's API keys (hints only, never full keys) ──
    if (req.method === "GET") {
      log.info("list-keys");
      const { data, error } = await supabaseAdmin
        .from("user_api_keys")
        .select("id, provider_id, key_hint, is_valid, last_validated_at, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        log.error("list-keys-failed", { error: error.message });
        return errorResponse("Erro ao buscar chaves", 500, cors, "INTERNAL_ERROR");
      }

      return new Response(JSON.stringify({ keys: data }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── POST: Save/update an API key ──
    if (req.method === "POST") {
      const rateLimited = await checkRateLimit(userId, "manage-api-keys", cors, 30);
      if (rateLimited) return rateLimited;

      const { provider_id, api_key } = await req.json();

      if (!provider_id || typeof provider_id !== "string" || provider_id.length > 50) {
        return errorResponse("provider_id inválido", 400, cors, "VALIDATION_ERROR");
      }
      if (!api_key || typeof api_key !== "string" || api_key.length < 10 || api_key.length > 500) {
        return errorResponse("API key inválida (10-500 caracteres)", 400, cors, "VALIDATION_ERROR");
      }

      // Verify provider exists
      const { data: provider, error: providerErr } = await supabaseAdmin
        .from("ai_providers")
        .select("id")
        .eq("id", provider_id)
        .single();

      if (providerErr || !provider) {
        return errorResponse("Provedor não encontrado", 404, cors, "VALIDATION_ERROR");
      }

      // Encrypt the key using AES-GCM (edge-function crypto, no pgsodium)
      const { encrypted: encryptedKey, nonce: keyNonce } = await encryptApiKey(api_key);

      // Generate hint from last 4 chars
      const keyHint = "..." + api_key.slice(-4);

      // Upsert (one key per provider per user)
      const { error: upsertErr } = await supabaseAdmin
        .from("user_api_keys")
        .upsert(
          {
            user_id: userId,
            provider_id,
            encrypted_key: encryptedKey,
            key_nonce: keyNonce,
            key_hint: keyHint,
            is_valid: true,
            last_validated_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider_id" },
        );

      if (upsertErr) {
        log.error("upsert-failed", { error: upsertErr.message });
        return errorResponse("Erro ao salvar chave", 500, cors, "INTERNAL_ERROR");
      }

      log.info("key-saved", { provider_id });

      return new Response(JSON.stringify({ success: true, key_hint: keyHint }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── DELETE: Remove an API key ──
    if (req.method === "DELETE") {
      const { provider_id } = await req.json();

      if (!provider_id || typeof provider_id !== "string") {
        return errorResponse("provider_id inválido", 400, cors, "VALIDATION_ERROR");
      }

      const { error: deleteErr } = await supabaseAdmin
        .from("user_api_keys")
        .delete()
        .eq("user_id", userId)
        .eq("provider_id", provider_id);

      if (deleteErr) {
        log.error("delete-failed", { error: deleteErr.message });
        return errorResponse("Erro ao remover chave", 500, cors, "INTERNAL_ERROR");
      }

      // Also remove any AI config that references this provider
      await supabaseAdmin
        .from("user_ai_config")
        .delete()
        .eq("user_id", userId)
        .eq("provider_id", provider_id);

      log.info("key-deleted", { provider_id });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return errorResponse("Method not allowed", 405, cors);
  } catch (e) {
    console.error("manage-api-keys error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors, "INTERNAL_ERROR");
  }
});
