-- ============================================================
-- BYOK (Bring Your Own Key) SCHEMA
-- Multi-provider AI with user-managed API keys
-- ============================================================

-- Enable pgsodium for API key encryption
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- ============================================================
-- AI PROVIDERS  (system reference table)
-- ============================================================
CREATE TABLE public.ai_providers (
  id              TEXT        NOT NULL PRIMARY KEY,
  name            TEXT        NOT NULL,
  api_base_url    TEXT        NOT NULL,
  supports_text   BOOLEAN     NOT NULL DEFAULT false,
  supports_image_gen BOOLEAN  NOT NULL DEFAULT false,
  supports_vision BOOLEAN     NOT NULL DEFAULT false,
  supports_function_calling BOOLEAN NOT NULL DEFAULT false,
  status          TEXT        NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Public read, only service_role can write
CREATE POLICY "ai_providers_select" ON public.ai_providers FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- AI MODELS  (system reference table)
-- ============================================================
CREATE TABLE public.ai_models (
  id                  TEXT        NOT NULL PRIMARY KEY,
  provider_id         TEXT        NOT NULL REFERENCES public.ai_providers(id),
  display_name        TEXT        NOT NULL,
  capabilities        TEXT[]      NOT NULL DEFAULT '{}',
  recommended_for     TEXT[]      NOT NULL DEFAULT '{}',
  cost_per_1k_input   NUMERIC,
  cost_per_1k_output  NUMERIC,
  cost_per_image      NUMERIC,
  max_context_tokens  INTEGER,
  status              TEXT        NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_models_select" ON public.ai_models FOR SELECT
  TO authenticated USING (true);

CREATE INDEX idx_ai_models_provider ON public.ai_models(provider_id);

-- ============================================================
-- USER API KEYS  (encrypted, one per provider per user)
-- ============================================================
CREATE TABLE public.user_api_keys (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id     TEXT        NOT NULL REFERENCES public.ai_providers(id),
  encrypted_key   BYTEA       NOT NULL,
  key_id          UUID        NOT NULL,
  key_hint        TEXT        NOT NULL,
  is_valid        BOOLEAN     NOT NULL DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_api_keys_select" ON public.user_api_keys FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "user_api_keys_insert" ON public.user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_api_keys_update" ON public.user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "user_api_keys_delete" ON public.user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_api_keys_user ON public.user_api_keys(user_id);

-- ============================================================
-- USER AI CONFIG  (per-function provider/model selection)
-- ============================================================
CREATE TABLE public.user_ai_config (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT        NOT NULL,
  provider_id   TEXT        NOT NULL REFERENCES public.ai_providers(id),
  model_id      TEXT        NOT NULL REFERENCES public.ai_models(id),
  temperature   NUMERIC     NOT NULL DEFAULT 0.7
                            CHECK (temperature >= 0 AND temperature <= 2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_name)
);

ALTER TABLE public.user_ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ai_config_select" ON public.user_ai_config FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "user_ai_config_insert" ON public.user_ai_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_ai_config_update" ON public.user_ai_config FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "user_ai_config_delete" ON public.user_ai_config FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_ai_config_updated_at
  BEFORE UPDATE ON public.user_ai_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_ai_config_user ON public.user_ai_config(user_id);

-- ============================================================
-- USAGE LOGS  (append-only telemetry)
-- ============================================================
CREATE TABLE public.usage_logs (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT        NOT NULL,
  provider_id   TEXT        NOT NULL,
  model_id      TEXT        NOT NULL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  cost_cents    NUMERIC,
  latency_ms    INTEGER,
  status        TEXT        NOT NULL,
  error_message TEXT,
  request_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_logs_select" ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_usage_logs_user_created ON public.usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_user_fn ON public.usage_logs(user_id, function_name, created_at DESC);

-- ============================================================
-- ENCRYPTION HELPERS  (security definer — server-side only)
-- ============================================================

-- Create a named server key for API key encryption
SELECT pgsodium.create_key(
  name := 'user_api_keys_v1',
  key_type := 'aead-det'
);

-- Encrypt an API key. Returns (encrypted_bytes, key_id).
CREATE OR REPLACE FUNCTION public.encrypt_api_key(
  raw_key TEXT
)
RETURNS TABLE(encrypted BYTEA, key_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pgsodium
AS $$
  SELECT
    pgsodium.crypto_aead_det_encrypt(
      convert_to(raw_key, 'utf8'),
      convert_to('', 'utf8'),  -- additional data (empty)
      k.id
    ) AS encrypted,
    k.id AS key_id
  FROM pgsodium.valid_key k
  WHERE k.name = 'user_api_keys_v1'
  LIMIT 1;
$$;

-- Decrypt an API key. Returns plaintext.
CREATE OR REPLACE FUNCTION public.decrypt_api_key(
  encrypted_data BYTEA,
  encryption_key_id UUID
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pgsodium
AS $$
  SELECT convert_from(
    pgsodium.crypto_aead_det_decrypt(
      encrypted_data,
      convert_to('', 'utf8'),  -- additional data (must match encrypt)
      encryption_key_id
    ),
    'utf8'
  );
$$;

-- Revoke direct execution from public — only callable via service_role
REVOKE EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_api_key(BYTEA, UUID) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- SEED DATA  — Providers
-- ============================================================
INSERT INTO public.ai_providers (id, name, api_base_url, supports_text, supports_image_gen, supports_vision, supports_function_calling) VALUES
  ('google',    'Google (Gemini)',       'https://generativelanguage.googleapis.com/v1beta', true,  true,  true,  true),
  ('openai',    'OpenAI',                'https://api.openai.com/v1',                        true,  true,  true,  true),
  ('anthropic', 'Anthropic (Claude)',    'https://api.anthropic.com/v1',                     true,  false, true,  true),
  ('replicate', 'Replicate',             'https://api.replicate.com/v1',                     false, true,  false, false);

-- ============================================================
-- SEED DATA  — Models
-- ============================================================
INSERT INTO public.ai_models (id, provider_id, display_name, capabilities, recommended_for, cost_per_1k_input, cost_per_1k_output, cost_per_image, max_context_tokens) VALUES
  -- Google
  ('gemini-2.5-flash',                       'google',    'Gemini 2.5 Flash',             ARRAY['text','vision','function_calling'], ARRAY['identify','ads','prompts','overlay_copy'], 0.00015, 0.0006,  NULL,    1048576),
  ('gemini-2.0-flash-preview-image-generation','google',  'Gemini 2.0 Flash Image Gen',   ARRAY['text','image_gen','vision'],        ARRAY['image'],                                   0.00015, 0.0006,  0.039,   1048576),
  -- OpenAI
  ('gpt-4o',                                 'openai',    'GPT-4o',                        ARRAY['text','vision','function_calling'], ARRAY['identify','ads','prompts','overlay_copy'], 0.0025,  0.01,    NULL,    128000),
  ('gpt-4o-mini',                            'openai',    'GPT-4o Mini',                   ARRAY['text','vision','function_calling'], ARRAY['ads','overlay_copy'],                      0.00015, 0.0006,  NULL,    128000),
  ('dall-e-3',                               'openai',    'DALL-E 3',                      ARRAY['image_gen'],                        ARRAY['image'],                                   NULL,    NULL,    0.04,    NULL),
  -- Anthropic
  ('claude-sonnet-4-20250514',               'anthropic', 'Claude Sonnet 4',               ARRAY['text','vision','function_calling'], ARRAY['identify','ads','prompts','overlay_copy'], 0.003,   0.015,   NULL,    200000),
  ('claude-haiku-3.5',                       'anthropic', 'Claude 3.5 Haiku',              ARRAY['text','vision','function_calling'], ARRAY['ads','overlay_copy'],                      0.0008,  0.004,   NULL,    200000),
  -- Replicate
  ('flux-1.1-pro',                           'replicate', 'Flux 1.1 Pro',                  ARRAY['image_gen'],                        ARRAY['image'],                                   NULL,    NULL,    0.04,    NULL),
  ('flux-schnell',                           'replicate', 'Flux Schnell',                  ARRAY['image_gen'],                        ARRAY['image'],                                   NULL,    NULL,    0.003,   NULL);
